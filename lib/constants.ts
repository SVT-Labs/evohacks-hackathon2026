/**
 * Limits and keys shared by the browser form and the API route, so the client
 * can reject bad input with the same numbers the server enforces.
 */

/** Largest PDF the API accepts. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Lecture notes longer than this are shortened before they reach the LLM. */
export const MAX_NOTES_CHARS = 15_000;

/** Notes shorter than this cannot yield 4-6 concepts, so they are rejected early. */
export const MIN_NOTES_CHARS = 200;

export const MAX_INTEREST_CHARS = 120;
export const MAX_LEVEL_CHARS = 60;

/** Used when the form does not send a level. */
export const DEFAULT_LEVEL = "undergraduate";

/** sessionStorage key the form writes the generated report to and /report reads. */
export const REPORT_STORAGE_KEY = "bridge:report";

/** sessionStorage key for "true" when the stored report came from demo mode (X-Bridge-Demo header). */
export const DEMO_FLAG_STORAGE_KEY = "bridge:demo";
