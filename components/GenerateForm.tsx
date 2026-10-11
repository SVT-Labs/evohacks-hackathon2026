"use client";

/**
 * The lecture-notes form on the landing page.
 *
 * Every input lives in React state, so switching the notes tab or hitting an
 * error never loses what the student entered. On submit it checks everything
 * it can locally (in DEMO_MODE the server answers any request with the sample,
 * so these checks are the only ones that run there), posts multipart form data
 * to /api/generate, stores the returned report in sessionStorage under
 * REPORT_STORAGE_KEY and navigates to /report, which reads it back. There is no
 * database: the report lives only in the browser tab.
 */
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { flushSync } from "react-dom";
import LoadingSteps from "@/components/LoadingSteps";
import { serverLength } from "@/lib/notes-length";
import {
  DEFAULT_LEVEL,
  DEMO_FLAG_STORAGE_KEY,
  FORM_DRAFT_STORAGE_KEY,
  MAX_FILE_BYTES,
  MAX_INTEREST_CHARS,
  MIN_NOTES_CHARS,
  REPORT_STORAGE_KEY,
} from "@/lib/constants";
import {
  LANGUAGES,
  LANGUAGE_NAMES,
  ReportSchema,
  isApiError,
  type Language,
  type Report,
} from "@/lib/types";

const INTERESTS = ["Football", "Music", "Gaming", "Cooking", "Space", "Fashion"];
const LEVELS = ["high school", "undergraduate", "graduate"];
const MAX_FILE_MB = MAX_FILE_BYTES / (1024 * 1024);
const SPRING = { type: "spring", bounce: 0, duration: 0.3 } as const;

type Tab = "file" | "text";
type Errors = Partial<Record<"file" | "text" | "interest" | "form", string>>;

// The form sits on the white sheet, so focus rings are offset against bg-card.
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-card";
const peerFocusRing =
  "peer-focus-visible:ring-2 peer-focus-visible:ring-lecture peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card";
const press = "transition-[transform,background-color,border-color,color] duration-100";
// text-base keeps iOS Safari from zooming the page when a field gets focus.
const fieldClass = `w-full rounded-md border bg-card px-3 py-2.5 text-base placeholder:text-muted disabled:opacity-60 ${focusRing}`;
const tabClass = `relative flex-1 rounded-sm px-0.5 pb-3 pt-1 text-sm font-bold text-muted transition-colors hover:text-foreground peer-checked:text-foreground peer-disabled:cursor-not-allowed ${peerFocusRing}`;
const tileClass = `flex min-h-11 flex-1 items-center justify-center rounded-md border border-control px-2 py-2 text-center text-sm ${press} hover:border-foreground/40 peer-checked:border-foreground/40 peer-checked:bg-highlight peer-checked:font-bold peer-enabled:active:translate-y-px peer-disabled:cursor-not-allowed ${peerFocusRing}`;
// 0.8125rem is the segmented-control size; it keeps the three levels on one row at 360px.
const segmentClass = `relative flex flex-1 items-center justify-center rounded py-2 text-center text-[0.8125rem] leading-tight text-muted transition-colors hover:text-foreground peer-checked:font-bold peer-checked:text-on-lecture peer-disabled:cursor-not-allowed ${peerFocusRing}`;
// Segments grow from their content width; if a large text setting still overflows, a label wraps instead.
const segmentGroupClass = "flex rounded-md border border-control p-0.5 *:flex-auto";
const segmentIndicatorClass = "absolute inset-0 rounded bg-lecture";
const tabIndicator = { layoutId: "notes-tab-underline", className: "absolute inset-x-0 -bottom-px h-0.5 bg-foreground" };
const legendClass = "mb-3 text-sm font-bold";

/**
 * Why a file cannot be sent, or undefined if it can. The PDF rule is a copy of
 * looksLikePdf in lib/pdf.ts, which is server-only because it imports unpdf.
 */
