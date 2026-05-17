"use client";

import * as React from "react";
import type { CharacterId, Finding } from "@/types/encounter";
import type { IslandState } from "@/lib/demo/character-analysis";
import {
  subscribe,
  clearAll,
  type CharacterSlot,
  type EncounterStoreState,
} from "./encounter-store";
import { checkBackendHealth } from "./client";

/**
 * Per-island hook backed by the shared streaming encounter store.
 *
 * The previous version made each island do its own /analyze/sync call and
 * wait for the entire pipeline before showing anything — that's what made
 * a real GitHub URL spin forever. Now all six islands share ONE SSE stream
 * to /analyze/stream, and each island renders its character's findings the
 * moment that agent's pipeline finishes.
 */

type Phase = IslandState["phase"];

export interface IslandAnalysisState {
  phase: Phase;
  findings: Finding[];
  prMeta: IslandState["prMeta"];
  /** True while this character's agent is still running. */
  isAnalyzing: boolean;
  /** Per-character error from the backend, if this agent failed. */
  characterError: string | null;
  /** Top-level error (couldn't even start the stream). */
  globalError: string | null;
}

const DEFAULT_PR_META: IslandState["prMeta"] = {
  repo: "loading…",
  pr_number: 0,
  title: "Convening the council…",
  diff_stats: { files_changed: 0, additions: 0, deletions: 0 },
};

function slotPhase(slot: CharacterSlot, storePhase: EncounterStoreState["phase"]): Phase {
  // Map store phases onto the IslandState lifecycle the existing UI knows.
  if (slot.status === "done" || slot.status === "error") return "done";
  if (storePhase === "connecting") return "scanning";
  // working — show "analyzing" so the panel pulls out of the
  // initial scan animation and into the active scan state.
  return "analyzing";
}

function buildState(
  storeState: EncounterStoreState,
  id: CharacterId,
): IslandAnalysisState {
  const slot = storeState.characters[id];
  return {
    phase: slotPhase(slot, storeState.phase),
    findings: slot.findings,
    prMeta: storeState.prMeta ?? DEFAULT_PR_META,
    isAnalyzing: slot.status === "working" || storeState.phase === "connecting",
    characterError: slot.status === "error" ? slot.error ?? "Unknown error" : null,
    globalError: storeState.error,
  };
}

let backendHealthCache: boolean | null = null;

export function useIslandAnalysisRemote(
  id: CharacterId,
  source: string,
): { state: IslandAnalysisState; backendAvailable: boolean | null } {
  const [state, setState] = React.useState<IslandAnalysisState>(() => ({
    phase: "scanning",
    findings: [],
    prMeta: DEFAULT_PR_META,
    isAnalyzing: true,
    characterError: null,
    globalError: null,
  }));
  const [backendAvailable, setBackendAvailable] = React.useState<boolean | null>(
    backendHealthCache,
  );

  React.useEffect(() => {
    let cancelled = false;

    // Health check (cached) — if backend is down, fall back to demo.
    const runHealth = async () => {
      if (backendHealthCache === null) {
        backendHealthCache = await checkBackendHealth();
      }
      if (cancelled) return;
      setBackendAvailable(backendHealthCache);
      if (!backendHealthCache) return;

      const sub = subscribe(source, (storeState) => {
        if (cancelled) return;
        setState(buildState(storeState, id));
      });

      cancelledCleanup = () => sub.unsubscribe();
    };

    let cancelledCleanup: (() => void) | null = null;
    runHealth();

    return () => {
      cancelled = true;
      if (cancelledCleanup) cancelledCleanup();
    };
  }, [id, source]);

  return { state, backendAvailable };
}

/**
 * Clear the encounter store (e.g. when the user submits a new PR URL).
 */
export function clearEncounterCache() {
  clearAll();
  backendHealthCache = null;
}

export function useIslandAnalysisWithFallback(
  id: CharacterId,
  source: string,
) {
  const { state: remoteState, backendAvailable } = useIslandAnalysisRemote(
    id,
    source,
  );

  const [demoState, setDemoState] = React.useState<IslandAnalysisState | null>(
    null,
  );

  React.useEffect(() => {
    if (backendAvailable === false && !demoState) {
      import("@/lib/demo/character-analysis").then(
        ({ getCharacterFindings }) => {
          import("@/lib/demo/encounter").then(({ DEMO_PAYLOAD }) => {
            const findings = getCharacterFindings(id);
            setDemoState({
              phase: "done",
              findings,
              prMeta: DEMO_PAYLOAD.pr_meta,
              isAnalyzing: false,
              characterError: null,
              globalError: null,
            });
          });
        },
      );
    }
  }, [backendAvailable, id, demoState]);

  if (backendAvailable === false && demoState) {
    return demoState;
  }

  return remoteState;
}

// Made with Bob
