"use client";

import * as React from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Bird {
  id: number;
  startY: number;
  endY: number;
  size: number;
  duration: number;
  delay: number;
}

const BIRD_COLOR = "#2C5F7A";

const WINGS_DOWN = "M 0 0 Q 6 6 12 0 Q 18 6 24 0";
const WINGS_UP = "M 0 4 Q 6 -4 12 4 Q 18 -4 24 4";

/**
 * 4–5 tiny silhouette birds cross the sky right→left in a slow,
 * descending arc, with their two-frame flap. A starter flock spawns
 * shortly after mount with staggered offsets; subsequent birds replace
 * them at shorter, irregular intervals so the sky always has several
 * crossing at once but never feels scripted.
 *
 * Sits between cloud back and cloud mid layers (z=2).
 */
const TARGET_FLOCK = 5;

export function SkyBirds() {
  const reduced = usePrefersReducedMotion();
  const [birds, setBirds] = React.useState<Bird[]>([]);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const timeouts: number[] = [];

    function spawnOne() {
      if (cancelled) return;
      const startY = 6 + Math.random() * 32; // top 6-38vh
      const endY = startY + 4 + Math.random() * 12; // gentle descent
      const next: Bird = {
        id: ++idRef.current,
        startY,
        endY,
        size: 13 + Math.random() * 12,
        duration: 24 + Math.random() * 12,
        delay: 0,
      };
      setBirds((prev) => [...prev, next]);
      timeouts.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setBirds((prev) => prev.filter((b) => b.id !== next.id));
        }, (next.duration + 1) * 1000),
      );
    }

    // Seed a starter flock — TARGET_FLOCK birds with staggered entries
    // so they don't all align at the right edge on frame zero.
    for (let i = 0; i < TARGET_FLOCK; i++) {
      timeouts.push(
        window.setTimeout(spawnOne, 200 + i * (2_200 + Math.random() * 1_800)),
      );
    }

    // Then keep topping up: every 4-9s spawn another, the array stays
    // around the target size because old ones expire as they cross.
    function loop() {
      if (cancelled) return;
      spawnOne();
      const nextDelay = 4_000 + Math.random() * 5_000;
      timeouts.push(window.setTimeout(loop, nextDelay));
    }
    timeouts.push(window.setTimeout(loop, TARGET_FLOCK * 2_400 + 2_000));

    return () => {
      cancelled = true;
      for (const t of timeouts) window.clearTimeout(t);
    };
  }, [reduced]);

  if (reduced) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 2 }}
    >
      {birds.map((b) => (
        <BirdSilhouette key={b.id} {...b} />
      ))}
    </div>
  );
}

function BirdSilhouette({ startY, endY, size, duration }: Bird) {
  const [flap, setFlap] = React.useState(false);
  React.useEffect(() => {
    const iv = window.setInterval(() => setFlap((f) => !f), 380);
    return () => window.clearInterval(iv);
  }, []);

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 6"
      initial={{ x: "calc(100vw + 40px)", y: `${startY}vh`, opacity: 0 }}
      animate={{
        x: "-60px",
        y: `${endY}vh`,
        opacity: [0, 0.55, 0.55, 0],
      }}
      transition={{
        duration,
        ease: "linear",
        times: [0, 0.05, 0.95, 1],
      }}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        color: BIRD_COLOR,
      }}
    >
      <path
        d={flap ? WINGS_UP : WINGS_DOWN}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}
