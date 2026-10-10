/**
 * Cleans lecture notes and, when they are too long for the LLM, shortens them
 * by headings: every section keeps its heading and opening lines, so every
 * topic of the lecture stays visible instead of the tail being cut off.
 */
import { MAX_NOTES_CHARS } from "./constants";
import { OMISSION_MARKER } from "./prompt";

export interface PreparedNotes {
  /** The notes to send to the LLM, never longer than the limit. */
  text: string;
  /** True when something was left out to fit the limit. */
  truncated: boolean;
  /** Length of the cleaned notes before shortening. */
  originalLength: number;
}

interface Section {
  /** Position in the document, to restore reading order after budgeting. */
  index: number;
  /** Heading line plus body. */
  text: string;
}

/** Characters added to a section that was cut, and between two sections. */
const CUT_SUFFIX = `\n${OMISSION_MARKER}`;
const SECTION_GAP = "\n\n";

/** Words that open a heading when a number follows, in English and Turkish. */
const HEADING_KEYWORDS =
  /^(chapter|section|lecture|part|unit|topic|module|week|bölüm|konu|ünite|ders|kısım|hafta)\s+(\d+|[ivxlc]+)\b/i;

/** Normalises line endings and collapses the stray whitespace PDF extraction leaves behind. */
export function cleanText(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/\u0000/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Heuristic: does this line look like a section heading? */
function isHeading(line: string, standsAlone: boolean): boolean {
  if (line.length < 3 || line.length > 80) return false;
  if (line.split(" ").length > 12) return false;
  if (/^#{1,6} \S/.test(line)) return true; // Markdown heading
  if (/[.,;]$/.test(line)) return false; // reads like a sentence
  if (/[=+→⇌]/.test(line)) return false; // an equation or formula, e.g. "2 NO2 ⇌ N2O4"
  if (HEADING_KEYWORDS.test(line)) return true; // "Lecture 5: ...", "Bölüm 2"
  if (/^\d{1,2}(\.\d{1,2}){0,3}[.)]? \p{Lu}/u.test(line)) return true; // "2.1 Reaction rates"
  const letters = line.replace(/[^\p{L}]/gu, "");
  if (letters.length >= 4 && letters === letters.toUpperCase()) return true; // "LE CHATELIER"
  // A short capitalised line with blank lines around it.
  return standsAlone && /^\p{Lu}/u.test(line) && line.split(" ").length <= 8;
}

/** Splits text into sections that each start at a heading. Text before the first heading is its own section. */
function splitIntoSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: string[] = [];

  const flush = () => {
    const body = current.join("\n").trim();
    if (body) sections.push({ index: sections.length, text: body });
    current = [];
  };

  lines.forEach((line, i) => {
    const standsAlone = (lines[i - 1] ?? "") === "" && (lines[i + 1] ?? "") === "";
    if (isHeading(line, standsAlone)) flush();
    current.push(line);
  });
  flush();
  return sections;
}

/** Cuts text to at most `max` characters, preferring a paragraph, sentence, line or word boundary. */
function cutAtBoundary(text: string, max: number): string {
  if (text.length <= max) return text;
  const slice = text.slice(0, max);
  const earliest = Math.floor(max * 0.6); // never give up more than 40% for a clean cut
  const sentenceEnd = Math.max(
    slice.lastIndexOf(". "),
    slice.lastIndexOf(".\n"),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
  );
  const boundaries = [
    slice.lastIndexOf("\n\n"),
    sentenceEnd === -1 ? -1 : sentenceEnd + 1, // keep the punctuation mark
    slice.lastIndexOf("\n"),
    slice.lastIndexOf(" "),
  ];
  const cut = boundaries.find((position) => position >= earliest);
  return (cut === undefined ? slice : slice.slice(0, cut)).trimEnd();
}

/** Fallback for notes without headings: keep the opening and the closing part. */
function keepHeadAndTail(text: string, limit: number): string {
  const budget = limit - CUT_SUFFIX.length - SECTION_GAP.length;
  const head = cutAtBoundary(text, Math.floor(budget * 0.7));
  const tailStart = text.length - Math.floor(budget * 0.3);
  // Start the tail at the next line or sentence so it does not open mid-word.
  const rest = text.slice(tailStart);
  const boundary = rest.search(/\n|[.?!] /);
  const tail = boundary === -1 ? rest : rest.slice(boundary + 1).trimStart();
  return `${head}${CUT_SUFFIX}${SECTION_GAP}${tail}`;
}

/**
 * Shares the character budget between sections so that short sections are kept
 * whole and long ones are capped at the same length ("water-filling").
 */
function shortenByHeadings(sections: Section[], limit: number): string | null {
  let budget = limit - sections.length * (CUT_SUFFIX.length + SECTION_GAP.length);
  if (budget < sections.length * 80) return null; // too many sections to show each one

  const allowance = new Map<number, number>();
  const shortestFirst = [...sections].sort((a, b) => a.text.length - b.text.length);
  shortestFirst.forEach((section, done) => {
    const fairShare = Math.floor(budget / (sections.length - done));
    const granted = Math.min(section.text.length, fairShare);
    allowance.set(section.index, granted);
    budget -= granted;
  });

  return sections
    .map((section) => {
      const granted = allowance.get(section.index) ?? 0;
      return section.text.length <= granted
        ? section.text
        : `${cutAtBoundary(section.text, granted)}${CUT_SUFFIX}`;
    })
    .join(SECTION_GAP);
}

/** Cleans the notes and shortens them to `limit` characters if needed. */
export function prepareNotes(raw: string, limit: number = MAX_NOTES_CHARS): PreparedNotes {
  const text = cleanText(raw);
  if (text.length <= limit) {
    return { text, truncated: false, originalLength: text.length };
  }

  const sections = splitIntoSections(text);
  const shortened =
    (sections.length >= 2 ? shortenByHeadings(sections, limit) : null) ??
    keepHeadAndTail(text, limit);

  return {
    // The slice is a safety net; both strategies already stay within the limit.
    text: shortened.slice(0, limit),
    truncated: true,
    originalLength: text.length,
  };
}
