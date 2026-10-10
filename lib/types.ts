/**
 * The Bridge data contract.
 *
 * `ReportSchema` is the single source of truth for the JSON the LLM must
 * return and the API sends to the browser; the TypeScript types are inferred
 * from it, so the two can never drift apart.
 *
 * The JSON contract it mirrors:
 *
 *   {
 *     "title": "string", "interest": "string", "language": "en | tr", "summary": "string",
 *     "concepts": [{ "id": "c1", "name", "lecture_explanation", "bridge_title",
 *                    "bridge_explanation", "analogy", "analogy_limits", "example",
 *                    "misconception", "strength": 1 }],
 *     "concept_map": {
 *       "nodes": [{ "id": "n1", "label": "string", "type": "lecture | interest" }],
 *       "edges": [{ "from": "n1", "to": "n2", "label": "string" }]
 *     },
 *     "quiz": [{ "question", "options": ["a","b","c","d"], "answer_index": 0, "explanation" }],
 *     "next_steps": ["string"]
 *   }
 */
import { z } from "zod";
import { DEFAULT_LEVEL, MAX_INTEREST_CHARS, MAX_LEVEL_CHARS } from "./constants";

/** A string that still has content after trimming. */
const text = z.string().trim().min(1);

// ── Language ────────────────────────────────────────────────────────────────

export const LANGUAGES = ["en", "tr"] as const;
export const LanguageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof LanguageSchema>;

/** Display names, also used to tell the LLM which language to write in. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  tr: "Türkçe",
};

// ── Concepts ────────────────────────────────────────────────────────────────

export const ConceptSchema = z.object({
  /** Stable id such as "c1". */
  id: text,
  name: text,
  /** The concept as the lecture explains it, in simple words. */
  lecture_explanation: text,
  bridge_title: text,
  /** How the concept connects to the student's interest. */
  bridge_explanation: text,
  analogy: text,
  /** Where the analogy stops matching the real science. Never empty. */
  analogy_limits: text,
  /** A worked example. */
  example: text,
  /** A common misconception about the concept. */
  misconception: text,
  /** How well the interest maps onto the concept: 1 (loose) to 5 (very close). */
  strength: z.number().int().min(1).max(5),
});
export type Concept = z.infer<typeof ConceptSchema>;

// ── Concept map ─────────────────────────────────────────────────────────────

export const NodeTypeSchema = z.enum(["lecture", "interest"]);
export type NodeType = z.infer<typeof NodeTypeSchema>;

export const ConceptMapNodeSchema = z.object({
  /** Stable id such as "n1". */
  id: text,
  label: text,
  type: NodeTypeSchema,
});
export type ConceptMapNode = z.infer<typeof ConceptMapNodeSchema>;

export const ConceptMapEdgeSchema = z.object({
  /** Id of the node the edge starts at. */
  from: text,
  /** Id of the node the edge points to. */
  to: text,
  label: text,
});
export type ConceptMapEdge = z.infer<typeof ConceptMapEdgeSchema>;

export const ConceptMapSchema = z
  .object({
    nodes: z.array(ConceptMapNodeSchema).min(2),
    edges: z.array(ConceptMapEdgeSchema).min(1),
  })
  // A graph renderer breaks on duplicate ids and dangling edges, so reject them here.
  .superRefine((map, ctx) => {
    const ids = new Set<string>();
    map.nodes.forEach((node, index) => {
      if (ids.has(node.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["nodes", index, "id"],
          message: `Duplicate node id "${node.id}"`,
        });
      }
      ids.add(node.id);
    });
    map.edges.forEach((edge, index) => {
      for (const end of ["from", "to"] as const) {
        if (!ids.has(edge[end])) {
          ctx.addIssue({
            code: "custom",
            path: ["edges", index, end],
            message: `Edge points to unknown node id "${edge[end]}"`,
          });
        }
      }
    });
  });
export type ConceptMap = z.infer<typeof ConceptMapSchema>;

// ── Quiz ────────────────────────────────────────────────────────────────────

export const QuizQuestionSchema = z.object({
  question: text,
  /** Exactly four answer options. */
  options: z.array(text).length(4),
  /** Zero-based index into `options` of the correct answer. */
  answer_index: z.number().int().min(0).max(3),
  explanation: text,
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

// ── Report ──────────────────────────────────────────────────────────────────

export const ReportSchema = z
  .object({
    title: text,
    interest: text,
    language: LanguageSchema,
    summary: text,
    /** The 4-6 most important concepts from the lecture notes. */
    concepts: z.array(ConceptSchema).min(4).max(6),
    concept_map: ConceptMapSchema,
    /** Five multiple-choice questions about the lecture concepts. */
    quiz: z.array(QuizQuestionSchema).length(5),
    /** Three suggestions for exploring the interest-side topic. */
    next_steps: z.array(text).length(3),
  })
  .superRefine((report, ctx) => {
    const ids = new Set<string>();
    report.concepts.forEach((concept, index) => {
      if (ids.has(concept.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["concepts", index, "id"],
          message: `Duplicate concept id "${concept.id}"`,
        });
      }
      ids.add(concept.id);
    });
  });
export type Report = z.infer<typeof ReportSchema>;

// ── API request and response ────────────────────────────────────────────────

/**
 * The text fields of the multipart form sent to POST /api/generate.
 * The lecture notes travel next to them as `file` (PDF) and/or `text`.
 */
export const GenerateInputSchema = z.object({
  interest: z
    .string({ error: "Tell us what you are interested in." })
    .trim()
    .min(1, "Tell us what you are interested in.")
    .max(MAX_INTEREST_CHARS, `Keep the interest under ${MAX_INTEREST_CHARS} characters.`),
  /** Free text such as "high school" or "undergraduate". */
  level: z
    .string()
    .trim()
    .min(1)
    .max(MAX_LEVEL_CHARS, `Keep the level under ${MAX_LEVEL_CHARS} characters.`)
    .default(DEFAULT_LEVEL),
  language: z
    .enum(LANGUAGES, { error: `Language must be one of: ${LANGUAGES.join(", ")}.` })
    .default("en"),
});
export type GenerateInput = z.infer<typeof GenerateInputSchema>;

/** Every failure from the API, and the LLM's own "notes are unusable" reply, has this shape. */
export const ApiErrorSchema = z.object({ error: text });
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** What POST /api/generate resolves to. */
export type GenerateResponse = Report | ApiError;

export function isApiError(value: unknown): value is ApiError {
  return ApiErrorSchema.safeParse(value).success;
}

/** Flattens Zod issues into one readable line per problem, e.g. "quiz.2.options: ...". */
export function describeIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("\n");
}
