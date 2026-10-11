/** The 404 page, in the same notebook style as the rest of Bridge. */
import Link from "next/link";

const link =
  "rounded-sm font-bold text-lecture underline decoration-1 underline-offset-4 hover:decoration-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lecture focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-24 sm:px-6">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-3 font-serif text-[length:clamp(2.25rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.02em]">
        This page is not in your notes.
      </h1>
      <p className="mt-6 text-lg text-muted">The link may be old or mistyped.</p>
      <p className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
        <Link href="/" className={link}>
          Build a report
        </Link>
        <Link href="/report?sample=1" className={link}>
          See a sample report
        </Link>
      </p>
    </main>
  );
}