function fileProblem(file: File): string | undefined {
  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return "That file is not a PDF. Choose a .pdf file.";
  }
  if (file.size > MAX_FILE_BYTES) return `The PDF is larger than ${MAX_FILE_MB} MB.`;
  if (file.size === 0) return "That PDF is empty. Choose another file.";
  return undefined;
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Used when an error reply has no JSON body, e.g. one cut off by a proxy or the host. */
function statusMessage(status: number): string {
  if (status === 413) return "The PDF is too large to upload.";
  if (status === 429) return "Too many requests. Wait a minute and try again.";
  if (status === 504) return "The server took too long. Try again with shorter notes.";
  return `The request failed (HTTP ${status}).`;
}

async function requestReport(body: FormData): Promise<{ report: Report; demo: boolean } | { error: string }> {
  let response: Response;
  try {
    response = await fetch("/api/generate", { method: "POST", body });
  } catch {
    return { error: "Could not reach the server. Check your connection and try again." };
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || isApiError(data)) {
    return { error: isApiError(data) ? data.error : statusMessage(response.status) };
  }
  const report = ReportSchema.safeParse(data);
  if (!report.success) return { error: "The server sent a report in an unexpected format." };
  return { report: report.data, demo: response.headers.get("X-Bridge-Demo") === "true" };
}

/**
 * A native radio drawn as a tab, segment or tile, so arrow keys, grouping and
 * form semantics come from the browser. The optional indicator is drawn behind
 * the checked choice; sharing a layoutId across a group makes it slide over.
 */
function Choice(props: {
  id: string;
  name: string;
  checked: boolean;
  onSelect: () => void;
  className: string;
  indicator?: { layoutId: string; className: string };
  children: ReactNode;
}) {
  return (
    <label className="relative flex cursor-pointer">
      <input
        type="radio"
        id={props.id}
        name={props.name}
        checked={props.checked}
        onChange={props.onSelect}
        className="peer sr-only"
      />
      <span className={props.className}>
        {props.checked && props.indicator && (
          <motion.span
            aria-hidden="true"
            layoutId={props.indicator.layoutId}
            // Only a change of selection moves it; otherwise it would also glide after every layout shift above it.
            layoutDependency={props.id}
            transition={SPRING}
            className={props.indicator.className}
          />
        )}
        <span className="relative">{props.children}</span>
      </span>
    </label>
  );
}

function AlertIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6.25" />
      <path d="M8 4.75v3.75M8 11h.01" strokeLinecap="round" />
    </svg>
  );
}

function FieldError({ id, message, alert }: { id: string; message?: string; alert?: boolean }) {
  return (
    <p id={id} role={alert ? "alert" : undefined} className="mt-2 flex items-start gap-1.5 text-sm text-danger empty:hidden">
      {message && (
        <>
          <AlertIcon />
          {message}
        </>
      )}
    </p>
  );
}

