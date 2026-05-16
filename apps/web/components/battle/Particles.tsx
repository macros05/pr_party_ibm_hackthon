"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CharacterId } from "@/types/encounter";
import { CHARACTERS, CHARACTER_ORDER } from "@/tokens/characters";

/* ============================================================
   AmbientParticles — every ~9s a small puff drifts upward from
   each zone, tinted with the character's accent.
   ============================================================ */

interface AmbientPuff {
  key: number;
  character_id: CharacterId;
  dx: number;
  delay: number;
}

export function AmbientParticles() {
  const [puffs, setPuffs] = React.useState<AmbientPuff[]>([]);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    let mounted = true;
    function spawn() {
      if (!mounted) return;
      const id = CHARACTER_ORDER[Math.floor(Math.random() * CHARACTER_ORDER.length)];
      const k = ++idRef.current;
      const dx = (Math.random() - 0.5) * 18;
      setPuffs((prev) => [...prev, { key: k, character_id: id, dx, delay: 0 }]);
      window.setTimeout(() => {
        setPuffs((prev) => prev.filter((p) => p.key !== k));
      }, 4200);
      window.setTimeout(spawn, 1400 + Math.random() * 1600);
    }
    const first = window.setTimeout(spawn, 1200);
    return () => {
      mounted = false;
      window.clearTimeout(first);
    };
  }, []);

  return (
    <>
      {puffs.map((p) => {
        const c = CHARACTERS[p.character_id];
        return (
          <motion.span
            key={p.key}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 6,
              height: 6,
              background: c.accent,
              boxShadow: `0 0 12px ${c.accent}`,
              mixBlendMode: "screen",
            }}
            initial={{ opacity: 0, y: 0, scale: 0.6 }}
            animate={{
              opacity: [0, 0.85, 0],
              y: -60,
              x: p.dx,
              scale: [0.6, 1, 0.4],
            }}
            transition={{ duration: 4, ease: "easeOut" }}
          />
        );
      })}
    </>
  );
}

/* ============================================================
   ExpandingRings — emitted at the zone of each finding.
   ============================================================ */

export function ExpandingRing({
  character_id,
  critical,
  onDone,
}: {
  character_id: CharacterId;
  critical: boolean;
  onDone: () => void;
}) {
  const c = CHARACTERS[character_id];
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: 200,
        height: 200,
        border: `2px solid ${c.accent}`,
        boxShadow: critical ? `0 0 22px ${c.accent}` : "none",
        mixBlendMode: "screen",
      }}
      initial={{ scale: 0.4, opacity: critical ? 0.95 : 0.7 }}
      animate={{ scale: critical ? 2.4 : 1.8, opacity: 0 }}
      transition={{ duration: 1.1, ease: "easeOut" }}
      onAnimationComplete={onDone}
    />
  );
}

/* ============================================================
   XPFloat — small +N number that floats up over the robot.
   ============================================================ */

export function XPFloat({
  character_id,
  amount,
  critical,
  onDone,
}: {
  character_id: CharacterId;
  amount: number;
  critical: boolean;
  onDone: () => void;
}) {
  const c = CHARACTERS[character_id];
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-display font-medium"
      style={{
        color: c.accent,
        fontSize: critical ? 36 : 24,
        textShadow: `0 2px 8px rgba(0,0,0,0.95), 0 0 14px ${c.accent}`,
        letterSpacing: "-0.02em",
      }}
      initial={{ opacity: 0, y: -10, scale: 0.6 }}
      animate={{ opacity: [0, 1, 1, 0], y: -90, scale: critical ? 1.1 : 1 }}
      transition={{ duration: 1.6, ease: "easeOut" }}
      onAnimationComplete={onDone}
    >
      −{amount}
    </motion.span>
  );
}

/* ============================================================
   CritFlash — brief white flash over the zone on a crit.
   ============================================================ */

export function CritFlash({ onDone }: { onDone: () => void }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        width: 240,
        height: 240,
        background:
          "radial-gradient(closest-side, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 70%)",
        mixBlendMode: "screen",
      }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: [0, 1, 0], scale: [0.5, 1.1, 1.3] }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={onDone}
    />
  );
}

export { AnimatePresence };
