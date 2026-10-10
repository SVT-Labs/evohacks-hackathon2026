import ReportView from "@/components/ReportView";

/**
 * Result viewer. Shows the report the form saved in sessionStorage, or the
 * built-in sample when opened as /report?sample=1.
 */
export default function ReportPage({ searchParams }: { searchParams: { sample?: string } }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <ReportView useSample={searchParams.sample === "1"} />
    </main>
  );
}
