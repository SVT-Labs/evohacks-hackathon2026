/**
 * Talks to the LLM (OpenAI's Chat Completions API, or any compatible endpoint)
 * and turns its reply into a validated Report. Server-only.
 *
 * Environment:
 *   LLM_API_KEY            required
 *   LLM_MODEL              optional, defaults to DEFAULT_MODEL
 *   LLM_REASONING_EFFORT   optional, for reasoning models (e.g. "low")
 *   LLM_BASE_URL           optional, for OpenAI-compatible providers
 */
import OpenAI from "openai";
import { SYSTEM_PROMPT, buildRetryPrompt, buildUserPrompt } from "./prompt";
import { ApiErrorSchema, ReportSchema, describeIssues, type GenerateInput, type Report } from "./types";

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;
type ChatParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming;

const DEFAULT_MODEL = "gpt-6-luna";

/** Room for a full report in Turkish plus the model's reasoning tokens. */
const MAX_OUTPUT_TOKENS = 12_000;

/** One generation plus one corrective retry. */
const MAX_ATTEMPTS = 2;

/**
 * Time allowed for all LLM calls of one request. Keep it below `maxDuration`
 * in app/api/generate/route.ts so the route can still answer with a JSON error.
 */
const TOTAL_BUDGET_MS = 110_000;

/** A corrective retry is only started if at least this much of the budget is left. */
const MIN_RETRY_WINDOW_MS = 20_000;

/**
 * Request parameters that some models or compatible providers reject. When the
 * API answers 400 and names one of them, it is dropped and the call repeated.
 * The prompt alone still asks for JSON, so the reply stays usable.
 */
const OPTIONAL_PARAMS = ["response_format", "reasoning_effort", "max_completion_tokens"] as const;

/** A failure with the HTTP status the API route should answer with. */
export class LlmError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export type GenerateResult =
  | { ok: true; report: Report }
  /** The model judged the notes too short or off-topic and said why. */
  | { ok: false; error: string };

type ParsedReply =
  | { kind: "report"; report: Report }
  | { kind: "declined"; reason: string }
  | { kind: "invalid"; problem: string };

/**
 * Generates a Report from lecture notes.
 *
 * If the reply is not valid JSON or does not match ReportSchema, the model gets
 * one more attempt with the validation errors appended to the conversation.
 *
 * @throws LlmError on configuration problems, provider errors, or a second invalid reply.
 */
export async function generateReport(
  input: GenerateInput & { notes: string },
): Promise<GenerateResult> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new LlmError(
      "The server has no LLM_API_KEY. Add it to .env.local, or set DEMO_MODE=true to use the sample report.",
      500,
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.LLM_BASE_URL || undefined,
    maxRetries: 1,
  });
  const deadline = Date.now() + TOTAL_BUDGET_MS;
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(input) },
  ];

  let lastProblem = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await callModel(client, messages, deadline - Date.now());
    const reply = parseReply(raw);

    if (reply.kind === "report") {
      // The language is the caller's choice, so it is not left to the model.
      return { ok: true, report: { ...reply.report, language: input.language } };
    }
    if (reply.kind === "declined") {
      return { ok: false, error: reply.reason };
    }

    lastProblem = reply.problem;
    console.warn(`[bridge] LLM reply failed validation (attempt ${attempt}):\n${lastProblem}`);
    if (deadline - Date.now() < MIN_RETRY_WINDOW_MS) break; // a retry could not finish in time
    messages.push(
      { role: "assistant", content: raw },
      { role: "user", content: buildRetryPrompt(lastProblem) },
    );
  }

  throw new LlmError(
    `The model returned a report in the wrong format. Please try again. Details: ${lastProblem.split("\n")[0]}`,
    502,
  );
}

