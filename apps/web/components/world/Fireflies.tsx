"use client";

import * as React from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Firefly {
  id: number;
  /** centre offset px from island centre */
  dx: number;
  dy: number;
  size: number;
  blinkPeriod: number;
  blinkPhase: number;
  driftDuration: number;
}

interface Props {
  /** Island centre in column-local px. */
  cx: number;
  cy: number;
  /** Tint of the firefly glow (character accent). */
  accent: string;
  /** Radius of the firefly cloud around the island. */
  radius?: number;
  /** Count of fireflies. */
  count?: number;
}

/**
 * 5–8 bright dots floating around the island, blinking with their own
 * personal periods and slowly drifting in irregular arcs. Reads as
 * "magic" without ever being loud.
 *
 * Disabled under prefers-reduced-motion.
 */
function generateFlies(count: number, radius: number): Firefly[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6;
    const dist = radius * (0.45 + Math.random() * 0.55);
    return {
      id: i,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist * 0.7,
      size: 4 + Math.random() * 3,
      blinkPeriod: 2.2 + Math.random() * 2.2,
      blinkPhase: Math.random(),
      driftDuration: 14 + Math.random() * 10,
    };
  });
}

export function Fireflies({
  cx,
  cy,
  accent,
  radius = 380,
  count = 7,
}: Props) {
  const reduced = usePrefersReducedMotion();
  // Lazy init runs once per component instance — captures jitter at mount.
  const [flies] = React.useState<Firefly[]>(() => generateFlies(count, radius));

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        left: cx,
        top: cy,
        width: 0,
        height: 0,
        zIndex: 4,
      }}
    >
      {flies.map((f) => (
        <FireflyDot key={f.id} f={f} accent={accent} />
      ))}
    </div>
  );
}

function FireflyDot({ f, accent }: { f: Firefly; accent: string }) {
  return (
    <motion.span
      style={{
        position: "absolute",
        left: f.dx,
        top: f.dy,
        width: f.size * 4,
        height: f.size * 4,
        marginLeft: -f.size * 2,
        marginTop: -f.size * 2,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${accent}ee 0%, ${accent}66 35%, transparent 65%)`,
        filter: "blur(0.5px)",
        mixBlendMode: "screen",
      }}
      animate={{
        x: [0, 18, -22, 12, 0],
        y: [0, -14, 10, -18, 0],
        opacity: [0.15, 0.95, 0.3, 0.85, 0.15],
      }}
      transition={{
        x: { duration: f.driftDuration, repeat: Infinity, ease: "easeInOut" },
        y: { duration: f.driftDuration * 0.85, repeat: Infinity, ease: "easeInOut" },
        opacity: {
          duration: f.blinkPeriod,
          repeat: Infinity,
          ease: "easeInOut",
          delay: f.blinkPhase * f.blinkPeriod,
        },
      }}
    />
  );
}
