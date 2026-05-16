"use client";

import * as React from "react";
import type { CharacterId, Finding } from "@/types/encounter";
import { DEMO_PAYLOAD, buildScript } from "@/lib/demo/encounter";

/**
 * Per-island analysis runner.
 *
 * The island page reuses the same demo dataset as the council view,
 * but plays back only the events relevant to ONE character, with
 * roomier timing so the page has weight.
 *
 * Phases:
 *  scanning   → robot walks and probes (no findings yet, ~1.5s)
 *  analyzing  → findings drop in cronologically
 *  done       → all findings on screen, verdict-style summary
 */

export type AnalysisPhase = "scanning" | "analyzing" | "done";

export interface IslandStep {
  at: number;          // ms from start
  finding: Finding;
}

const SCAN_MS = 1800;
const SPACING_MS = 2400;

export function getCharacterFindings(id: CharacterId): Finding[] {
  const script = buildScript();
  return script
    .filter((s) => s.event.type === "finding" && (s.event as { character_id: CharacterId }).character_id === id)
    .map((s) => (s.event as { finding: Finding }).finding);
}

export function buildIslandScript(id: CharacterId): IslandStep[] {
  const findings = getCharacterFindings(id);
  return findings.map((f, i) => ({
    at: SCAN_MS + i * SPACING_MS,
    finding: f,
  }));
}

export interface IslandState {
  phase: AnalysisPhase;
  findings: Finding[];
  prMeta: typeof DEMO_PAYLOAD.pr_meta;
}

const INITIAL: Omit<IslandState, "phase"> = {
  findings: [],
  prMeta: DEMO_PAYLOAD.pr_meta,
};

export function useIslandAnalysis(id: CharacterId) {
  const [state, setState] = React.useState<IslandState>({
    ...INITIAL,
    phase: "scanning",
  });
  const timeoutsRef = React.useRef<number[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timeoutsRef.current) window.clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const start = React.useCallback(() => {
    clear();
    setState({ ...INITIAL, phase: "scanning" });

    const script = buildIslandScript(id);
    // flip to analyzing after the initial scan
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setState((s) => ({ ...s, phase: "analyzing" }));
      }, SCAN_MS - 200),
    );
    // push each finding
    for (const step of script) {
      timeoutsRef.current.push(
        window.setTimeout(() => {
          setState((s) => ({ ...s, findings: [...s.findings, step.finding] }));
        }, step.at),
      );
    }
    // finalize
    const lastAt = script.length
      ? script[script.length - 1].at + 1200
      : SCAN_MS + 800;
    timeoutsRef.current.push(
      window.setTimeout(() => {
        setState((s) => ({ ...s, phase: "done" }));
      }, lastAt),
    );
  }, [id, clear]);

  React.useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  return state;
}

/* ============================================================
   PR HP — derived from sum of damage so the bar reads naturally.
   ============================================================ */

export function hpFromFindings(findings: Finding[], start: number) {
  let hp = start;
  for (const f of findings) hp -= f.damage;
  return hp;
}
