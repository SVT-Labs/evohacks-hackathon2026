/**
 * POST /api/generate
 *
 * Turns lecture notes into a Bridge report.
 *
 * Request: multipart/form-data
 *   file      PDF, optional, up to 10 MB
 *   text      pasted notes, optional (at least one of file/text is required)
 *   interest  required, e.g. "football tactics"
 *   level     optional, defaults to "undergraduate"
 *   language  optional, "en" (default) or "tr"
 *
 * Response: a Report (see lib/types.ts) with status 200,
 *           or { "error": string } with a 4xx/5xx status.
 *
 * Example calls are at the bottom of this file.
 */
import { NextResponse } from "next/server";
import { MAX_FILE_BYTES, MIN_NOTES_CHARS } from "@/lib/constants";
import { LlmError, generateReport } from "@/lib/llm";
import { prepareNotes } from "@/lib/notes";
import { PdfError, extractPdfText, looksLikePdf } from "@/lib/pdf";
import { checkRateLimit, getClientKey } from "@/lib/rate-limit";
import { SAMPLE_REPORT } from "@/lib/sample";
import { GenerateInputSchema, describeIssues, type ApiError } from "@/lib/types";

// pdf-parse and the OpenAI SDK need the Node.js runtime, not the Edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Seconds a serverless host may spend on one request. It must stay above the
// LLM time budget in lib/llm.ts (110 s), which covers one generation and one retry.
export const maxDuration = 120;

/** Slack on top of the file limit for the other form fields and multipart framing. */
const FORM_OVERHEAD_BYTES = 1024 * 1024;

const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);

function jsonError(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json<ApiError>({ error }, { status, headers });
}

/** Reads a text field; missing, empty and non-text values all become undefined. */
function textField(form: FormData, name: string): string | undefined {
  const value = form.get(name);
  return typeof value === "string" && value.trim() ? value : undefined;
}

export async function POST(request: Request) {
  // 1. Demo mode: answer with the cached sample and never touch the LLM.
  if (process.env.DEMO_MODE === "true") {
    return NextResponse.json(SAMPLE_REPORT, { headers: { "X-Bridge-Demo": "true" } });
  }

  // 2. Rate limit per client IP.
  const rateLimit = checkRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return jsonError(
      `Too many requests. Please wait ${rateLimit.retryAfterSeconds} seconds and try again.`,
      429,
      { "Retry-After": String(rateLimit.retryAfterSeconds) },
    );
  }

  // 3. Read the form, refusing oversized uploads before buffering them.
  if (!request.headers.get("content-type")?.includes("multipart/form-data")) {
    return jsonError("Send the request as multipart/form-data.", 415);
  }
  const declaredBytes = Number(request.headers.get("content-length") ?? 0);
  if (declaredBytes > MAX_FILE_BYTES + FORM_OVERHEAD_BYTES) {
    return jsonError(`The upload is too large. The limit is ${MAX_FILE_MB} MB.`, 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("The form data could not be read.", 400);
  }

  // 4. Validate the text fields.
  const input = GenerateInputSchema.safeParse({
    interest: textField(form, "interest"),
    level: textField(form, "level"),
    language: textField(form, "language"),
  });
  if (!input.success) {
    return jsonError(describeIssues(input.error), 400);
  }

  // 5. Collect the lecture notes from the PDF and/or the pasted text.
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;
  let pdfText = "";

  if (hasFile) {
    if (file.size > MAX_FILE_BYTES) {
      return jsonError(`The PDF is too large. The limit is ${MAX_FILE_MB} MB.`, 413);
    }
    if (!looksLikePdf(file)) {
      return jsonError("Only PDF files are supported.", 415);
    }
    try {
      pdfText = await extractPdfText(file);
    } catch (error) {
      if (error instanceof PdfError) return jsonError(error.message, 422);
      console.error("[bridge] Unexpected PDF error:", error);
      return jsonError("The PDF could not be processed.", 500);
    }
  }

  const pastedText = textField(form, "text") ?? "";
  const notes = prepareNotes([pdfText, pastedText].filter(Boolean).join("\n\n"));

  if (!notes.text) {
    return hasFile
      ? jsonError(
          "No text could be extracted from this PDF. It may contain only scanned images. Try pasting the text instead.",
          422,
        )
      : jsonError("Upload a PDF or paste your lecture notes.", 400);
  }
  if (notes.text.length < MIN_NOTES_CHARS) {
    return jsonError(
      `The notes are too short to build a report (${notes.text.length} characters). Provide at least ${MIN_NOTES_CHARS}.`,
      422,
    );
  }

  // 6. Generate, validate (with one retry inside generateReport) and respond.
  try {
    const result = await generateReport({ ...input.data, notes: notes.text });
    if (!result.ok) {
      return jsonError(result.error, 422);
    }
    return NextResponse.json(result.report, {
      // Lets the UI mention that long notes were shortened before analysis.
      headers: { "X-Bridge-Notes-Truncated": String(notes.truncated) },
    });
  } catch (error) {
    if (error instanceof LlmError) return jsonError(error.message, error.status);
    console.error("[bridge] Unexpected error in /api/generate:", error);
    return jsonError("Something went wrong while generating the report.", 500);
  }
}

