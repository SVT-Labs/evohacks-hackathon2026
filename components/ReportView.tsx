"use client";

/**
 * Renders a Report as a printed study handout: a sticky bar with the PDF
 * actions, then the title and summary, concepts, concept map, quiz and next
 * steps, each section opened by a rule rather than wrapped in a card.
 *
 * The report is `sample` when the page passes one, otherwise the one
 * GenerateForm saved in sessionStorage. Every fixed word comes from
 * LABELS[report.language], the same dictionary the PDF uses; the loading and
 * empty states stay English because there is no report language yet. Nothing
 * animates on load, so a server-rendered sample is readable before hydration.
 */
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import ConceptMapDiagram from "@/components/ConceptMapDiagram";
import { DEMO_FLAG_STORAGE_KEY, REPORT_STORAGE_KEY } from "@/lib/constants";
import { LABELS, formatReportDate, optionLetter, type ReportLabels } from "@/lib/labels";
import { ReportSchema, type Concept, type QuizQuestion, type Report } from "@/lib/types";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-background";
/** The document column; the sticky bar uses it too, so the wordmark lines up with the text. */
const column = "mx-auto w-full max-w-3xl px-4 sm:px-6";
// No display class here, so a caller can add `hidden md:inline-flex` without two conflicting ones.
const buttonBase = `h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold transition-[transform,background-color,border-color,color] duration-100 active:translate-y-px disabled:cursor-wait disabled:opacity-70 ${focusRing}`;
const primaryButton = `inline-flex ${buttonBase} bg-lecture text-on-lecture hover:bg-lecture/90`;
const outlineLook = `${buttonBase} border border-control bg-card hover:border-lecture hover:text-lecture`;
const textLook = `${buttonBase} text-lecture underline-offset-4 hover:underline`;
const textLink = `rounded-sm font-bold text-lecture underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;

const icons = {
  download: "M10 3v10m0 0-4-4m4 4 4-4M4 17h12",
  check: "m4 10.5 4 4 8-9",
  cross: "m5 5 10 10M15 5 5 15",
  spinner: "M10 3a7 7 0 1 1-7 7",
  plus: "M10 4v12M4 10h12",
};

function Icon({ d, spin = false }: { d: string; spin?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`size-4 shrink-0 ${spin ? "motion-safe:animate-spin" : ""}`}
    >
      <path d={d} />
    </svg>
  );
}

/** "Kimyasal Denge: Futbol" -> "kimyasal-denge-futbol.pdf". */
function pdfFileName(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug || "bridge-report"}.pdf`;
}

/** Full-width translucent bar; `children` sit under the h-14 row (the PDF error). */
function TopBar({ actions, children }: { actions?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 border-b print:hidden border-border bg-background/80 backdrop-blur [@media(prefers-reduced-transparency:reduce)]:bg-background">
      <div className={`${column} flex h-14 items-center justify-between gap-3`}>
        <Link href="/" className={`rounded-sm font-serif text-xl leading-none ${focusRing}`}>
          Bridge
        </Link>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-12 border-t border-border pt-8">
      <h2 id={`${id}-heading`} className="mb-6 font-serif text-2xl leading-tight tracking-[-0.01em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Strength({ value, labels }: { value: number; labels: ReportLabels }) {
  return (
    <div
      role="img"
      aria-label={labels.strengthOutOf(value)}
      className="flex shrink-0 items-center gap-2 text-sm text-muted"
    >
      <span>{labels.strength}</span>
      <span className="font-mono text-foreground">{value}/5</span>
      <span className="flex gap-1">
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={`size-2.5 rounded-sm ${step <= value ? "bg-foreground/80" : "border border-border"}`}
          />
        ))}
      </span>
    </div>
  );
}

function Field({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h4 className="text-sm font-bold">{title}</h4>
      <p className="mt-1 whitespace-pre-line">{body}</p>
    </div>
  );
}

