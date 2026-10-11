import ReportView from "@/components/ReportView";
import { SAMPLE_REPORT, SAMPLE_REPORT_TR } from "@/lib/sample";

/**
 * Result viewer. Shows the report the form saved in sessionStorage, the English
 * sample at /report?sample=1 or the Turkish one at /report?sample=tr. ReportView
 * draws the whole page, sticky bar and <main> included, because the bar spans the
 * full width while the text keeps to a column.
 */
export default function ReportPage({ searchParams }: { searchParams: { sample?: string } }) {
  const sample =
    searchParams.sample === "1" ? SAMPLE_REPORT : searchParams.sample === "tr" ? SAMPLE_REPORT_TR : undefined;

  // Keyed so that switching between the samples and the stored report remounts the view.
  return <ReportView key={sample ? searchParams.sample : "stored"} sample={sample} />;
}
