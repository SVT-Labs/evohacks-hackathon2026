/**
 * Landing page: what Bridge does, the form that starts a report, and a short
 * description of one concept from the sample report (Le Chatelier's principle,
 * concept c4 in lib/sample.ts) in place of decoration. Always in English; only
 * the report has a language. A server component: nothing here animates, so
 * everything is visible before the form hydrates.
 */
import Link from "next/link";
import GenerateForm from "@/components/GenerateForm";

const focusRing =
  "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const textLink = `font-bold text-lecture underline decoration-1 underline-offset-4 hover:decoration-2 ${focusRing}`;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <header className="border-b border-border py-5">
        <p className="font-serif text-2xl leading-none">Bridge</p>
      </header>

      <main className="grid gap-10 py-10 sm:py-14 lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:py-20">
        <div className="lg:col-span-5">
          <h1 className="text-balance font-serif text-[length:clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
            Your lecture notes, explained through what you love.
          </h1>
          <p className="text-pretty mt-5 max-w-[68ch] text-lg text-muted">
            You get every key concept from the notes, explained through your interest, with a concept
            map, quiz, PDF, and a plain note.
          </p>
        </div>

        <section
          aria-label="Start a report"
          className="min-w-0 self-start rounded-md border border-border bg-card p-5 sm:p-8 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1"
        >
          <GenerateForm />
        </section>

        <aside className="self-start lg:col-span-5 lg:col-start-1 lg:row-start-2">
          <div className="rounded-md border border-border p-5">
            <p className="text-sm text-muted">From the sample report</p>
            <p className="mt-3">
              A chemistry lecture is explained through football. One idea, Le Chatelier&apos;s principle,
              is compared to a team shifting across the pitch to cover an overloaded side.
            </p>
            <p className="mt-3">
              Each comparison also says where it stops working: defenders choose to shift, but
              molecules do not choose anything.
            </p>
          </div>

          <p className="mt-6 text-muted">Sample answers:</p>
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