function ConceptArticle({ concept, labels }: { concept: Concept; labels: ReportLabels }) {
  return (
    <article className="py-8 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="min-w-0 break-words text-xl font-bold leading-snug">{concept.name}</h3>
        <Strength value={concept.strength} labels={labels} />
      </div>

      {/* The two sides of the bridge, split by a rule once they sit side by side. */}
      <div className="mt-5 grid gap-6 md:grid-cols-2 md:gap-0 md:divide-x md:divide-border">
        <div className="md:pr-6">
          <h4 className="text-sm font-bold text-lecture">{labels.inTheLecture}</h4>
          <p className="mt-1 whitespace-pre-line">{concept.lecture_explanation}</p>
        </div>
        <div className="md:pl-6">
          <h4 className="font-bold leading-snug text-interest-ink">{concept.bridge_title}</h4>
          <p className="mt-1 whitespace-pre-line">{concept.bridge_explanation}</p>
        </div>
      </div>

      <div className="mt-6 max-w-[68ch] space-y-5">
        <Field title={labels.analogy} body={concept.analogy} />
        {/* The one highlighted thing in a concept: what a student would mark in the margin. */}
        <div>
          <h4 className="text-sm font-bold">{labels.analogyBreaks}</h4>
          <p className="mt-1 whitespace-pre-line rounded-sm bg-highlight px-3 py-2">{concept.analogy_limits}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2 md:gap-6">
        <Field title={labels.example} body={concept.example} />
        <Field title={labels.misconception} body={concept.misconception} />
      </div>
    </article>
  );
}

