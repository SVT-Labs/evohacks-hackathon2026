import Link from "next/link";
import GenerateForm from "@/components/GenerateForm";

/** Landing page: what Bridge does, and the form that starts a report. */
export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-4xl font-bold">Bridge</h1>
      <p className="mt-3 text-lg text-gray-700">
        Upload your lecture notes and name something you love. Bridge explains each key concept
        through that interest, and tells you honestly where the comparison stops working.
      </p>

      <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
        <GenerateForm />
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Just curious?{" "}
        <Link href="/report?sample=1" className="text-indigo-600 underline">
          See a sample report
        </Link>{" "}
        (chemical equilibrium explained through football tactics).
      </p>
    </main>
  );
}
