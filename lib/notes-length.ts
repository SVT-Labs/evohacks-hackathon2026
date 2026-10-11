/**
 * Length of the notes after the server's clean-up, so the counter never says
 * "enough" for text the API then rejects as too short. Mirrors cleanText in
 * lib/notes.ts (imported there with the prompt, which should not ship to the browser).
 */
export function serverLength(raw: string): number {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim().length;
}
