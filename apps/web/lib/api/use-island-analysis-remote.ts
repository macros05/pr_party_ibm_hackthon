"use client";

import * as React from "react";
import type { CharacterId, Finding } from "@/types/encounter";
import type { IslandState } from "@/lib/demo/character-analysis";
import { fetchEncounter, checkBackendHealth } from "./client";

// Module-level cache: keyed by fixture/url, shared across all island navigations
const encounterCache = new Map<string, ReturnType<typeof fetchEncounter> extends Promise<infer T> ? T : never>();
let backendHealthCache: boolean | null = null;

const CATEGORY_MAP: Record<CharacterId, string> = {
  aegis: "security",
  schema: "database",
  pixel: "ux",
  atlas: "architecture",
  echo: "tests",
  codex: "documentation",
};

export function useIslandAnalysisRemote(
  id: CharacterId,
  fixture: string = "pr1"
) {
  const [state, setState] = React.useState<IslandState>({
    phase: "scanning",
    findings: [],
    prMeta: {
      repo: "loading...",
      pr_number: 0,
      title: "Loading...",
      diff_stats: { files_changed: 0, additions: 0, deletions: 0 },
    },
  });

  const [backendAvailable, setBackendAvailable] = React.useState<boolean | null>(
    backendHealthCache
  );
  const timeoutsRef = React.useRef<number[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timeoutsRef.current) window.clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const applyResult = React.useCallback(
    (result: (typeof encounterCache extends Map<string, infer V> ? V : never), cancelled: { v: boolean }) => {
      const allFindings = result.findings as Finding[];
      const characterFindings = allFindings.filter(
        (f) => f.category === CATEGORY_MAP[id]
      );

      setState((s) => ({ ...s, prMeta: result.pr_meta }));

      const SPACING_MS = 2400;
      characterFindings.forEach((finding, i) => {
        const t = window.setTimeout(() => {
          if (cancelled.v) return;
          setState((s) => ({ ...s, findings: [...s.findings, finding] }));
        }, 1800 + i * SPACING_MS);
        timeoutsRef.current.push(t);
      });

      const doneT = window.setTimeout(() => {
        if (cancelled.v) return;
        setState((s) => ({ ...s, phase: "done" }));
      }, 1800 + characterFindings.length * SPACING_MS + 1200);
      timeoutsRef.current.push(doneT);
    },
    [id]
  );

  React.useEffect(() => {
    clear();
    setState({
      phase: "scanning",
      findings: [],
      prMeta: {
        repo: "loading...",
        pr_number: 0,
        title: "Loading...",
        diff_stats: { files_changed: 0, additions: 0, deletions: 0 },
      },
    });

    const cancelled = { v: false };

    const run = async () => {
      // Health check (cached)
      if (backendHealthCache === null) {
        backendHealthCache = await checkBackendHealth();
      }
      if (cancelled.v) return;

      setBackendAvailable(backendHealthCache);

      if (!backendHealthCache) {
        console.warn(
          "Backend not available, falling back to demo data. Start backend with: cd backend && uvicorn app.main:app --reload"
        );
        return;
      }

      // Scanning phase
      const scanT = window.setTimeout(() => {
        if (cancelled.v) return;
        setState((s) => ({ ...s, phase: "analyzing" }));
      }, 1600);
      timeoutsRef.current.push(scanT);

      try {
        // Use cached result if available, otherwise fetch
        let result = encounterCache.get(fixture);
        if (!result) {
          result = await fetchEncounter(fixture);
          encounterCache.set(fixture, result);
        }
        if (cancelled.v) return;
        applyResult(result, cancelled);
      } catch (error) {
        console.error("Failed to fetch encounter from backend:", error);
        backendHealthCache = false;
        setBackendAvailable(false);
      }
    };

    run();

    return () => {
      cancelled.v = true;
      clear();
    };
  }, [id, fixture, clear, applyResult]);

  return { state, backendAvailable };
}

/**
 * Clear the encounter cache (e.g. when the user submits a new PR URL).
 */
export function clearEncounterCache() {
  encounterCache.clear();
  backendHealthCache = null;
}

export function useIslandAnalysisWithFallback(
  id: CharacterId,
  fixture: string = "pr1"
) {
  const { state: remoteState, backendAvailable } = useIslandAnalysisRemote(
    id,
    fixture
  );

  const [demoState, setDemoState] = React.useState<IslandState | null>(null);

  React.useEffect(() => {
    if (backendAvailable === false && !demoState) {
      import("@/lib/demo/character-analysis").then(({ getCharacterFindings }) => {
        import("@/lib/demo/encounter").then(({ DEMO_PAYLOAD }) => {
          const findings = getCharacterFindings(id);
          setDemoState({
            phase: "done",
            findings,
            prMeta: DEMO_PAYLOAD.pr_meta,
          });
        });
      });
    }
  }, [backendAvailable, id, demoState]);

  if (backendAvailable === false && demoState) {
    return demoState;
  }

  return remoteState;
}

// Made with Bob
