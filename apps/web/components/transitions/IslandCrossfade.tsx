"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Props {
  /** Should change whenever we want a fresh cross-fade. */
  cacheKey: string;
  children: React.ReactNode;
}

/**
 * Cross-fade wrapper. The new island fades + scales up from a blurred
 * state while the previous one fades + scales away with a small
 * outward blur. A horizontal "light wipe" sweeps across the column
 * on each transition to read as a camera flash.
 */
export function IslandCrossfade({ cacheKey, children }: Props) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={cacheKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "linear" }}
          className="absolute inset-0"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={cacheKey}
          initial={{ opacity: 0, scale: 0.96, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
          className="absolute inset-0"
          style={{ willChange: "transform, opacity, filter" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Light wipe sweeping across the column on every key change */}
      <LightWipe trigger={cacheKey} />
    </>
  );
}

function LightWipe({ trigger }: { trigger: string }) {
  return (
    <motion.span
      key={trigger}
      aria-hidden
      initial={{ x: "-100%", opacity: 0.85 }}
      animate={{ x: "200%", opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="pointer-events-none absolute inset-y-0 left-0 z-[10]"
      style={{
        width: "60%",
        background:
          "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
        mixBlendMode: "screen",
      }}
    />
  );
}
