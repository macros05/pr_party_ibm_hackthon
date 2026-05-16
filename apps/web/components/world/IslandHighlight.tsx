"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Props {
  /** Pre-resolved px position relative to the island image's box. */
  x: number;
  y: number;
  active: boolean;
  accent: string;
  /** Size of the highlight ring (in px). Default 110. */
  size?: number;
}

/**
 * A glowing point of interest on the island. When `active` is true,
 * we render a pulsing radial halo + two concentric sonar rings that
 * expand outward and fade. When inactive, nothing renders (no DOM).
 *
 * Coordinates are local to the island's image box (the parent
 * positions it absolutely).
 */
export function IslandHighlight({ x, y, active, accent, size = 110 }: Props) {
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: size,
            height: size,
            marginLeft: -size / 2,
            marginTop: -size / 2,
            pointerEvents: "none",
            zIndex: 4,
            mixBlendMode: "screen",
          }}
        >
          {/* glowing core */}
          <motion.span
            style={{
              position: "absolute",
              inset: "20%",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${accent}cc 0%, ${accent}44 40%, transparent 70%)`,
              filter: "blur(4px)",
            }}
            animate={
              reduced
                ? undefined
                : { opacity: [0.5, 0.95, 0.5], scale: [0.85, 1.05, 0.85] }
            }
            transition={
              reduced
                ? undefined
                : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
            }
          />
          {/* sonar rings */}
          {!reduced && (
            <>
              <motion.span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${accent}`,
                }}
                initial={{ opacity: 0.85, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `1px solid ${accent}`,
                }}
                initial={{ opacity: 0.6, scale: 0.3 }}
                animate={{ opacity: 0, scale: 1.2 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.8,
                }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
