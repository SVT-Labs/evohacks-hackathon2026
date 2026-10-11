"use client";

/**
 * The four-step checklist shown while /api/generate works.
 *
 * The API reports no progress, so while the form waits the steps follow the
 * clock: each starts at its STEP_STARTS_MS, paced for a real report, which
 * takes about half a minute. When the reply is in (`finishing`), the steps
 * still open are ticked off quickly and `onFinished` tells the form to move on,
 * so an instant demo reply shows all four steps too. A reply can take up to two
 * minutes, so after SLOW_MS a calm hint and an elapsed-seconds counter appear.
 * Screen readers hear each step change and the hint once, through the polite
 * live region; the visual list and the counter are hidden from them so they are
 * not announced twice or every second.
 */
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const STEPS = ["Reading notes", "Finding concepts", "Building bridges", "Making your PDF"];
/** When each step starts while waiting. The last one holds until the reply arrives. */
const STEP_STARTS_MS = [0, 4_000, 12_000, 22_000];
/** How fast the remaining steps are ticked off once the reply is in, and the pause after the last. */
const FINISH_STEP_MS = 350;
const FINISH_PAUSE_MS = 300;
const SLOW_MS = 45_000;

export default function LoadingSteps({
  finishing,
  onFinished,
}: {
  finishing: boolean;
  onFinished: () => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [announce, setAnnounce] = useState(false);
  // The step being worked on; STEPS.length when every step is ticked off.
  const [step, setStep] = useState(0);
  // Read through a ref so a new callback on each render of the form does not restart the timers.
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    // A live region that already holds text when it appears is not read; fill it a moment later.
    const ready = setTimeout(() => setAnnounce(true), 100);
    const start = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - start), 250);
    return () => {
      clearTimeout(ready);
      clearInterval(timer);
    };
  }, []);

  // While waiting, the checklist follows the clock.
  const timedStep = STEP_STARTS_MS.filter((start) => elapsed >= start).length - 1;
  useEffect(() => {
    if (!finishing) setStep(timedStep);
  }, [finishing, timedStep]);

  // Once the reply is in, tick off what is left, then hand back to the form.
  useEffect(() => {
    if (!finishing) return;
    const allDone = step >= STEPS.length;
    const timer = setTimeout(
      () => (allDone ? onFinishedRef.current() : setStep(step + 1)),
      allDone ? FINISH_PAUSE_MS : FINISH_STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [finishing, step]);

  const slow = elapsed >= SLOW_MS && !finishing;

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
        <p aria-live="polite" aria-atomic="true">
          {announce && (
            <span className="sr-only">
              {step < STEPS.length
                ? `Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}.`
                : "Your report is ready."}
            </span>
          )}
          {slow && <span>{" Still working — long notes can take up to two minutes."}</span>}
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
