"use client";

import { motion } from "motion/react";

interface Props {
  phase: "scanning" | "analyzing" | "done";
  accent: string;
  findingCount: number;
}

const PHASE_PCT: Record<Props["phase"], number> = {
  scanning: 25,
  analyzing: 65,
  done: 100,
};

const PHASE_TEXT: Record<Props["phase"], string> = {
  scanning: "Initial sweep",
  analyzing: "Cataloguing findings",
  done: "Verdict ready",
};

export function StatusFooter({ phase, accent, findingCount }: Props) {
  const pct = PHASE_PCT[phase];

  return (
    <footer className="mt-6 px-12 pb-10 xl:px-16">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
        <span>{PHASE_TEXT[phase]}</span>
        <span>
          {findingCount} finding{findingCount === 1 ? "" : "s"}
        </span>
      </div>
      <div
        className="mt-2 h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.div
          className="h-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{
            background: accent,
            boxShadow: `0 0 10px ${accent}aa`,
          }}
        />
      </div>
    </footer>
  );
}
