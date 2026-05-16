"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Verdict } from "@/types/encounter";

/* ============================================================
   FloatingControl — one piece of chrome, bottom-center.
   - idle: a small button "Begin encounter" that expands into
     a repo input + roll on click.
   - running: morphs into a slim HP bar with a live count.
   - done: shows verdict + reset button.
   ============================================================ */

interface FloatingControlProps {
  phase: "idle" | "running" | "done";
  onStart: (repo: string | null) => void;
  onReset: () => void;
  hp: number;
  hpMax: number;
  hpDelta: number;
  verdict: Verdict | null;
}

export function FloatingControl({
  phase,
  onStart,
  onReset,
  hp,
  hpMax,
  hpDelta,
  verdict,
}: FloatingControlProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [value, setValue] = React.useState("");

  return (
    <div className="pointer-events-auto absolute bottom-6 left-1/2 z-40 -translate-x-1/2 select-none">
      <AnimatePresence mode="wait">
        {phase === "idle" && !expanded && (
          <motion.button
            key="start-btn"
            type="button"
            onClick={() => setExpanded(true)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="group relative rounded-full px-7 py-3 font-mono text-[11px] uppercase tracking-[0.32em] transition hover:brightness-110"
            style={{
              background:
                "linear-gradient(180deg, #14110C 0%, #2A241C 100%)",
              border: "1px solid rgba(224, 187, 114, 0.55)",
              color: "#E0BB72",
              boxShadow:
                "0 18px 40px -16px rgba(0,0,0,0.85), 0 0 24px rgba(224, 187, 114, 0.18), inset 0 1px 0 rgba(224, 187, 114, 0.25)",
            }}
          >
            <span
              aria-hidden
              className="absolute -left-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
              style={{
                background: "#E0BB72",
                boxShadow: "0 0 12px #E0BB72",
                opacity: 0.85,
              }}
            />
            Begin encounter
            <span
              aria-hidden
              className="absolute -right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
              style={{
                background: "#E0BB72",
                boxShadow: "0 0 12px #E0BB72",
                opacity: 0.85,
              }}
            />
          </motion.button>
        )}

        {phase === "idle" && expanded && (
          <motion.div
            key="start-input"
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.28 }}
            className="flex items-stretch overflow-hidden rounded-full"
            style={{
              width: 460,
              background:
                "linear-gradient(180deg, rgba(20,16,10,0.92) 0%, rgba(42,36,28,0.92) 100%)",
              border: "1px solid rgba(224, 187, 114, 0.55)",
              boxShadow:
                "0 22px 50px -18px rgba(0,0,0,0.90), 0 0 30px rgba(224, 187, 114, 0.22), inset 0 1px 0 rgba(224, 187, 114, 0.25)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <input
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onStart(value.trim() || null);
                if (e.key === "Escape") { setExpanded(false); setValue(""); }
              }}
              placeholder="github.com/owner/repo/pull/123"
              className="flex-1 bg-transparent px-5 py-3 font-mono text-[12px] tracking-wide text-[var(--fg)] placeholder:text-[var(--fg-soft)] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onStart(value.trim() || null)}
              className="border-l border-white/10 px-6 font-mono text-[10px] uppercase tracking-[0.32em] transition hover:brightness-110"
              style={{
                background:
                  "linear-gradient(180deg, #E0BB72 0%, #B0884B 100%)",
                color: "#14110C",
              }}
            >
              Roll
            </button>
          </motion.div>
        )}

        {phase === "running" && (
          <motion.div
            key="hp-running"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
          >
            <SlimHpBar hp={hp} hpMax={hpMax} hpDelta={hpDelta} verdict={null} />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="hp-done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-3"
          >
            <SlimHpBar hp={hp} hpMax={hpMax} hpDelta={hpDelta} verdict={verdict} />
            <button
              type="button"
              onClick={() => { onReset(); setExpanded(false); setValue(""); }}
              className="rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] transition hover:brightness-110"
              style={{
                background: "rgba(20,16,10,0.85)",
                border: "1px solid rgba(224, 187, 114, 0.35)",
                color: "var(--fg)",
              }}
            >
              Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================================================
   SlimHpBar — compact bar used inside FloatingControl.
   ============================================================ */

function SlimHpBar({
  hp,
  hpMax,
  hpDelta,
  verdict,
}: {
  hp: number;
  hpMax: number;
  hpDelta: number;
  verdict: Verdict | null;
}) {
  const pct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
  const fillTone =
    pct > 66 ? "#5BD18A" :
    pct > 33 ? "#E0BB72" :
                "#E04C2B";

  return (
    <div
      className="flex items-center gap-4 rounded-full px-5 py-2"
      style={{
        background: "rgba(20,16,10,0.85)",
        border: "1px solid rgba(176, 136, 75, 0.55)",
        boxShadow:
          "0 14px 36px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(224,187,114,0.18)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.30em] text-[var(--fg-soft)]">
        PR HP
      </span>
      <div
        className="relative h-[12px] w-[360px] overflow-hidden rounded-full"
        style={{
          background: "rgba(20, 16, 10, 0.9)",
          border: "1px solid rgba(176, 136, 75, 0.45)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        <motion.div
          className="absolute left-0 top-0 h-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            background: `linear-gradient(180deg, ${fillTone} 0%, ${darken(fillTone)} 100%)`,
            boxShadow: `0 0 14px ${fillTone}88, inset 0 0 0 1px rgba(255,255,255,0.10)`,
          }}
        />
        <AnimatePresence>
          {hpDelta < 0 && (
            <motion.span
              key={hp}
              aria-hidden
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-display text-[10px] tabular-nums"
              style={{ color: "#FF8B6B", textShadow: "0 0 8px #E04C2B" }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], y: -8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
            >
              {hpDelta}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <span className="font-display text-[14px] tabular-nums leading-none text-[var(--fg)]">
        {hp}
        <span className="ml-1 text-[var(--fg-soft)] text-[10px]">/ {hpMax}</span>
      </span>
      {verdict && (
        <span
          className="ml-2 font-mono text-[10px] uppercase tracking-[0.26em]"
          style={{ color: verdictColor(verdict) }}
        >
          {verdictLabel(verdict)}
        </span>
      )}
    </div>
  );
}

function darken(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 60);
  const g = Math.max(0, ((n >>  8) & 0xff) - 60);
  const b = Math.max(0, ((n      ) & 0xff) - 60);
  return `rgb(${r}, ${g}, ${b})`;
}

function verdictLabel(v: Verdict): string {
  if (v === "blocked") return "Blocked";
  if (v === "changes_required") return "Changes Required";
  return "Approved · Notes";
}
function verdictColor(v: Verdict): string {
  if (v === "blocked") return "#E04C2B";
  if (v === "changes_required") return "#E0BB72";
  return "#B9D87B";
}
