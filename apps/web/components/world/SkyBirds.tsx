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
 * 1–3 tiny silhouette birds cross the sky right→left in a slow,
 * descending arc, with their two-frame flap. They appear at irregular
 * intervals so the sky doesn't feel scripted.
 *
 * Sits between cloud back and cloud mid layers (z=2).
 */
export function SkyBirds() {
  const reduced = usePrefersReducedMotion();
  const [birds, setBirds] = React.useState<Bird[]>([]);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    if (reduced) return;
    let cancelled = false;

    function spawn() {
      if (cancelled) return;
      const startY = 8 + Math.random() * 22; // top 8-30vh
      const endY = startY + 4 + Math.random() * 8; // gentle descent
      const next: Bird = {
        id: ++idRef.current,
        startY,
        endY,
        size: 12 + Math.random() * 8,
        duration: 28 + Math.random() * 6,
        delay: 0,
      };
      setBirds((prev) => [...prev, next]);
      // remove after it crosses
      window.setTimeout(() => {
        if (cancelled) return;
        setBirds((prev) => prev.filter((b) => b.id !== next.id));
      }, (next.duration + 1) * 1000);

      const nextDelay = 25_000 + Math.random() * 20_000;
      window.setTimeout(spawn, nextDelay);
    }

    // First bird shortly after mount.
    const t = window.setTimeout(spawn, 4_000 + Math.random() * 4_000);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
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