/** Sends the conversation and returns the model's raw text reply, giving up after `timeoutMs`. */
async function callModel(
  client: OpenAI,
  messages: ChatMessage[],
  timeoutMs: number,
): Promise<string> {
  // The signal bounds the whole call, including the SDK's own retries and the
  // parameter fallback below; `timeout` alone would restart with every retry.
  const signal = AbortSignal.timeout(timeoutMs);
  const params: ChatParams = {
    model: process.env.LLM_MODEL || DEFAULT_MODEL,
    messages,
    response_format: { type: "json_object" },
    max_completion_tokens: MAX_OUTPUT_TOKENS,
  };
  const effort = process.env.LLM_REASONING_EFFORT;
  if (effort) params.reasoning_effort = effort as ChatParams["reasoning_effort"];

  for (;;) {
    try {
      const completion = await client.chat.completions.create(params, {
        timeout: timeoutMs,
        signal,
      });
      const choice = completion.choices[0];

      if (choice?.message.refusal) {
        throw new LlmError("The model declined to work with these notes.", 422);
      }
      if (choice?.finish_reason === "content_filter") {
        throw new LlmError("The provider's content filter blocked these notes.", 422);
      }
      if (choice?.finish_reason === "length") {
        throw new LlmError("The model's answer was cut off before it finished. Please try again.", 502);
      }
      const content = choice?.message.content;
      if (!content) {
        throw new LlmError("The model returned an empty answer. Please try again.", 502);
      }
      return content;
    } catch (error) {
      if (error instanceof OpenAI.BadRequestError && dropRejectedParam(params, error)) continue;
      throw toLlmError(error, params.model);
    }
  }
}

/** Removes the optional parameter a 400 response complains about. Returns false if there is none. */
function dropRejectedParam(params: ChatParams, error: InstanceType<typeof OpenAI.BadRequestError>): boolean {
  const rejected = OPTIONAL_PARAMS.find(
    (name) => name in params && (error.param === name || error.message.includes(name)),
  );
  if (!rejected) return false;
  console.warn(`[bridge] The LLM rejected "${rejected}"; retrying without it.`);
  delete params[rejected];
  return true;
}

/** Extracts the JSON object from a reply, tolerating code fences or stray text around it. */
function extractJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object found");
  return JSON.parse(raw.slice(start, end + 1));
}

/** Classifies a raw reply as a valid report, a refusal with a reason, or unusable. */
function parseReply(raw: string): ParsedReply {
  let data: unknown;
  try {
    data = extractJson(raw);
  } catch (error) {
    return { kind: "invalid", problem: `The reply was not valid JSON (${(error as Error).message}).` };
  }

  // {"error": "..."} without report content is the model saying the notes are unusable.
  const declined = ApiErrorSchema.safeParse(data);
  if (declined.success && !("concepts" in (data as object))) {
    return { kind: "declined", reason: declined.data.error };
  }

  const report = ReportSchema.safeParse(data);
  return report.success
    ? { kind: "report", report: report.data }
    : { kind: "invalid", problem: describeIssues(report.error) };
}

/**
 * Maps SDK errors to messages that are safe to show a user. Provider messages
 * are logged, not forwarded: an authentication error, for one, echoes part of the key.
 */
function toLlmError(error: unknown, model: string): LlmError {
  if (error instanceof LlmError) return error;
  console.error("[bridge] LLM call failed:", error);

  if (error instanceof OpenAI.AuthenticationError) {
    return new LlmError("The LLM provider rejected the API key. Check LLM_API_KEY.", 500);
  }
  if (error instanceof OpenAI.PermissionDeniedError || error instanceof OpenAI.NotFoundError) {
    return new LlmError(`The model "${model}" is not available for this API key. Check LLM_MODEL.`, 500);
  }
  if (error instanceof OpenAI.RateLimitError) {
    return error.code === "insufficient_quota"
      ? new LlmError("The LLM account is out of credit. Check the provider's billing page.", 503)
      : new LlmError("The LLM provider is busy right now. Please try again in a minute.", 503);
  }
  if (error instanceof OpenAI.APIUserAbortError || error instanceof OpenAI.APIConnectionTimeoutError) {
    return new LlmError("The model took too long to answer. Try again, or use shorter notes.", 504);
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new LlmError("Could not reach the LLM provider. Please try again.", 502);
  }
  if (error instanceof OpenAI.APIError) {
    return new LlmError(`The LLM provider returned an error (HTTP ${error.status ?? "unknown"}).`, 502);
  }
  return new LlmError("Something went wrong while generating the report.", 500);
}
