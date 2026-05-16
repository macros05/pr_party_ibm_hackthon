"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Props {
  size: number;
  accent: string;
}

/**
 * A single, soft scan line sweeping top→bottom over the sprite. The
 * previous implementation drew three high-contrast lines on screen
 * blend mode in a 0.4s stagger — that triple flash was the dominant
 * source of perceived flicker on the robot. Now: one slow sweep with
 * a wide gradient and reduced opacity, plus a faint accent halo that
 * pulses underneath so the "scanning" beat is still legible.
 */
export function ScanOverlay({ size, accent }: Props) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ mixBlendMode: "screen", overflow: "hidden" }}
    >
      {/* Soft accent wash underneath the sweep. Pulses slowly so the
          eye reads "this robot is busy" without strobing. */}
      <motion.div
        animate={{ opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          inset: -size * 0.05,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${accent}55 0%, transparent 70%)`,
          filter: "blur(8px)",
        }}
      />

      {/* One wide, low-contrast scan band sweeping vertically. */}
      <motion.div
        initial={{ top: "-20%", opacity: 0 }}
        animate={{
          top: ["-20%", "120%"],
          opacity: [0, 0.55, 0.55, 0],
        }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          repeatDelay: 0.6,
          ease: "linear",
          times: [0, 0.2, 0.8, 1],
        }}
        style={{
          position: "absolute",
          left: -size * 0.05,
          right: -size * 0.05,
          height: Math.max(8, size * 0.18),
          background: `linear-gradient(to bottom, transparent 0%, ${accent}55 50%, transparent 100%)`,
          filter: `blur(2px)`,
        }}
      />
    </div>
  );
}
