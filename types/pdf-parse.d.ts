// lib/pdf.ts imports pdf-parse's implementation file directly (see the note
// there). This gives that path the same types as the package entry point.
declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse = require("pdf-parse");
  export = pdfParse;
}
