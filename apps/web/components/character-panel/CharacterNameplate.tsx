"use client";

import { motion, AnimatePresence } from "motion/react";
import type { CharacterId } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

const PHASE_LABEL = {
  scanning: "Scanning the diff",
  analyzing: "Audit in progress",
  done: "Audit complete",
} as const;

interface Props {
  id: CharacterId;
  phase: "scanning" | "analyzing" | "done";
}

/**
 * Display name + class chip + flavor text. The name uses Fraunces and
 * scales with viewport. On mount it blurs in from below; the drop
 * shadow gently pulses with the character accent so the name reads
 * as "alive".
 */
export function CharacterNameplate({ id, phase }: Props) {
  const c = CHARACTERS[id];
  const reduced = usePrefersReducedMotion();

  return (
    <div className="px-12 pt-12 xl:px-16">
      <motion.p
        className="font-mono text-[10px] uppercase tracking-[0.32em]"
        style={{ color: c.accent }}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
      >
        Council seat · {c.classShort}
      </motion.p>

      <motion.h1
        className="mt-3 font-display tracking-tight"
        initial={
          reduced
            ? { opacity: 0 }
            : { opacity: 0, y: 20, filter: "blur(12px)" }
        }
        animate={
          reduced
            ? { opacity: 1 }
            : { opacity: 1, y: 0, filter: "blur(0px)" }
        }
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{
          fontSize: "clamp(80px, 9vw, 140px)",
          lineHeight: 0.92,
          color: "#F5EBDA",
          letterSpacing: "-0.02em",
          textShadow: `0 4px 24px rgba(0,0,0,0.6), 0 1px 2px ${c.accent}50`,
        }}
      >
        <NamePulse name={c.name} accent={c.accent} reduced={reduced} />
      </motion.h1>

      <motion.div
        className="mt-4 flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/55"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <span>Level {c.defaultLevel.toString().padStart(2, "0")}</span>
        <span aria-hidden>·</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            style={{ color: c.accent }}
          >
            {PHASE_LABEL[phase]}
          </motion.span>
        </AnimatePresence>
      </motion.div>

      <motion.p
        className="mt-6 max-w-[520px] text-[14px] leading-relaxed text-white/70"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
      >
        {c.description}
      </motion.p>
    </div>
  );
}

function NamePulse({
  name,
  accent,
  reduced,
}: {
  name: string;
  accent: string;
  reduced: boolean;
}) {
  if (reduced) return <>{name}</>;
  // Subtle "breathing" of the accent glow via animated text-shadow.
  return (
    <motion.span
      style={{ display: "inline-block" }}
      animate={{
        textShadow: [
          `0 4px 24px rgba(0,0,0,0.6), 0 1px 2px ${accent}40`,
          `0 4px 30px rgba(0,0,0,0.6), 0 1px 2px ${accent}80`,
          `0 4px 24px rgba(0,0,0,0.6), 0 1px 2px ${accent}40`,
        ],
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    >
      {name}
    </motion.span>
  );
}