function QuizCard({
  item,
  number,
  labels,
  chosen,
  onChoose,
}: {
  item: QuizQuestion;
  number: number;
  labels: ReportLabels;
  chosen: number | null;
  onChoose: (index: number) => void;
}) {
  const answered = chosen !== null;
  const right = chosen === item.answer_index;

  return (
    <article className="rounded-md border border-border bg-card p-5">
      <h3 className="font-bold leading-snug">
        <span className="font-mono font-normal text-muted">{number}.</span> {item.question}
      </h3>
      <ul className="mt-4 space-y-2">
        {item.options.map((option, index) => {
          const isAnswer = index === item.answer_index;
          const isWrongPick = index === chosen && !isAnswer;
          const tone = !answered
            ? "border-control hover:border-lecture"
            : isAnswer
              ? "border-success bg-success/10"
              : isWrongPick
                ? "border-danger bg-danger/10"
                : "border-border text-muted";
          const letterTone =
            answered && isAnswer
              ? "border-success text-success"
              : isWrongPick
                ? "border-danger text-danger"
                : "border-border text-muted";
          return (
            <li key={index}>
              <button
                id={`quiz-${number}-option-${optionLetter(index).toLowerCase()}`}
                type="button"
                disabled={answered}
                onClick={() => onChoose(index)}
                className={`flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left transition-[transform,background-color,border-color,color] duration-100 active:translate-y-px disabled:cursor-default ${tone} ${focusRing}`}
              >
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-sm border font-mono text-xs ${letterTone}`}
                >
                  {optionLetter(index)}
                </span>
                <span className="flex-1 pt-0.5">{option}</span>
                {answered && (isAnswer || isWrongPick) && (
                  <span className={`pt-1 ${isAnswer ? "text-success" : "text-danger"}`}>
                    <Icon d={isAnswer ? icons.check : icons.cross} />
                    <span className="sr-only">{isAnswer ? labels.correct : labels.incorrect}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <div aria-live="polite">
        {answered && (
          <div className="mt-4 rounded-md border border-border px-4 py-3">
            <p className={`flex items-center gap-2 font-bold ${right ? "text-success" : "text-danger"}`}>
              <Icon d={right ? icons.check : icons.cross} />
              {right ? labels.correct : labels.incorrect}
            </p>
            <p className="mt-1 whitespace-pre-line">{item.explanation}</p>
          </div>
        )}
      </div>
    </article>
  );
}

const SECTIONS = ["concepts", "concept-map", "quiz", "next-steps"] as const;
type SectionId = (typeof SECTIONS)[number];

/**
 * "On this page": a fixed list beside the column on wide screens that marks the
 * section being read, and a plain row of links under the summary elsewhere.
 */
function SectionNav({ labels }: { labels: ReportLabels }) {
  const [current, setCurrent] = useState<SectionId>("concepts");
  const names: Record<SectionId, string> = {
    concepts: labels.concepts,
    "concept-map": labels.conceptMap,
    quiz: labels.quiz,
    "next-steps": labels.nextSteps,
  };

  useEffect(() => {
    // A section counts as current while it crosses a band near the top of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setCurrent(visible[0].target.id as SectionId);
      },
      { rootMargin: "-20% 0px -70% 0px" },
    );
    SECTIONS.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);

  const link = (id: SectionId, wide: boolean) => (
    <a
      href={`#${id}`}
      aria-current={wide && current === id ? "location" : undefined}
      className={`rounded-sm ${focusRing} ${
        wide
          ? `block border-l py-1 pl-3 text-sm ${current === id ? "border-foreground font-bold text-foreground" : "border-border text-muted hover:text-foreground"}`
          : "font-bold text-lecture underline decoration-1 underline-offset-4 hover:decoration-2"
      }`}
    >
      {names[id]}
    </a>
  );

  return (
    <>
      <nav
        aria-label={labels.onThisPage}
        className="fixed left-[max(1rem,calc(50%-24rem-13rem))] top-28 hidden w-44 print:hidden xl:block"
      >
        <p className="mb-2 text-sm font-bold">{labels.onThisPage}</p>
        <ul>
          {SECTIONS.map((id) => (
            <li key={id}>{link(id, true)}</li>
          ))}
        </ul>
      </nav>
      <nav aria-label={labels.onThisPage} className="mt-8 text-sm print:hidden xl:hidden">
        <span className="text-muted">{labels.onThisPage}: </span>
        {SECTIONS.map((id, index) => (
          <span key={id}>
            {index > 0 && (
              <span aria-hidden="true" className="text-muted">
                {" · "}
              </span>
            )}
            {link(id, false)}
          </span>
        ))}
      </nav>
    </>
  );
}

/**
 * The report itself, with one shared PDF state for the bar, the page end and
 * the preview. The PDF code is loaded only on click, so it stays out of the
 * page's first download.
 */
function ReportDocument({ report, isDemo }: { report: Report; isDemo: boolean }) {
  const labels = LABELS[report.language];
  const [busy, setBusy] = useState<"download" | "preview" | null>(null);
  const [failed, setFailed] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(() => report.quiz.map(() => null));
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previewButtonRef = useRef<HTMLButtonElement>(null);

  // Opened after the render that mounts the panel, so showModal() can focus its close button.
  useEffect(() => {
    if (previewUrl) dialogRef.current?.showModal();
  }, [previewUrl]);

  // The "Saved ..." confirmation clears itself.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(null), 5000);
    return () => clearTimeout(timer);
  }, [saved]);

  const answeredCount = answers.filter((answer) => answer !== null).length;
  const correctCount = answers.filter((answer, index) => answer === report.quiz[index].answer_index).length;

  function retryQuiz() {
    // Re-render first: the options are disabled until the reset commits, and a disabled button cannot take focus.
    flushSync(() => setAnswers(report.quiz.map(() => null)));
    document.getElementById("quiz-1-option-a")?.focus();
  }

  async function withPdf(kind: "download" | "preview", use: (url: string) => void) {
    if (busy) return;
    setBusy(kind);
    setFailed(false);
    setSaved(null);
    try {
      const { reportPdfBlob } = await import("./ReportPDF");
      use(URL.createObjectURL(await reportPdfBlob(report)));
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  }

  const download = () =>
    withPdf("download", (url) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = pdfFileName(report.title);
      document.body.append(link);
      link.click();
      link.remove();
      setSaved(link.download);
      // Not revoked at once: the browser may still be reading the blob after click() returns.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    });

  const preview = () => withPdf("preview", setPreviewUrl);

  // Runs for the close button and for Escape alike.
  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    previewButtonRef.current?.focus();
  }

  const downloadButton = (place: "top" | "bottom") => (
    <button
      id={`download-pdf-${place}`}
      type="button"
      onClick={download}
      disabled={busy !== null}
      className={primaryButton}
    >
      <Icon d={busy === "download" ? icons.spinner : icons.download} spin={busy === "download"} />
      {busy === "download" ? labels.preparingPdf : labels.downloadPdf}
    </button>
  );

  return (
    <div lang={report.language}>
      <TopBar
        actions={
          <>
            {downloadButton("top")}
            {/* A PDF in an iframe needs a desktop browser's built-in viewer, so phones only get Download. */}
            <button
              ref={previewButtonRef}
              id="preview-pdf"
              type="button"
              onClick={preview}
              disabled={busy !== null}
              className={`hidden md:inline-flex ${outlineLook}`}
            >
              {busy === "preview" && <Icon d={icons.spinner} spin />}
              {busy === "preview" ? labels.preparingPdf : labels.previewPdf}
            </button>
            {/* On phones only the icon fits beside Download; the name stays for screen readers. */}
            <Link id="make-another-top" href="/" aria-label={labels.makeAnother} className={`inline-flex ${textLook}`}>
              <span className="sm:hidden">
                <Icon d={icons.plus} />
              </span>
              <span className="hidden sm:inline">{labels.makeAnother}</span>
            </Link>
          </>
        }
      >
        <p role="alert" className={failed ? `${column} pb-3 text-sm font-bold text-danger` : undefined}>
          {failed ? labels.pdfFailed : null}
        </p>
        <p role="status" className={saved ? `${column} flex items-center gap-2 pb-3 text-sm text-success` : undefined}>
          {saved && (
            <>
              <Icon d={icons.check} />
              {labels.pdfSaved(saved)}
            </>
          )}
        </p>
      </TopBar>

      {/* The scroll margin keeps a focused control from landing under the sticky bar. */}
      <main className={`${column} pb-16 pt-10 sm:pt-14 [&_*]:scroll-mt-20`}>
        {isDemo && (
          <p role="status" className="mb-6 rounded-md border border-border bg-highlight/40 px-3 py-2 text-sm">
            {labels.demoNote}
          </p>
        )}
        <p className="text-sm text-muted">
          {labels.bridgedTo}: <span className="font-bold text-interest-ink">{report.interest}</span>
          <span aria-hidden="true"> · </span>
          {/* Today's date, so the server and the browser can disagree around midnight. */}
          <span suppressHydrationWarning>{formatReportDate(report.language)}</span>
        </p>
        <h1 className="mt-3 break-words text-balance font-serif text-[length:clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
          {report.title}
        </h1>
        <p className="text-pretty mt-6 max-w-[65ch] whitespace-pre-line text-lg leading-relaxed">{report.summary}</p>
        <SectionNav labels={labels} />

        <Section id="concepts" title={labels.concepts}>
          <div className="divide-y divide-border">
            {report.concepts.map((concept) => (
              <ConceptArticle key={concept.id} concept={concept} labels={labels} />
            ))}
          </div>
        </Section>

        <Section id="concept-map" title={labels.conceptMap}>
          <ConceptMapDiagram map={report.concept_map} labels={labels} />
        </Section>

        <Section id="quiz" title={labels.quiz}>
          <div className="space-y-4">
            {report.quiz.map((item, index) => (
              <QuizCard
                key={index}
                item={item}
                number={index + 1}
                labels={labels}
                chosen={answers[index]}
                onChoose={(choice) =>
                  setAnswers((current) => current.map((answer, i) => (i === index ? choice : answer)))
                }
              />
            ))}
          </div>
          <div aria-live="polite">
            {answeredCount === report.quiz.length && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-card px-5 py-4">
                <p className="font-serif text-xl">{labels.quizScore(correctCount, report.quiz.length)}</p>
                <button
                  id="quiz-try-again"
                  type="button"
                  onClick={retryQuiz}
                  className={`inline-flex print:hidden ${outlineLook}`}
                >
                  {labels.tryAgain}
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section id="next-steps" title={labels.nextSteps}>
          <ol className="max-w-[68ch] list-decimal space-y-3 pl-6 marker:font-mono marker:text-muted">
            {report.next_steps.map((step, index) => (
              <li key={index} className="pl-2">
                {step}
              </li>
            ))}
          </ol>
        </Section>

        <footer className="mt-12 flex flex-wrap gap-3 border-t border-border pt-8 print:hidden">
          {downloadButton("bottom")}
          <Link id="make-another-bottom" href="/" className={`inline-flex ${outlineLook}`}>
            {labels.makeAnother}
          </Link>
        </footer>
      </main>

      <dialog
        ref={dialogRef}
        onClose={closePreview}
        aria-labelledby="pdf-preview-title"
        className="h-[90vh] w-[min(64rem,92vw)] bg-transparent p-0 text-foreground backdrop:bg-foreground/40"
      >
        {previewUrl && (
          // Grows from the corner the Preview button sits in; under reduced motion only the fade is left.
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.25 }}
            className="flex h-full origin-top-right flex-col overflow-hidden rounded-md border border-border bg-card"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
              <h2 id="pdf-preview-title" className="truncate font-bold">
                {labels.previewPdf}
              </h2>
              <button
                id="close-pdf-preview"
                type="button"
                onClick={() => dialogRef.current?.close()}
                className={`inline-flex ${outlineLook}`}
              >
                {labels.closePreview}
              </button>
            </div>
            <iframe
              src={previewUrl}
              title={`${labels.previewPdf}: ${report.title}`}
              className="min-h-0 w-full flex-1 bg-background"
            />
          </motion.div>
        )}
      </dialog>
    </div>
  );
}

export default function ReportView({ sample }: { sample?: Report }) {
  // undefined: still reading sessionStorage. null: nothing usable was stored.
  const [report, setReport] = useState<Report | null | undefined>(sample);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (sample) return;
    let stored: unknown = null;
    let demo = false;
    try {
      stored = JSON.parse(sessionStorage.getItem(REPORT_STORAGE_KEY) ?? "null");
      demo = sessionStorage.getItem(DEMO_FLAG_STORAGE_KEY) === "true";
    } catch {
      // Unreadable storage is treated the same as an empty one.
    }
    const parsed = ReportSchema.safeParse(stored);
    setReport(parsed.success ? parsed.data : null);
    setIsDemo(demo);
  }, [sample]);

  if (report === undefined) {
    return (
      <>
        <TopBar />
        <main className={`${column} py-10 sm:py-14`}>
          <p role="status" className="text-muted">
            Loading report…
          </p>
        </main>
      </>
    );
  }
  if (report === null) {
    return (
      <>
        <TopBar />
        <main className={`${column} py-10 sm:py-14`}>
          <h1 className="text-balance font-serif text-[length:clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            No report yet
          </h1>
          <p className="text-pretty mt-5 max-w-[60ch] text-lg text-muted">
            A report lives only in the browser tab that created it. Make a new one, or look at a sample.
          </p>
          <p className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link id="empty-create-report" href="/" className={textLink}>
              Create a report
            </Link>
            <Link id="empty-sample-en" href="/report?sample=1" className={textLink}>
              English sample
            </Link>
            <Link id="empty-sample-tr" href="/report?sample=tr" className={textLink}>
              Turkish sample
            </Link>
          </p>
        </main>
      </>
    );
  }

  return <ReportDocument report={report} isDemo={isDemo} />;
}
