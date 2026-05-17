"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { clearEncounterCache } from "@/lib/api/use-island-analysis-remote";

/**
 * Top-right escape hatch back to the home / fixture selector. Styled as
 * a tiny parchment ribbon with brass dowel caps so it sits in the same
 * visual language as the GitHub scroll input and the council crest on
 * the home page, rather than reading as a generic floating button.
 *
 * Sits at z-20 — above the CharacterPanel (z-5) and the IslandNavigator
 * arrows (z-5) so it remains clickable no matter which island is open.
 */
export function ReturnHomeSeal() {
  const router = useRouter();
  const reduced = usePrefersReducedMotion();

  const handleClick = () => {
    // Abort the in-flight stream and clear cached state — if the user
    // immediately submits a new PR from the home page we want a fresh
    // analysis, not stale findings from the previous one.
    clearEncounterCache();
    router.push("/");
  };

  return (
    <motion.button
      type="button"
      aria-label="Return to the council hall"
      onClick={handleClick}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      whileHover={reduced ? undefined : { scale: 1.04, rotate: -0.6 }}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className="group fixed right-5 top-5 z-[20] inline-flex items-center gap-2 px-4 py-2 md:right-7 md:top-7"
      style={{
        background:
          "linear-gradient(180deg, #F3E4BA 0%, #E9DCB7 50%, #D4C290 100%)",
        borderRadius: 4,
        boxShadow: `
          0 6px 14px -6px rgba(20,12,4,0.55),
          inset 0 0 0 1px rgba(255,240,200,0.55),
          inset 0 -3px 6px -3px rgba(120,80,30,0.35),
          0 0 18px rgba(224, 187, 114, 0.25)
        `,
        cursor: "pointer",
      }}
    >
      {/* Brass cap, left dowel — mirrors the GithubScroll caps */}
      <ScrollDowel side="left" />

      {/* Chevron pointing back to the hall */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#5A3F1E"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className="relative z-[1] transition-transform duration-300 group-hover:-translate-x-0.5"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>

      {/* Tiny seat marker — pulsing ink dot, signals "active session" */}
      <motion.span
        aria-hidden
        className="relative z-[1] inline-block rounded-full"
        style={{
          width: 5,
          height: 5,
          background: "#9A2A1F",
          boxShadow: "0 0 6px rgba(154,42,31,0.85)",
        }}
        animate={
          reduced
            ? undefined
            : { opacity: [0.45, 1, 0.45], scale: [0.85, 1.1, 0.85] }
        }
        transition={
          reduced
            ? undefined
            : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
        }
      />

      <span
        className="relative z-[1] font-display uppercase tracking-[0.32em]"
        style={{
          fontSize: "10.5px",
          color: "#2B1B0A",
          textShadow: "0 1px 0 rgba(255,240,200,0.65)",
        }}
      >
        Adjourn
      </span>

      <ScrollDowel side="right" />
    </motion.button>
  );
}

function ScrollDowel({ side }: { side: "left" | "right" }) {
  return (
    <span
      aria-hidden
      className="absolute top-0 h-full"
      style={{
        [side]: -4,
        width: 6,
        borderRadius: side === "left" ? "4px 0 0 4px" : "0 4px 4px 0",
        background:
          side === "left"
            ? "radial-gradient(ellipse at 30% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)"
            : "radial-gradient(ellipse at 70% 50%, #C29A52 0%, #7C5418 60%, #2E1E08 100%)",
        boxShadow: "0 2px 3px rgba(0,0,0,0.5)",
      }}
    />
  );
}
