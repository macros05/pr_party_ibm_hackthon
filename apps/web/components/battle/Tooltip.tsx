"use client";

import { motion } from "motion/react";
import type { CharacterId, CharacterStatus } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";

const DESCRIPTIONS: Record<CharacterId, string> = {
  aegis:
    "Catches RCE, SSRF, secret leaks and broken authentication before they reach prod.",
  schema:
    "Audits migrations, indexes, query plans and any change that touches persisted state.",
  pixel:
    "Reads the diff like a designer — copy, a11y, focus states, motion, contrast.",
  atlas:
    "Watches the seams between modules and flags coupling, missing flags, layering drift.",
  echo:
    "Hunts gaps in test coverage and the kinds of tests that pass for the wrong reasons.",
  codex:
    "Keeps the docs in sync with the diff. If the README still lies, Codex will notice.",
};

const STATUS_LABEL: Record<CharacterStatus, string> = {
  idle: "Standing by",
  thinking: "Consulting Bob",
  active: "In council",
  done: "Concluded",
};

export function Tooltip({
  id,
  status,
  findingsCount,
}: {
  id: CharacterId;
  status: CharacterStatus;
  findingsCount: number;
}) {
  const c = CHARACTERS[id];
  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="pointer-events-none absolute left-1/2 z-30 w-[260px] -translate-x-1/2"
      style={{ top: "-118px" }}
    >
      <div
        className="relative rounded-md px-4 py-3 backdrop-blur-md"
        style={{
          background: "rgba(20, 16, 10, 0.88)",
          border: "1px solid rgba(224, 187, 114, 0.30)",
          boxShadow: "var(--shadow-panel)",
        }}
      >
        {/* gold accent rail */}
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[2px] rounded-l-md"
          style={{ background: `linear-gradient(180deg, ${c.accent} 0%, transparent 100%)` }}
        />
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[18px] leading-none tracking-tight text-[var(--fg)]">
            {c.name}
          </p>
          <p
            className="font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{ color: c.accent }}
          >
            L{c.defaultLevel.toString().padStart(2, "0")}
          </p>
        </div>
        <p
          className="mt-1 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-muted)]"
        >
          {c.class}
        </p>
        <p className="mt-3 text-[12px] leading-snug text-[var(--fg-muted)]">
          {DESCRIPTIONS[id]}
        </p>
        <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 font-mono text-[9px] uppercase tracking-[0.18em]">
          <span style={{ color: c.accent }}>{STATUS_LABEL[status]}</span>
          <span className="text-[var(--fg-soft)]">
            {findingsCount} finding{findingsCount === 1 ? "" : "s"}
          </span>
        </div>
        {/* notch */}
        <span
          aria-hidden
          className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45"
          style={{
            background: "rgba(20, 16, 10, 0.88)",
            borderRight: "1px solid rgba(224, 187, 114, 0.30)",
            borderBottom: "1px solid rgba(224, 187, 114, 0.30)",
          }}
        />
      </div>
    </motion.div>
  );
}
