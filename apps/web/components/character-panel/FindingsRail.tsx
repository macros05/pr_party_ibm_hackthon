"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Finding, Severity } from "@/types/encounter";

interface Props {
  findings: Finding[];
  accent: string;
  phase: "scanning" | "analyzing" | "done";
}

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "#E04C2B",
  high: "#E0BB72",
  medium: "#B9D87B",
  low: "#7DD3E2",
  none: "#B6A684",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "Info",
};

export function FindingsRail({ findings, accent, phase }: Props) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [findings.length]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-12 pt-6 xl:px-16"
      style={{ scrollbarWidth: "thin" }}
    >
      {phase === "scanning" && findings.length === 0 && (
        <ScanningPlaceholder accent={accent} />
      )}

      <AnimatePresence initial={false}>
        {findings.map((f, i) => (
          <FindingCard key={f.id} finding={f} index={i} accent={accent} />
        ))}
      </AnimatePresence>

      {phase === "done" && findings.length === 0 && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-12 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-white/55"
        >
          audit complete · no findings on this island
        </motion.p>
      )}
    </div>
  );
}

function ScanningPlaceholder({ accent }: { accent: string }) {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            aria-hidden
            className="block h-2 w-2 rounded-full"
            style={{ background: accent }}
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.18,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/55">
        reading the diff…
      </p>
    </div>
  );
}

function FindingCard({
  finding,
  index,
  accent,
}: {
  finding: Finding;
  index: number;
  accent: string;
}) {
  const sev = SEVERITY_TONE[finding.severity];
  const delay = Math.min(index, 5) * 0.08;
  return (
    <motion.article
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      className="relative mb-3 overflow-hidden rounded-md p-4"
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderLeft: `4px solid ${sev}`,
        boxShadow: `inset 0 0 40px ${sev}14`,
      }}
    >
      {/* Sweep of light across the card on entrance */}
      <motion.span
        aria-hidden
        initial={{ x: "-100%", opacity: 0.9 }}
        animate={{ x: "200%", opacity: 0 }}
        transition={{ duration: 0.6, delay: delay + 0.15, ease: "easeOut" }}
        className="pointer-events-none absolute inset-y-0 left-0 z-0"
        style={{
          width: "60%",
          background:
            "linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.10) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />
      <div className="relative z-[1] flex items-center justify-between gap-2">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.20em]"
          style={{ color: accent }}
        >
          Finding {String(index + 1).padStart(2, "0")}
        </p>
        <SeverityBadge severity={finding.severity} />
      </div>
      <h3 className="relative z-[1] mt-2 font-display text-[15px] leading-tight text-white/95">
        {finding.title}
      </h3>
      <p className="relative z-[1] mt-1.5 text-[12px] leading-snug text-white/70">
        {finding.explanation_voiced}
      </p>
      <div className="relative z-[1] mt-3 flex items-center justify-between">
        <code className="truncate font-mono text-[10px] text-white/45">
          {finding.file}
          {finding.line_start > 0 ? `:${finding.line_start}` : ""}
        </code>
        <span
          className="ml-2 font-display text-[16px] tabular-nums leading-none"
          style={{
            color: finding.action === "crit_hit" ? "#E04C2B" : accent,
            textShadow: `0 0 12px ${finding.action === "crit_hit" ? "#E04C2B" : accent}55`,
          }}
        >
          −{finding.damage}
        </span>
      </div>
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
