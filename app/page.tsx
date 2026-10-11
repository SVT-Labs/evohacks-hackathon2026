/**
 * Landing page: what Bridge does, the form that starts a report, and a real
 * excerpt from the sample report in place of decoration. Always in English;
 * only the report has a language. A server component: nothing here animates,
 * so everything is visible before the form hydrates.
 */
import Link from "next/link";
import GenerateForm from "@/components/GenerateForm";
import { LABELS } from "@/lib/labels";
import { SAMPLE_REPORT } from "@/lib/sample";

// Le Chatelier's principle: the clearest "where the analogy breaks" in the sample.
const excerpt = SAMPLE_REPORT.concepts.find((concept) => concept.id === "c4") ?? SAMPLE_REPORT.concepts[0];
const excerptLimits = excerpt.analogy_limits.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

const focusRing =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const textLink = `font-bold text-lecture underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-border py-5">
        <p className="font-serif text-2xl leading-none">Bridge</p>
        <Link
          href="/report?sample=1"
          className={`text-sm text-muted underline decoration-1 underline-offset-4 hover:text-foreground ${focusRing}`}
        >
          See a sample
        </Link>
      </header>

      <main className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:py-20">
        <div className="lg:col-span-5">
          <h1 className="text-balance font-serif text-[length:clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            Your lecture notes, explained through what you love.
          </h1>
          <p className="text-pretty mt-5 max-w-[68ch] text-lg text-muted">
            You get every key concept from your notes explained through your interest, with a concept
            map, a short quiz, a PDF, and a plain note on where each comparison breaks down.
          </p>
        </div>

        <section
          aria-label="Start a report"
          className="min-w-0 self-start rounded-md border border-border bg-card p-5 sm:p-8 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1"
        >
          <GenerateForm />
        </section>

        <aside className="self-start lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <figure className="rounded-md border border-border p-5">
            <figcaption className="text-sm text-muted">From the sample report</figcaption>
            <p className="mt-3 font-serif text-xl leading-snug">{excerpt.name}</p>
            <p className="mt-1 flex items-start gap-2 italic text-interest-ink">
              <svg
                aria-hidden="true"
                viewBox="0 0 20 20"
                className="mt-1.5 size-4 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M3 10h13m0 0-4-4m4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="sr-only">Bridged to football: </span>
              {excerpt.bridge_title}
            </p>
            <p className="mt-5 text-sm font-bold">{LABELS.en.analogyBreaks}</p>
            <p className="mt-1">
              <mark className="box-decoration-clone bg-highlight px-0.5 text-foreground">{excerptLimits}</mark>
            </p>
          </figure>

          <p className="mt-6 text-muted">
            Just curious? See chemical equilibrium explained through football tactics.
          </p>
          <p className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
            <Link id="sample-link-en" href="/report?sample=1" className={textLink}>
              English sample
            </Link>
            <Link id="sample-link-tr" href="/report?sample=tr" className={textLink}>
              Turkish sample
            </Link>
          </p>
        </aside>
      </main>
    </div>
  );
}
