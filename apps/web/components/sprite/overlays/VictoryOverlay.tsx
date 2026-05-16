"use client";

import * as React from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Props {
  size: number;
}

const GOLD = "#FCD34D";

/**
 * Self-removing celebration: two expanding gold rings + six radial
 * sparks. Total runtime ≈ 1.5s. The parent should mount it once and
 * leave it alone — it owns its own lifetime via the `done` flag.
 */
export function VictoryOverlay({ size }: Props) {
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;

  if (reduced) {
    // single flash, no expansion
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div
          style={{
            width: size * 0.7,
            height: size * 0.7,
            borderRadius: "50%",
            background: `radial-gradient(closest-side, ${GOLD}55 0%, transparent 70%)`,
          }}
        />
      </div>
    );
  }

  const sparks = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const r = size * 0.55;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      delay: i * 0.04,
    };
  });

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
    >
      {/* expanding rings */}
      {[0, 0.18].map((delay) => (
        <motion.span
          key={delay}
          initial={{ scale: 0.4, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1.2, delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: "50%",
            border: `2px solid ${GOLD}`,
            boxShadow: `0 0 30px ${GOLD}aa`,
          }}
        />
      ))}
      {/* radial sparks */}
      {sparks.map((s, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 0 }}
          animate={{ x: s.x, y: s.y, scale: 1.0, opacity: 0 }}
          transition={{
            duration: 1.1,
            delay: s.delay,
            ease: [0.2, 0.7, 0.3, 1],
          }}
          style={{
            position: "absolute",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: GOLD,
            boxShadow: `0 0 12px ${GOLD}`,
          }}
        />
      ))}
    </div>
  );
}
