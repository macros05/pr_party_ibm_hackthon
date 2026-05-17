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
  const [zoomed, setZoomed] = React.useState<Finding | null>(null);
  const zoomedIndex = React.useMemo(
    () => (zoomed ? findings.findIndex((f) => f.id === zoomed.id) : -1),
    [zoomed, findings],
  );

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [findings.length]);

  // ESC closes the zoom view
  React.useEffect(() => {
    if (!zoomed) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomed(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  return (
    <>
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
            <FindingCard
              key={f.id}
              finding={f}
              index={i}
              accent={accent}
              onOpen={() => setZoomed(f)}
              hidden={zoomed?.id === f.id}
            />
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

      <AnimatePresence>
        {zoomed && zoomedIndex >= 0 && (
          <FindingZoomOverlay
            finding={zoomed}
            index={zoomedIndex}
            accent={accent}
            onClose={() => setZoomed(null)}
          />
        )}
      </AnimatePresence>
    </>
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
  onOpen,
  hidden,
}: {
  finding: Finding;
  index: number;
  accent: string;
  onOpen: () => void;
  hidden: boolean;
}) {
  const sev = SEVERITY_TONE[finding.severity];
  const delay = Math.min(index, 5) * 0.08;
  return (
    <motion.article
      layoutId={`finding-card-${finding.id}`}
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: hidden ? 0 : 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.22, 0.61, 0.36, 1],
      }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className="relative mb-3 cursor-pointer overflow-hidden rounded-md p-4 outline-none transition-[border-color,box-shadow] hover:border-white/15 focus-visible:ring-2 focus-visible:ring-offset-0"
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        borderLeft: `4px solid ${sev}`,
        boxShadow: `inset 0 0 40px ${sev}14`,
        pointerEvents: hidden ? "none" : "auto",
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

function FindingZoomOverlay({
  finding,
  index,
  accent,
  onClose,
}: {
  finding: Finding;
  index: number;
  accent: string;
  onClose: () => void;
}) {
  const sev = SEVERITY_TONE[finding.severity];
  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 sm:p-10"
      initial={{ backdropFilter: "blur(0px)" }}
      animate={{ backdropFilter: "blur(8px)" }}
      exit={{ backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.25 }}
    >
      {/* Dimmed backdrop — click to dismiss */}
      <motion.button
        aria-label="Close finding"
        onClick={onClose}
        className="absolute inset-0 cursor-zoom-out"
        style={{ background: "rgba(8, 10, 14, 0.72)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
      />

      {/* Shared-layout card that zooms from its rail position into a
          much larger, centered detail view. */}
      <motion.article
        layoutId={`finding-card-${finding.id}`}
        className="relative z-[1] w-full max-w-2xl overflow-hidden rounded-lg p-8 shadow-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,24,30,0.96) 0%, rgba(14,16,20,0.96) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.10)",
          borderLeft: `6px solid ${sev}`,
          boxShadow: `0 30px 80px -20px rgba(0,0,0,0.7), 0 0 0 1px ${sev}22, inset 0 0 60px ${sev}10`,
        }}
        transition={{
          duration: 0.45,
          ease: [0.22, 0.61, 0.36, 1],
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-[2] flex h-8 w-8 items-center justify-center rounded-full font-mono text-[14px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          style={{
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          ×
        </button>

        <div className="flex items-center justify-between gap-3 pr-12">
          <p
            className="font-mono text-[11px] uppercase tracking-[0.24em]"
            style={{ color: accent }}
          >
            Finding {String(index + 1).padStart(2, "0")}
          </p>
          <SeverityBadge severity={finding.severity} />
        </div>

        <h3 className="mt-4 font-display text-[26px] leading-tight text-white">
          {finding.title}
        </h3>

        <p className="mt-4 text-[15px] leading-relaxed text-white/80">
          {finding.explanation_voiced}
        </p>

        <div
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <code className="font-mono text-[12px] text-white/70">
            {finding.file}
            {finding.line_start > 0 ? `:${finding.line_start}` : ""}
          </code>
          <span
            className="font-display text-[22px] tabular-nums leading-none"
            style={{
              color: finding.action === "crit_hit" ? "#E04C2B" : accent,
              textShadow: `0 0 14px ${finding.action === "crit_hit" ? "#E04C2B" : accent}66`,
            }}
          >
            −{finding.damage}
          </span>
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
          Click outside or press Esc to close
        </p>
      </motion.article>
    </motion.div>
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
