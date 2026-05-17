"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

interface Props {
  /** Robot sprite size, used to size & position the scroll relative to it. */
  size: number;
  accent: string;
}

/**
 * A small parchment ribbon that floats above the robot while its agent is
 * still processing the diff. Replaces what was previously a silent walking
 * sprite — gives the user a constant signal that the agent is alive even
 * before any findings have arrived from the backend.
 *
 * Anchored to the top of the robot bounding box, scales with `size`, and
 * gently bobs so it reads as floating rather than pasted on. Hidden
 * entirely under prefers-reduced-motion to avoid the bob loop.
 */
export function WorkingScroll({ size, accent }: Props) {
  const reduced = usePrefersReducedMotion();
  const label = "Analyzing";

  const scrollWidth = Math.max(96, size * 1.55);
  const scrollHeight = Math.max(24, size * 0.4);

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute"
      style={{
        // Lives above the robot, centered horizontally.
        left: "50%",
        top: -size * 0.55,
        width: scrollWidth,
        height: scrollHeight,
        marginLeft: -scrollWidth / 2,
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={reduced ? { opacity: 1, y: 0 } : { opacity: 1, y: [-2, 2, -2] }}
      transition={
        reduced
          ? { duration: 0.4 }
          : { duration: 2.6, repeat: Infinity, ease: "easeInOut" }
      }
      exit={{ opacity: 0, y: -4 }}
    >
      {/* Anchor rope down to the robot's head — subtle, looks like the
          scroll is hovering on a thread. */}
      <span
        className="absolute left-1/2 -bottom-[8px] h-[8px] w-px"
        style={{
          background: `linear-gradient(180deg, rgba(60,40,20,0.6), transparent)`,
        }}
      />

      <div
        className="relative h-full w-full"
        style={{
          background:
            "linear-gradient(180deg, #F3E4BA 0%, #E9DCB7 50%, #D4C290 100%)",
          borderRadius: 3,
          boxShadow: `
            0 6px 16px -6px rgba(20,12,4,0.55),
            inset 0 0 0 1px rgba(255,240,200,0.55),
            inset 0 -4px 8px -4px rgba(120,80,30,0.35),
            0 0 18px ${accent}55
          `,
        }}
      >
        {/* Left & right scroll caps — tiny dowels. */}
        <ScrollCap side="left" height={scrollHeight} />
        <ScrollCap side="right" height={scrollHeight} />

        {/* Inner gold rule + paper grain illusion via subtle border. */}
        <div
          className="absolute inset-[3px] flex items-center justify-center gap-1"
          style={{
            border: "1px solid rgba(112,76,28,0.45)",
            borderRadius: 2,
          }}
        >
          {/* Pulsing ink dot left of the label so the eye reads "active" */}
          <motion.span
            aria-hidden
            className="inline-block rounded-full"
            style={{
              width: Math.max(4, size * 0.06),
              height: Math.max(4, size * 0.06),
              background: accent,
              boxShadow: `0 0 6px ${accent}cc`,
            }}
            animate={
              reduced
                ? { opacity: 1 }
                : { opacity: [0.35, 1, 0.35], scale: [0.85, 1.15, 0.85] }
            }
            transition={
              reduced
                ? undefined
                : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
          />
          <span
            className="font-display uppercase tracking-[0.28em]"
            style={{
              fontSize: Math.max(8, size * 0.13),
              color: "#2B1B0A",
              textShadow: "0 1px 0 rgba(255,240,200,0.65)",
            }}
          >
            {label}
          </span>
          {/* Animated typing dots */}
          <span className="inline-flex" style={{ width: Math.max(10, size * 0.16) }}>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="inline-block"
                style={{
                  fontSize: Math.max(8, size * 0.13),
                  color: "#2B1B0A",
                  marginLeft: i === 0 ? 0 : Math.max(1, size * 0.01),
                }}
                animate={
                  reduced
                    ? { opacity: 1 }
                    : { opacity: [0.2, 1, 0.2] }
                }
                transition={
                  reduced
                    ? undefined
                    : {
                        duration: 1.1,
                        repeat: Infinity,
                        delay: i * 0.18,
                        ease: "easeInOut",
                      }
                }
              >
                .
              </motion.span>
            ))}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ScrollCap({
  side,
  height,
}: {
  side: "left" | "right";
  height: number;
}) {
  return (
    <span
      aria-hidden
      className="absolute top-0 h-full"
      style={{
        [side]: -3,
        width: 5,
        borderRadius: side === "left" ? "3px 0 0 3px" : "0 3px 3px 0",
        background:
          side === "left"
            ? "radial-gradient(ellipse at 30% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)"
            : "radial-gradient(ellipse at 70% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)",
        boxShadow: "0 2px 3px rgba(0,0,0,0.5)",
        height,
      }}
    />
  );
}
