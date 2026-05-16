"use client";

import * as React from "react";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

/**
 * Self-removing red-flash + shake when the verdict comes back as
 * "critical". Parent mounts it; it cleans up after ~400 ms.
 *
 * NOTE: shake is applied INSIDE this overlay's box, but the visual
 * shake of the robot itself is handled by the SpriteRobot parent
 * passing a key-bumped animate prop. This overlay only handles the
 * red tint.
 */
export function HitOverlay() {
  const reduced = usePrefersReducedMotion();
  const [done, setDone] = React.useState(false);

  React.useEffect(() => {
    const t = window.setTimeout(() => setDone(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  if (done) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={{ opacity: 0 }}
      animate={
        reduced
          ? { opacity: 0.5 }
          : { opacity: [0, 0.7, 0] }
      }
      transition={{
        duration: reduced ? 0.2 : 0.4,
        times: reduced ? undefined : [0, 0.2, 1],
        ease: "easeOut",
      }}
      style={{
        background: "#E04C2B",
        mixBlendMode: "multiply",
      }}
    />
  );
}
