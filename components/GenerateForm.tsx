"use client";

/**
 * The lecture-notes form on the landing page.
 *
 * It posts multipart form data to /api/generate, stores the returned report in
 * sessionStorage under REPORT_STORAGE_KEY and navigates to /report, which reads
 * it back. There is no database: the report lives only in the browser tab.
 */
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  DEFAULT_LEVEL,
  MAX_FILE_BYTES,
  MAX_INTEREST_CHARS,
  REPORT_STORAGE_KEY,
} from "@/lib/constants";
import { LANGUAGES, LANGUAGE_NAMES, ReportSchema, isApiError } from "@/lib/types";

const LEVELS = ["high school", "undergraduate", "graduate"];

const fieldClass =
  "mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";

export default function GenerateForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const hasFile = file instanceof File && file.size > 0;
    const hasText = String(form.get("text") ?? "").trim().length > 0;

    // Catch the obvious problems here; the server checks everything again.
    if (!hasFile && !hasText) {
      setError("Upload a PDF or paste your lecture notes.");
      return;
    }
    if (hasFile && file.size > MAX_FILE_BYTES) {
      setError(`The PDF is larger than ${MAX_FILE_BYTES / (1024 * 1024)} MB.`);
      return;
    }
    if (!hasFile) form.delete("file"); // do not send the empty file input

    setLoading(true);
    try {
      const response = await fetch("/api/generate", { method: "POST", body: form });
      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || isApiError(data)) {
        setError(isApiError(data) ? data.error : `The request failed (HTTP ${response.status}).`);
        setLoading(false);
        return;
      }
      const report = ReportSchema.safeParse(data);
      if (!report.success) {
        setError("The server sent a report in an unexpected format.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report.data));
      router.push("/report"); // stay in the loading state until the new page shows
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block text-sm font-medium">
        Lecture notes (PDF, up to 10 MB)
        <input
          type="file"
          name="file"
          accept="application/pdf,.pdf"
          className="mt-1 block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-indigo-700"
        />
      </label>

      <label className="block text-sm font-medium">
        Or paste the notes
        <textarea
          name="text"
          rows={6}
          placeholder="Paste the text of your lecture notes here"
          className={fieldClass}
        />
      </label>

      <label className="block text-sm font-medium">
        Your interest
        <input
          type="text"
          name="interest"
          required
          maxLength={MAX_INTEREST_CHARS}
          placeholder="e.g. football tactics, baking, chess"
          className={fieldClass}
        />
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="block text-sm font-medium">
          Level
          <select name="level" defaultValue={DEFAULT_LEVEL} className={fieldClass}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Language
          <select name="language" defaultValue="en" className={fieldClass}>
            {LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <p role="alert" className="whitespace-pre-line rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Building your bridge… this can take a minute" : "Build my bridge"}
      </button>
    </form>
  );
}
