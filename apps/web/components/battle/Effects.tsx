"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Verdict } from "@/types/encounter";

/* ============================================================
   WhiteKeyFilter — strips near-white background from RGB PNGs.
   Source PNGs have no alpha channel; this SVG filter computes an
   alpha mask from luminance (white → 0, dark → 1) and composites
   the original color back through it. Apply via `filter: url(#whiteKey)`.
   ============================================================ */

export function WhiteKeyFilter() {
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        <filter
          id="whiteKey"
          x="-2%"
          y="-2%"
          width="104%"
          height="104%"
          colorInterpolationFilters="sRGB"
        >
          {/* derive alpha from inverted luminance, with a slope so near-white → 0
              and the robot's painted pixels stay opaque */}
          <feColorMatrix
            type="matrix"
            values="
              0 0 0 0 0
              0 0 0 0 0
              0 0 0 0 0
             -1 -1 -1 0 2.85
            "
            result="alphaMask"
          />
          <feComponentTransfer in="alphaMask" result="alphaMaskClamped">
            <feFuncA type="table" tableValues="0 1" />
          </feComponentTransfer>
          {/* take SourceGraphic colors with the computed alpha */}
          <feComposite in="SourceGraphic" in2="alphaMaskClamped" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/* ============================================================
   GoldenFlash — full-screen pulse fired at dramatic moments.
   ============================================================ */

export function GoldenFlash({
  active,
  onDone,
}: {
  active: boolean;
  onDone: () => void;
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="goldflash"
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60]"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 55%, rgba(255, 232, 170, 0.55) 0%, rgba(224, 187, 114, 0.18) 40%, rgba(0,0,0,0) 70%)",
            mixBlendMode: "screen",
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0, 1, 0.6, 0], scale: [0.9, 1, 1.04, 1.06] }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          onAnimationComplete={onDone}
        />
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   VerdictRibbon — banner that crosses the stage at encounter end.
   ============================================================ */

const VERDICT_LABEL: Record<Verdict, string> = {
  blocked: "Blocked",
  changes_required: "Changes Required",
  approved_with_notes: "Approved · with notes",
};

const VERDICT_COLOR: Record<Verdict, string> = {
  blocked: "#E04C2B",
  changes_required: "#E0BB72",
  approved_with_notes: "#B9D87B",
};

export function VerdictRibbon({ verdict }: { verdict: Verdict | null }) {
  return (
    <AnimatePresence>
      {verdict && (
        <motion.div
          key="ribbon"
          aria-hidden
          className="pointer-events-none fixed left-1/2 top-[34%] z-[55] -translate-x-1/2"
          initial={{ opacity: 0, y: -40, rotate: -2, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, rotate: -2, scale: 1 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
        >
          <div
            className="relative px-12 py-4"
            style={{
              background: "linear-gradient(180deg, #14110C 0%, #2A241C 100%)",
              border: `1px solid ${VERDICT_COLOR[verdict]}88`,
              boxShadow:
                "0 30px 60px -20px rgba(0,0,0,0.85), 0 0 40px rgba(224, 187, 114, 0.18)",
            }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.42em] text-[var(--fg-soft)]">
              Council verdict
            </p>
            <p
              className="mt-1 font-display text-[42px] leading-none tracking-tight"
              style={{
                color: VERDICT_COLOR[verdict],
                textShadow: `0 0 24px ${VERDICT_COLOR[verdict]}66`,
              }}
            >
              {VERDICT_LABEL[verdict]}
            </p>
            {/* corner notches */}
            <span aria-hidden className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45" style={{ background: "#14110C", borderLeft: `1px solid ${VERDICT_COLOR[verdict]}88`, borderBottom: `1px solid ${VERDICT_COLOR[verdict]}88` }} />
            <span aria-hidden className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45" style={{ background: "#14110C", borderRight: `1px solid ${VERDICT_COLOR[verdict]}88`, borderTop: `1px solid ${VERDICT_COLOR[verdict]}88` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ============================================================
   FlyingBubble — speech bubble that arcs from its origin point
   to the right edge (where the findings panel lives) and fades.
   Origin coords are viewport-relative pixels.
   ============================================================ */

export function FlyingBubble({
  originX,
  originY,
  title,
  accent,
  onDone,
}: {
  originX: number;
  originY: number;
  title: string;
  accent: string;
  onDone: () => void;
}) {
  // arc target: right edge, slightly above center (panel top region)
  const targetX = window.innerWidth - 200;
  const targetY = Math.max(120, originY - 80);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2"
      style={{ left: originX, top: originY }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0.6, 1, 1, 0.85],
        x: [0, (targetX - originX) * 0.45, targetX - originX],
        y: [0, -120, targetY - originY],
      }}
      transition={{ duration: 1.4, ease: [0.22, 0.61, 0.36, 1], times: [0, 0.2, 0.85, 1] }}
      onAnimationComplete={onDone}
    >
      <div
        className="max-w-[220px] truncate rounded-md px-3 py-1.5 font-mono text-[11px]"
        style={{
          background: "rgba(20, 16, 10, 0.92)",
          border: `1px solid ${accent}88`,
          color: "var(--fg)",
          boxShadow: `0 10px 24px -10px rgba(0,0,0,0.85), 0 0 18px ${accent}55`,
        }}
      >
        <span className="block truncate">{title}</span>
      </div>
      {/* tracer trail */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 14px ${accent}` }}
      />
    </motion.div>
  );
}