export default function GenerateForm() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [chip, setChip] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [language, setLanguage] = useState<Language>("en");
  const [errors, setErrors] = useState<Errors>({});
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  // True once the reply is in: the checklist then ticks off its remaining steps and calls back.
  const [finishing, setFinishing] = useState(false);
  const checklistDone = useRef<(() => void) | null>(null);

  // False until the saved draft is read, so the first render's defaults never overwrite it.
  const [draftRead, setDraftRead] = useState(false);

  // Keep what the student typed through a refresh or Back. A chosen PDF cannot be
  // stored, so only the text inputs and choices come back.
  useEffect(() => {
    try {
      const draft = JSON.parse(sessionStorage.getItem(FORM_DRAFT_STORAGE_KEY) ?? "null");
      if (draft && typeof draft === "object") {
        if (draft.tab === "file" || draft.tab === "text") setTab(draft.tab);
        if (typeof draft.text === "string") setText(draft.text);
        if (typeof draft.chip === "string" && INTERESTS.includes(draft.chip)) setChip(draft.chip);
        if (typeof draft.custom === "string") setCustom(draft.custom.slice(0, MAX_INTEREST_CHARS));
        if (LEVELS.includes(draft.level)) setLevel(draft.level);
        if ((LANGUAGES as readonly string[]).includes(draft.language)) setLanguage(draft.language);
      }
    } catch {
      // Blocked or unreadable storage just means starting with an empty form.
    }
    setDraftRead(true);
  }, []);

  useEffect(() => {
    if (!draftRead) return;
    try {
      sessionStorage.setItem(FORM_DRAFT_STORAGE_KEY, JSON.stringify({ tab, text, chip, custom, level, language }));
    } catch {
      // Not saving a draft is harmless.
    }
  }, [draftRead, tab, text, chip, custom, level, language]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formErrorRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const customRef = useRef<HTMLInputElement>(null);

  const notesChars = serverLength(text);
  const interest = chip ?? custom.trim();

  // False once the form unmounts, so a reply that lands after the student moved on is ignored.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // A drop that misses the dashed zone would make the browser open the PDF and lose the form.
  useEffect(() => {
    const keep = (event: globalThis.DragEvent) => {
      if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
    };
    window.addEventListener("dragover", keep);
    window.addEventListener("drop", keep);
    return () => {
      window.removeEventListener("dragover", keep);
      window.removeEventListener("drop", keep);
    };
  }, []);

  function showFormError(message: string) {
    // Re-enable the form first: focus cannot land inside a disabled fieldset.
    flushSync(() => {
      setErrors({ form: message });
      setLoading(false);
    });
    formErrorRef.current?.focus();
  }

  const clearError = (key: keyof Errors) => setErrors((current) => ({ ...current, [key]: undefined }));

  function pickFile(picked: File | undefined) {
    if (!picked) return;
    const problem = fileProblem(picked);
    // A rejected pick keeps any PDF chosen earlier.
    if (!problem) setFile(picked);
    setErrors((current) => ({ ...current, file: problem }));
  }

  function removeFile() {
    setFile(null);
    clearError("file");
    fileInputRef.current?.focus(); // the remove button disappears, so focus would be lost
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    if (!loading) pickFile(files.find((dropped) => !fileProblem(dropped)) ?? files[0]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found: Errors = {};
    if (tab === "file" && !file) found.file = "Choose a PDF to upload.";
    if (tab === "text" && notesChars < MIN_NOTES_CHARS) {
      found.text = `Paste at least ${MIN_NOTES_CHARS} characters of notes. You have ${notesChars}.`;
    }
    if (!interest) found.interest = "Pick an interest or type your own.";

    // Render the messages before moving focus, so the focused control already describes its error.
    flushSync(() => setErrors(found));
    const firstInvalid = found.file
      ? fileInputRef.current
      : found.text
        ? textRef.current
        : found.interest
          ? customRef.current
          : null;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    const body = new FormData();
    if (tab === "file" && file) body.append("file", file);
    else body.append("text", text);
    body.append("interest", interest);
    body.append("level", level);
    body.append("language", language);

    setFinishing(false);
    setLoading(true);
    const result = await requestReport(body);
    if (!mounted.current) return; // the student left the page; do not pull them back to /report
    if ("error" in result) {
      showFormError(result.error);
      return;
    }

    // Let the checklist tick off its remaining steps, so even an instant (demo) reply shows all four.
    await new Promise<void>((resolve) => {
      checklistDone.current = resolve;
      setFinishing(true);
    });
    if (!mounted.current) return;

    try {
      sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(result.report));
      sessionStorage.setItem(DEMO_FLAG_STORAGE_KEY, String(result.demo));
    } catch {
      showFormError("Your browser blocked saving the report. Allow site storage and try again.");
      return;
    }
    router.push("/report"); // stay in the loading state until the report page shows
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <fieldset disabled={loading} className="min-w-0 space-y-8">
        <fieldset className="min-w-0">
          <legend className={legendClass}>Your lecture notes</legend>
          <div className="flex gap-6 border-b border-border">
            <Choice
              id="notes-source-file"
              name="notes-source"
              checked={tab === "file"}
              onSelect={() => setTab("file")}
              className={tabClass}
              indicator={tabIndicator}
            >
              Upload PDF
            </Choice>
            <Choice
              id="notes-source-text"
              name="notes-source"
              checked={tab === "text"}
              onSelect={() => setTab("text")}
              className={tabClass}
              indicator={tabIndicator}
            >
              Paste text
            </Choice>
          </div>

          <div className="mt-5">
            {tab === "file" ? (
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="notes-file"
                  accept="application/pdf,.pdf"
                  aria-invalid={errors.file ? true : undefined}
                  aria-describedby={`${file ? "notes-file-chosen " : ""}notes-file-hint notes-file-error`}
                  onChange={(event) => {
                    pickFile(event.target.files?.[0]);
                    event.target.value = ""; // so picking the same file again still fires onChange
                  }}
                  className="peer sr-only"
                />
                <label
                  htmlFor="notes-file"
                  onDragOver={(event) => {
                    event.preventDefault(); // without this the browser opens the dropped file instead
                    if (!loading) setDragOver(true);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOver(false);
                  }}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer items-center gap-4 rounded-md border border-dashed px-4 py-7 transition-colors peer-disabled:cursor-not-allowed peer-disabled:opacity-60 ${peerFocusRing} ${
                    dragOver
                      ? "border-lecture bg-lecture/5"
                      : errors.file
                        ? "border-danger bg-danger/5"
                        : "border-control hover:border-lecture"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-7 shrink-0 text-lecture"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      d="M12 15V4m0 0L8 8m4-4 4 4M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">
                      {dragOver ? "Drop it here" : file ? "Drop another PDF or " : "Drop your PDF here or "}
                      {!dragOver && (
                        <span className="text-lecture underline decoration-1 underline-offset-4">browse</span>
                      )}
                    </span>
                    {/* Hidden from the label's name; the input reads it through aria-describedby instead. */}
                    <span id="notes-file-hint" aria-hidden="true" className="mt-0.5 block text-sm text-muted">
                      PDF only, up to {MAX_FILE_MB} MB
                    </span>
                  </span>
                </label>

                {file && (
                  <div className="mt-3 flex items-center gap-3 rounded-md border border-border py-1.5 pl-3 pr-1.5">
                    <p id="notes-file-chosen" className="min-w-0 flex-1 truncate text-sm font-bold">
                      <span className="sr-only">Chosen: </span>
                      {file.name}
                    </p>
                    <span className="shrink-0 font-mono text-xs text-muted">{formatSize(file.size)}</span>
                    <button
                      type="button"
                      id="notes-file-remove"
                      onClick={removeFile}
                      aria-label={`Remove ${file.name}`}
                      className={`shrink-0 rounded-sm px-1.5 py-1 text-sm text-lecture underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`}
                    >
                      Remove
                    </button>
                  </div>
                )}
                <FieldError id="notes-file-error" message={errors.file} alert />
              </div>
            ) : (
              <div>
                <label htmlFor="notes-text" className="sr-only">
                  Lecture notes text
                </label>
                <textarea
                  ref={textRef}
                  id="notes-text"
                  rows={8}
                  value={text}
                  onChange={(event) => {
                    setText(event.target.value);
                    clearError("text");
                  }}
                  placeholder="Paste the text of your lecture notes here"
                  aria-invalid={errors.text ? true : undefined}
                  aria-describedby="notes-text-count notes-text-error"
                  className={`${fieldClass} resize-y ${errors.text ? "border-danger" : "border-control"}`}
                />
                <div className="flex flex-wrap items-start justify-between gap-x-3">
                  <FieldError id="notes-text-error" message={errors.text} />
                  <p
                    id="notes-text-count"
                    className={`ml-auto mt-2 font-mono text-xs ${notesChars >= MIN_NOTES_CHARS ? "text-success" : "text-muted"}`}
                  >
                    {notesChars} / {MIN_NOTES_CHARS} min
                  </p>
                </div>
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="min-w-0" aria-describedby="interest-error">
          <legend className={legendClass}>What do you love?</legend>
          {/* Fixed columns, so the bold selected label never shifts its neighbours. */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6">
            {INTERESTS.map((name) => (
              <Choice
                key={name}
                id={`interest-${name.toLowerCase()}`}
                name="interest-choice"
                checked={chip === name}
                onSelect={() => {
                  setChip(name);
                  setCustom("");
                  clearError("interest");
                }}
                className={tileClass}
              >
                {name}
              </Choice>
            ))}
          </div>
          <label htmlFor="interest-custom" className="mt-5 block text-sm text-muted">
            Or type your own
          </label>
          <input
            ref={customRef}
            id="interest-custom"
            type="text"
            value={custom}
            maxLength={MAX_INTEREST_CHARS}
            onChange={(event) => {
              setCustom(event.target.value);
              if (event.target.value.trim()) setChip(null);
              clearError("interest");
            }}
            placeholder="e.g. chess openings, K-pop, baking"
            aria-invalid={errors.interest ? true : undefined}
            aria-describedby="interest-error"
            className={`mt-1.5 ${fieldClass} ${errors.interest ? "border-danger" : "border-control"}`}
          />
          <FieldError id="interest-error" message={errors.interest} />
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
          <fieldset className="min-w-0">
            <legend className={legendClass}>Level</legend>
            <div className={segmentGroupClass}>
              {LEVELS.map((value) => (
                <Choice
                  key={value}
                  id={`level-${value.replace(/\s+/g, "-")}`}
                  name="level"
                  checked={level === value}
                  onSelect={() => setLevel(value)}
                  className={`${segmentClass} px-2 sm:px-3`}
                  indicator={{ layoutId: "level-selection", className: segmentIndicatorClass }}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </Choice>
              ))}
            </div>
          </fieldset>

          <fieldset className="min-w-0">
            <legend className={legendClass}>Report language</legend>
            <div className={`${segmentGroupClass} w-fit`}>
              {LANGUAGES.map((code) => (
                <Choice
                  key={code}
                  id={`language-${code}`}
                  name="language"
                  checked={language === code}
                  onSelect={() => setLanguage(code)}
                  className={`${segmentClass} px-4`}
                  indicator={{ layoutId: "language-selection", className: segmentIndicatorClass }}
                >
                  {code.toUpperCase()}
                  <span className="sr-only"> ({LANGUAGE_NAMES[code]})</span>
                </Choice>
              ))}
            </div>
          </fieldset>
        </div>

        {errors.form && (
          <div
            ref={formErrorRef}
            tabIndex={-1}
            role="alert"
            className={`flex items-start gap-2 rounded-md border border-danger/40 bg-danger/5 p-3 text-sm text-danger ${focusRing}`}
          >
            <AlertIcon />
            <p className="whitespace-pre-line">{errors.form}</p>
          </div>
        )}

        {loading && <LoadingSteps finishing={finishing} onFinished={() => checklistDone.current?.()} />}

        <button
          type="submit"
          id="generate-submit"
          className={`flex w-full items-center justify-center gap-2 rounded-md bg-lecture px-6 py-3.5 text-base font-bold text-on-lecture ${press} hover:bg-lecture/90 enabled:active:translate-y-px disabled:cursor-wait disabled:opacity-70 ${focusRing}`}
        >
          {loading ? "Building your Bridge…" : "Build my Bridge"}
          {!loading && (
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
        <p className="text-center text-sm text-muted">
          Usually takes about half a minute. Your report stays in this browser tab.
        </p>
      </fieldset>
    </form>
  );
}
