"use client";

import { motion, AnimatePresence } from "motion/react";

interface Props {
  phase: "scanning" | "analyzing" | "done";
  accent: string;
  findingCount: number;
  /** True while this character's agent is actively running on the backend. */
  isAnalyzing?: boolean;
  /** Per-character error (this agent's pipeline failed). */
  characterError?: string | null;
  /** Top-level stream error (connection / timeout). */
  globalError?: string | null;
}

const PHASE_PCT: Record<Props["phase"], number> = {
  scanning: 25,
  analyzing: 65,
  done: 100,
};

const PHASE_TEXT: Record<Props["phase"], string> = {
  scanning: "Initial sweep",
  analyzing: "Analyzing diff…",
  done: "Verdict ready",
};

export function StatusFooter({
  phase,
  accent,
  findingCount,
  isAnalyzing = phase !== "done",
  characterError = null,
  globalError = null,
}: Props) {
  const pct = PHASE_PCT[phase];
  const hasError = !!(characterError || globalError);

  return (
    <footer className="mt-6 px-12 pb-10 xl:px-16">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
        <span className="flex items-center gap-2">
          {isAnalyzing && !hasError && <PulsingDot accent={accent} />}
          {PHASE_TEXT[phase]}
          {isAnalyzing && !hasError && <AnimatedDots />}
        </span>
        <span>
          {findingCount} finding{findingCount === 1 ? "" : "s"}
        </span>
      </div>
      <div
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="h-full relative"
          animate={{ width: hasError ? "100%" : `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: hasError ? "#E04C2B" : accent,
            boxShadow: hasError
              ? "0 0 10px #E04C2Baa"
              : `0 0 10px ${accent}aa`,
          }}
        >
          {/* Shimmer sweeping across the active bar while the agent is busy. */}
          {isAnalyzing && !hasError && (
            <motion.span
              aria-hidden
              className="absolute inset-y-0 left-0"
              style={{
                width: "30%",
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
                mixBlendMode: "screen",
              }}
              animate={{ x: ["-30%", "330%"] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {hasError && (
          <motion.div
            key="err"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-3 flex items-start gap-2 rounded-[3px] px-3 py-2"
            style={{
              background: "rgba(224, 76, 43, 0.08)",
              border: "1px solid rgba(224, 76, 43, 0.40)",
              color: "#F2B6A8",
            }}
          >
            <span aria-hidden className="font-mono text-[10px] mt-[2px]">
              ⚠
            </span>
            <span className="font-display italic text-[12px] leading-snug">
              {globalError ?? characterError}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </footer>
  );
}

function PulsingDot({ accent }: { accent: string }) {
  return (
    <motion.span
      aria-hidden
      className="inline-block h-[7px] w-[7px] rounded-full"
      style={{ background: accent, boxShadow: `0 0 8px ${accent}cc` }}
      animate={{ opacity: [0.4, 1, 0.4], scale: [0.85, 1.15, 0.85] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function AnimatedDots() {
  return (
    <span aria-hidden className="inline-flex gap-[2px] ml-[1px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block"
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.18,
            ease: "easeInOut",
          }}
        >
          .
        </motion.span>
      ))}
    </span>
  );
}
