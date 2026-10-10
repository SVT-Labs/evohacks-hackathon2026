/**
 * PDF text extraction. Server-only: it needs Node's Buffer.
 */
// Import the implementation file, not the package root: pdf-parse's index.js
// tries to read a test PDF from disk when it thinks it is being run directly,
// which crashes inside a bundled Next.js route.
import pdfParse from "pdf-parse/lib/pdf-parse.js";

/** Pages read from a PDF. Enough for a long slide deck; bounds parsing time. */
const MAX_PDF_PAGES = 100;

/** A problem with the uploaded file that the user can act on. */
export class PdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfError";
  }
}

/** True when the upload is declared as a PDF by its MIME type or file name. */
export function looksLikePdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Returns the text of a PDF. The result is an empty string for PDFs that hold
 * only scanned images.
 *
 * @throws PdfError when the bytes are not a PDF or the PDF cannot be read.
 */
export async function extractPdfText(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  // Every PDF carries the "%PDF-" signature within its first kilobyte.
  if (!buffer.subarray(0, 1024).includes("%PDF-")) {
    throw new PdfError("That file is not a valid PDF.");
  }

  try {
    const result = await pdfParse(buffer, { max: MAX_PDF_PAGES });
    return result.text;
  } catch (cause) {
    console.error("[bridge] pdf-parse failed:", cause);
    throw new PdfError(
      "The PDF could not be read. It may be password-protected or damaged. Try pasting the text instead.",
    );
  }
}
