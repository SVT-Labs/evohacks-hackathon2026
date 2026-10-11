/**
 * The fixed words of a report, in the report's own language.
 *
 * Shared by the report page (components/ReportView.tsx) and the PDF
 * (components/ReportPDF.tsx), so both say the same thing. Everything the LLM
 * writes comes from the Report itself; only the scaffolding around it is here.
 */
import type { Language } from "./types";

export interface ReportLabels {
  /** BCP 47 locale for dates. */
  locale: string;
  bridgedTo: string;
  summary: string;
  concepts: string;
  strength: string;
  /** Spoken form of a 1-5 match strength, e.g. "Match strength 4 of 5". */
  strengthOutOf: (value: number) => string;
  inTheLecture: string;
  analogy: string;
  analogyBreaks: string;
  example: string;
  misconception: string;
  conceptMap: string;
  legendLecture: string;
  legendInterest: string;
  mapAsList: string;
  quiz: string;
  correct: string;
  incorrect: string;
  answerKey: string;
  nextSteps: string;
  downloadPdf: string;
  preparingPdf: string;
  previewPdf: string;
  closePreview: string;
  pdfFailed: string;
  makeAnother: string;
  demoNote: string;
  pageOf: (page: number, total: number) => string;
}

export const LABELS: Record<Language, ReportLabels> = {
  en: {
    locale: "en-GB",
    bridgedTo: "Bridged to",
    summary: "Summary",
    concepts: "Concepts",
    strength: "Match strength",
    strengthOutOf: (value) => `Match strength ${value} of 5`,
    inTheLecture: "In the lecture",
    analogy: "Analogy",
    analogyBreaks: "Where the analogy breaks",
    example: "Worked example",
    misconception: "Common misconception",
    conceptMap: "Concept map",
    legendLecture: "Lecture concept",
    legendInterest: "Interest",
    mapAsList: "Show the map as a list",
    quiz: "Quiz",
    correct: "Correct.",
    incorrect: "Not quite.",
    answerKey: "Answer key",
    nextSteps: "Next steps",
    downloadPdf: "Download PDF",
    preparingPdf: "Preparing PDF…",
    previewPdf: "Preview PDF",
    closePreview: "Close preview",
    pdfFailed: "The PDF could not be created. Please try again.",
    makeAnother: "Make another",
    demoNote: "Demo mode: sample report",
    pageOf: (page, total) => `page ${page} of ${total}`,
  },
  tr: {
    locale: "tr-TR",
    bridgedTo: "İlgi alanı",
    summary: "Özet",
    concepts: "Kavramlar",
    strength: "Eşleşme gücü",
    strengthOutOf: (value) => `Eşleşme gücü: 5 üzerinden ${value}`,
    inTheLecture: "Derste",
    analogy: "Benzetme",
    analogyBreaks: "Benzetmenin yetersiz kaldığı yer",
    example: "Çözümlü örnek",
    misconception: "Yaygın yanılgı",
    conceptMap: "Kavram haritası",
    legendLecture: "Ders kavramı",
    legendInterest: "İlgi alanı",
    mapAsList: "Haritayı liste olarak göster",
    quiz: "Mini test",
    correct: "Doğru.",
    incorrect: "Tam değil.",
    answerKey: "Cevap anahtarı",
    nextSteps: "Sonraki adımlar",
    downloadPdf: "PDF indir",
    preparingPdf: "PDF hazırlanıyor…",
    previewPdf: "PDF önizle",
    closePreview: "Önizlemeyi kapat",
    pdfFailed: "PDF oluşturulamadı. Lütfen tekrar deneyin.",
    makeAnother: "Yenisini oluştur",
    demoNote: "Demo modu: örnek rapor",
    pageOf: (page, total) => `sayfa ${page} / ${total}`,
  },
};

/** Today's date (or `date`) written out for the report's language, e.g. "10 October 2026" / "10 Ekim 2026". */
export function formatReportDate(language: Language, date: Date = new Date()): string {
  return new Intl.DateTimeFormat(LABELS[language].locale, { dateStyle: "long" }).format(date);
}

/** The answer letter for a zero-based option index: 0 -> "A". */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
