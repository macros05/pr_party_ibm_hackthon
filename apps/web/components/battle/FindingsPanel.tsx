"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { CharacterId, Finding, Severity, Verdict } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "Info",
};

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "#E04C2B",
  high:     "#E0BB72",
  medium:   "#B9D87B",
  low:      "#7DD3E2",
  none:     "#B6A684",
};

interface FindingsPanelProps {
  open: boolean;
  findings: Array<{ character_id: CharacterId; finding: Finding }>;
  verdict: Verdict | null;
  prTitle: string | null;
  prRepo: string | null;
  prNumber: number | null;
}

export function FindingsPanel({
  open,
  findings,
  verdict,
  prTitle,
  prRepo,
  prNumber,
}: FindingsPanelProps) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  // auto-scroll to bottom on new finding
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [findings.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: 64, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 64, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
          className="pointer-events-auto absolute right-3 top-3 z-40 flex h-[calc(100dvh-24px)] w-[360px] flex-col rounded-lg"
          style={{
            background: "rgba(20, 16, 10, 0.78)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(224, 187, 114, 0.22)",
            boxShadow: "var(--shadow-panel)",
          }}
        >
          {/* header */}
          <header className="border-b border-white/5 px-5 pb-4 pt-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
              Encounter log
            </p>
            <p className="mt-2 font-display text-[18px] leading-tight text-[var(--fg)]">
              {prTitle ?? "Awaiting PR…"}
            </p>
            {prRepo && (
              <p className="mt-1 font-mono text-[10px] text-[var(--fg-muted)]">
                {prRepo} #{prNumber}
              </p>
            )}
          </header>

          {/* findings list */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4"
            style={{ scrollbarWidth: "thin" }}
          >
            <AnimatePresence initial={false}>
              {findings.map((entry, i) => (
                <FindingCard
                  key={entry.finding.id}
                  entry={entry}
                  index={i}
                />
              ))}
            </AnimatePresence>

            {findings.length === 0 && (
              <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
                The council is listening…
              </p>
            )}
          </div>

          {/* verdict footer */}
          <footer className="border-t border-white/5 px-5 py-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
              Verdict
            </p>
            {verdict ? (
              <p
                className="mt-1 font-display text-[20px] leading-tight"
                style={{ color: verdictColor(verdict) }}
              >
                {verdictLabel(verdict)}
              </p>
            ) : (
              <p className="mt-1 font-mono text-[11px] text-[var(--fg-muted)]">
                Pending…
              </p>
            )}
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function FindingCard({
  entry,
  index,
}: {
  entry: { character_id: CharacterId; finding: Finding };
  index: number;
}) {
  const c = CHARACTERS[entry.character_id];
  const f = entry.finding;
  return (
    <motion.article
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative mb-3 rounded-md p-3"
      style={{
        background: "rgba(255, 255, 255, 0.025)",
        border: "1px solid rgba(224, 187, 114, 0.10)",
      }}
    >
      {/* accent rail */}
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-md"
        style={{ background: c.accent }}
      />

      {/* head row */}
      <div className="flex items-center justify-between gap-2 pl-1">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.20em]"
          style={{ color: c.accent }}
        >
          {c.name}
        </p>
        <SeverityBadge severity={f.severity} />
      </div>

      <h3 className="mt-2 pl-1 font-display text-[15px] leading-tight text-[var(--fg)]">
        {f.title}
      </h3>

      <p className="mt-1.5 pl-1 text-[12px] leading-snug text-[var(--fg-muted)]">
        {f.explanation_voiced}
      </p>

      {/* file:line + damage row */}
      <div className="mt-3 flex items-center justify-between pl-1">
        <code className="truncate font-mono text-[10px] text-[var(--fg-soft)]">
          {f.file}
          {f.line_start > 0 ? `:${f.line_start}` : ""}
        </code>
        <span
          className="ml-2 font-display text-[16px] tabular-nums leading-none"
          style={{
            color: f.action === "crit_hit" ? "#E04C2B" : c.accent,
            textShadow: `0 0 12px ${f.action === "crit_hit" ? "#E04C2B" : c.accent}55`,
          }}
        >
          −{f.damage}
        </span>
      </div>

      {/* sequence dot */}
      <span
        aria-hidden
        className="absolute -left-[14px] top-3 font-mono text-[9px] text-[var(--fg-soft)]"
      >
        {(index + 1).toString().padStart(2, "0")}
      </span>
    </motion.article>
  );
}

function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className="rounded-full px-2 py-[3px] font-mono text-[8px] uppercase tracking-[0.20em]"
      style={{
        color: SEVERITY_TONE[severity],
        border: `1px solid ${SEVERITY_TONE[severity]}44`,
        background: `${SEVERITY_TONE[severity]}12`,
      }}
    >
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function verdictLabel(v: Verdict): string {
  if (v === "blocked") return "Blocked";
  if (v === "changes_required") return "Changes Required";
  return "Approved with notes";
}
function verdictColor(v: Verdict): string {
  if (v === "blocked") return "#E04C2B";
  if (v === "changes_required") return "#E0BB72";
  return "#B9D87B";
}
