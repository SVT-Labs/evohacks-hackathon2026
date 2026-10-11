"use client";

/** Makes every Motion (motion.dev) animation in the app honour prefers-reduced-motion. */
import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
