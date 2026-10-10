"use client";

/**
 * Renders a Report: summary, concept cards, concept map, quiz and next steps.
 *
 * The report comes from sessionStorage (written by GenerateForm) or, when
 * `useSample` is set, from the built-in sample. This is a plain functional
 * layout; the concept map in particular is a list of edges, not yet a graph.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { REPORT_STORAGE_KEY } from "@/lib/constants";
import { SAMPLE_REPORT } from "@/lib/sample";
import { ReportSchema, type Concept, type QuizQuestion, type Report } from "@/lib/types";

const cardClass = "rounded-lg border border-gray-200 bg-white p-5";
const headingClass = "mb-3 text-xl font-semibold";

function ConceptCard({ concept }: { concept: Concept }) {
  const details = [
    ["In the lecture", concept.lecture_explanation],
    [concept.bridge_title, concept.bridge_explanation],
    ["Analogy", concept.analogy],
    ["Where the analogy breaks down", concept.analogy_limits],
    ["Worked example", concept.example],
    ["Common misconception", concept.misconception],
  ];

  return (
    <article className={cardClass}>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold">{concept.name}</h3>
        <span className="shrink-0 text-xs text-gray-500">Match strength {concept.strength}/5</span>
      </div>
      <dl className="mt-3 space-y-3 text-sm">
        {details.map(([label, body]) => (
          <div key={label}>
            <dt className="font-medium text-indigo-700">{label}</dt>
            <dd className="text-gray-700">{body}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function QuizCard({ item, number }: { item: QuizQuestion; number: number }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const answered = chosen !== null;

  return (
    <div className={cardClass}>
      <p className="font-medium">
        {number}. {item.question}
      </p>
      <ul className="mt-3 space-y-2 text-sm">
        {item.options.map((option, index) => {
          const isCorrect = index === item.answer_index;
          const tone = !answered
            ? "border-gray-300 hover:border-indigo-400"
            : isCorrect
              ? "border-green-500 bg-green-50"
              : index === chosen
                ? "border-red-400 bg-red-50"
                : "border-gray-200 text-gray-500";
          return (
            <li key={index}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setChosen(index)}
                className={`w-full rounded-md border px-3 py-2 text-left ${tone}`}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && <p className="mt-3 text-sm text-gray-700">{item.explanation}</p>}
    </div>
  );
}

export default function ReportView({ useSample }: { useSample: boolean }) {
  // undefined: still reading sessionStorage. null: nothing usable was stored.
  const [report, setReport] = useState<Report | null | undefined>(
    useSample ? SAMPLE_REPORT : undefined,
  );

  useEffect(() => {
    if (useSample) return;
    let stored: unknown = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(REPORT_STORAGE_KEY) ?? "null");
    } catch {
      // Unreadable storage is treated the same as an empty one.
    }
    const parsed = ReportSchema.safeParse(stored);
    setReport(parsed.success ? parsed.data : null);
  }, [useSample]);

  if (report === undefined) {
    return <p className="text-sm text-gray-500">Loading report…</p>;
  }
  if (report === null) {
    return (
      <div className="space-y-3 text-sm">
        <p>There is no report to show yet.</p>
        <p>
          <Link href="/" className="text-indigo-600 underline">
            Create one
          </Link>{" "}
          or{" "}
          <Link href="/report?sample=1" className="text-indigo-600 underline">
            look at the sample report
          </Link>
          .
        </p>
      </div>
    );
  }

  const nodeLabels = new Map(report.concept_map.nodes.map((node) => [node.id, node.label]));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm text-gray-500">Bridged to: {report.interest}</p>
        <h1 className="mt-1 text-3xl font-bold">{report.title}</h1>
        <p className="mt-3 text-gray-700">{report.summary}</p>
      </header>

      <section>
        <h2 className={headingClass}>Concepts</h2>
        <div className="space-y-4">
          {report.concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      </section>

      <section>
        <h2 className={headingClass}>Concept map</h2>
        <ul className={`${cardClass} space-y-1 text-sm`}>
          {report.concept_map.edges.map((edge, index) => (
            <li key={index}>
              <span className="font-medium">{nodeLabels.get(edge.from)}</span>{" "}
              <span className="text-gray-500">— {edge.label} →</span>{" "}
              <span className="font-medium">{nodeLabels.get(edge.to)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className={headingClass}>Quiz</h2>
        <div className="space-y-4">
          {report.quiz.map((item, index) => (
            <QuizCard key={index} item={item} number={index + 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className={headingClass}>Next steps</h2>
        <ol className={`${cardClass} list-decimal space-y-2 pl-9 text-sm`}>
          {report.next_steps.map((step, index) => (
            <li key={index}>{step}</li>
          ))}
        </ol>
      </section>

      <Link href="/" className="inline-block text-sm text-indigo-600 underline">
        ← Bridge another lecture
      </Link>
    </div>
  );
}
