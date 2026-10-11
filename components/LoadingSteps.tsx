"use client";

/**
 * The four-step checklist shown while /api/generate works.
 *
 * The API reports no progress, so the steps advance on a timer, one every
 * STEP_MS, and hold on the last one until the form navigates away. A reply can
 * take up to two minutes, so after SLOW_MS a calm hint and an elapsed-seconds
 * counter appear. Screen readers hear each step change and the hint once,
 * through the polite live region; the visual list and the counter are hidden
 * from them so they are not announced twice or every second.
 */
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STEPS = ["Reading notes", "Finding concepts", "Building bridges", "Making your PDF"];
const STEP_MS = 650;
const SLOW_MS = 12_000;

export default function LoadingSteps() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => clearInterval(timer);
  }, []);

  const step = Math.min(STEPS.length - 1, Math.floor(elapsed / STEP_MS));
  const slow = elapsed >= SLOW_MS;

  return (
    <div className="rounded-md border border-border p-4">
      <ol aria-hidden="true" className="space-y-1">
        {STEPS.map((name, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li
              key={name}
              className={`relative flex items-center gap-3 py-1.5 transition-colors duration-200 ${
                current ? "font-bold text-foreground" : "text-muted"
              }`}
            >
              {/* font-normal: Plex Mono ships one weight, so the bold row must not fake-bold its numeral. */}
              <span className="grid size-5 shrink-0 place-items-center font-mono text-sm font-normal">
                {done ? (
                  <svg viewBox="0 0 16 16" className="size-4 text-success" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              {name}
              {current && (
                <span className="absolute inset-x-0 bottom-0 h-px overflow-hidden bg-border">
                  {/* Under reduced motion MotionConfig drops the sweep and the plain rule stays. */}
                  <motion.span
                    className="block h-full w-1/3 bg-lecture"
                    animate={{ x: ["-100%", "300%"] }}
                    transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <div className={`flex items-baseline justify-between gap-3 text-sm text-muted ${slow ? "mt-3" : ""}`}>
        <p aria-live="polite">
          <span className="sr-only">
            Step {step + 1} of {STEPS.length}: {STEPS[step]}.
          </span>
          {slow && <span>Still working — long notes can take up to two minutes.</span>}
        </p>
        {slow && (
          <span aria-hidden="true" className="shrink-0 font-mono tabular-nums">
            {Math.floor(elapsed / 1000)} s
          </span>
        )}
      </div>
    </div>
  );
}