/*
 * ── Example calls, written as test cases ───────────────────────────────────
 *
 * Start the app with `npm run dev`, then run the curl commands from the project
 * root. Each case lists the environment it needs and the result to expect.
 *
 * it("returns the cached sample when DEMO_MODE=true")
 *   env:    DEMO_MODE=true (no API key needed)
 *   call:   curl -i -X POST http://localhost:3000/api/generate -F "interest=football tactics"
 *   expect: 200, header X-Bridge-Demo: true, body.title === SAMPLE_REPORT.title
 *
 * it("generates a report from pasted text")
 *   env:    DEMO_MODE=false, LLM_API_KEY set
 *   call:   curl -X POST http://localhost:3000/api/generate \
 *             -F "text=<lecture-notes.txt" -F "interest=football tactics" \
 *             -F "level=high school" -F "language=en"
 *   expect: 200, body passes ReportSchema: 4-6 concepts, 5 quiz items, 3 next_steps
 *
 * it("generates a Turkish report from a PDF")
 *   call:   curl -X POST http://localhost:3000/api/generate \
 *             -F "file=@lecture.pdf;type=application/pdf" -F "interest=basketbol" -F "language=tr"
 *   expect: 200, body.language === "tr", header X-Bridge-Notes-Truncated: true for long PDFs
 *
 * it("rejects a request without an interest")
 *   call:   curl -i -X POST http://localhost:3000/api/generate -F "text=<lecture-notes.txt"
 *   expect: 400, { "error": "interest: Tell us what you are interested in." }
 *
 * it("rejects an unsupported language")
 *   call:   curl -i -X POST http://localhost:3000/api/generate \
 *             -F "text=<lecture-notes.txt" -F "interest=chess" -F "language=de"
 *   expect: 400, { "error": "language: Language must be one of: en, tr." }
 *
 * it("rejects a request with neither file nor text")
 *   call:   curl -i -X POST http://localhost:3000/api/generate -F "interest=chess"
 *   expect: 400, { "error": "Upload a PDF or paste your lecture notes." }
 *
 * it("rejects notes that are too short")
 *   call:   curl -i -X POST http://localhost:3000/api/generate -F "text=Equilibrium." -F "interest=chess"
 *   expect: 422, error mentions "too short"
 *
 * it("rejects a file that is not a PDF")
 *   call:   curl -i -X POST http://localhost:3000/api/generate -F "file=@package.json" -F "interest=chess"
 *   expect: 415, { "error": "Only PDF files are supported." }
 *
 * it("rejects a PDF over 10 MB")
 *   call:   curl -i -X POST http://localhost:3000/api/generate \
 *             -F "file=@big.pdf;type=application/pdf" -F "interest=chess"
 *   expect: 413, error mentions "too large"
 *
 * it("rejects a JSON body")
 *   call:   curl -i -X POST http://localhost:3000/api/generate \
 *             -H "Content-Type: application/json" -d '{"interest":"chess"}'
 *   expect: 415, { "error": "Send the request as multipart/form-data." }
 *
 * it("rate-limits an eleventh request within one minute")
 *   call:   for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" \
 *             -X POST http://localhost:3000/api/generate -F "interest=chess"; done
 *   expect: ten times 400, then 429 with a Retry-After header
 *
 * it("passes on the model's own refusal for off-topic notes")
 *   call:   curl -i -X POST http://localhost:3000/api/generate \
 *             -F "text=<shopping-list.txt" -F "interest=chess"
 *   expect: 422, { "error": "<the model's explanation>" }
 *
 * it("reports a missing API key")
 *   env:    DEMO_MODE=false, LLM_API_KEY empty
 *   call:   the "pasted text" call above
 *   expect: 500, error mentions LLM_API_KEY
 *
 * The same request from the browser:
 *
 *   const form = new FormData();
 *   form.append("file", pdfFile);             // optional
 *   form.append("text", pastedNotes);         // optional
 *   form.append("interest", "football tactics");
 *   form.append("level", "undergraduate");
 *   form.append("language", "en");
 *   const response = await fetch("/api/generate", { method: "POST", body: form });
 *   const data: GenerateResponse = await response.json();
 *   if (!response.ok || isApiError(data)) showError(data.error); else showReport(data);
 */
