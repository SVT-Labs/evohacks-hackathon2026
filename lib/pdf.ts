/**
 * Reading uploaded PDFs. Server-only: it needs Node's Buffer.
 */
import { getDocumentProxy } from "unpdf";

/** Pages whose text is read. Enough for a long slide deck; bounds parsing time. */
const MAX_PDF_PAGES = 100;

/** A problem with the uploaded file that the user can act on. */
export class PdfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfError";
  }
}

export interface PdfContent {
  /**
   * The selectable text: one line of the page per line, a blank line between
   * pages. Empty for PDFs that hold only images or drawings, such as scans and
   * handwritten notes.
   */
  text: string;
  /** Pages in the whole document, including any beyond the ones whose text was read. */
  pageCount: number;
}

/** True when the upload is declared as a PDF by its MIME type or file name. */
export function looksLikePdf(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Reads the selectable text and the page count of a PDF.
 *
 * @throws PdfError when the bytes are not a PDF or the PDF cannot be read.
 */
export async function readPdf(file: File): Promise<PdfContent> {
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Every PDF carries the "%PDF-" signature within its first kilobyte.
  if (!Buffer.from(bytes.buffer, 0, Math.min(bytes.length, 1024)).includes("%PDF-")) {
    throw new PdfError("That file is not a valid PDF.");
  }

  try {
    // verbosity 0: pdf.js otherwise logs a warning for every quirk of a file.
    const pdf = await getDocumentProxy(bytes, { verbosity: 0 });
    try {
      const pages: string[] = [];
      for (let number = 1; number <= Math.min(pdf.numPages, MAX_PDF_PAGES); number++) {
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        pages.push(
          content.items
            // Marked-content markers have no text; text items say when their line ends.
            .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : "") : ""))
            .join(""),
        );
      }
      return { text: pages.join("\n\n"), pageCount: pdf.numPages };
    } finally {
      await pdf.loadingTask.destroy(); // frees the document; nothing is kept between uploads
    }
  } catch (cause) {
    console.error("[bridge] Reading the PDF failed:", cause);
    throw new PdfError(
      "The PDF could not be read. It may be password-protected or damaged. Try pasting the text instead.",
    );
  }
}

/** The whole file as a base64 data URL, the form in which the LLM API accepts a PDF. */
export async function pdfDataUrl(file: File): Promise<string> {
  return `data:application/pdf;base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
}
