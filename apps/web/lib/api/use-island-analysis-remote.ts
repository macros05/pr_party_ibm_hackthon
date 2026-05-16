"use client";

import * as React from "react";
import type { CharacterId, Finding } from "@/types/encounter";
import type { IslandState } from "@/lib/demo/character-analysis";
import { fetchEncounter, checkBackendHealth } from "./client";

/**
 * Hook that fetches analysis from the backend API.
 * Maintains the same interface as useIslandAnalysis for drop-in replacement.
 * Falls back to demo if backend is unavailable.
 */
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

  const [backendAvailable, setBackendAvailable] = React.useState<
    boolean | null
  >(null);
  const timeoutsRef = React.useRef<number[]>([]);

  const clear = React.useCallback(() => {
    for (const t of timeoutsRef.current) window.clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

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

    let cancelled = false;

    // Check backend health first
    checkBackendHealth().then((available) => {
      if (cancelled) return;
      setBackendAvailable(available);

      if (!available) {
        // Backend not available, will fall back to demo
        console.warn(
          "Backend not available, falling back to demo data. Start backend with: cd backend && uvicorn app.main:app --reload"
        );
        return;
      }

      // Simulate scanning phase
      const scanTimeout = window.setTimeout(() => {
        if (cancelled) return;
        setState((s) => ({ ...s, phase: "analyzing" }));
      }, 1600);
      timeoutsRef.current.push(scanTimeout);

      // Fetch from backend
      fetchEncounter(fixture)
        .then((result) => {
          if (cancelled) return;

          // The adapted result already has findings as Finding[]
          // We need to filter by character since backend returns all findings
          const allFindings = result.findings as Finding[];
          
          // Filter findings for this character by checking the category
          // (since adaptFinding infers category from character_id)
          const categoryMap: Record<CharacterId, string> = {
            aegis: "security",
            schema: "database",
            pixel: "ux",
            atlas: "architecture",
            echo: "tests",
            codex: "documentation",
          };
          
          const targetCategory = categoryMap[id];
          const characterFindings = allFindings.filter(
            (f) => f.category === targetCategory
          );

          // Simulate findings arriving with spacing
          const SPACING_MS = 2400;
          characterFindings.forEach((finding, i) => {
            const timeout = window.setTimeout(() => {
              if (cancelled) return;
              setState((s) => ({
                ...s,
                findings: [...s.findings, finding],
              }));
            }, 1800 + i * SPACING_MS);
            timeoutsRef.current.push(timeout);
          });

          // Set done phase
          const doneTimeout = window.setTimeout(() => {
            if (cancelled) return;
            setState((s) => ({ ...s, phase: "done" }));
          }, 1800 + characterFindings.length * SPACING_MS + 1200);
          timeoutsRef.current.push(doneTimeout);

          // Update PR meta
          setState((s) => ({
            ...s,
            prMeta: result.pr_meta,
          }));
        })
        .catch((error) => {
          console.error("Failed to fetch encounter from backend:", error);
          setBackendAvailable(false);
        });
    });

    return () => {
      cancelled = true;
      clear();
    };
  }, [id, fixture, clear]);

  return { state, backendAvailable };
}

/**
 * Hook that combines remote and demo analysis.
 * Tries backend first, falls back to demo if unavailable.
 */
export function useIslandAnalysisWithFallback(
  id: CharacterId,
  fixture: string = "pr1"
) {
  const { state: remoteState, backendAvailable } = useIslandAnalysisRemote(
    id,
    fixture
  );

  // Lazy-load demo hook only if needed
  const [demoState, setDemoState] = React.useState<IslandState | null>(null);

  React.useEffect(() => {
    if (backendAvailable === false && !demoState) {
      // Backend failed, load demo data statically
      import("@/lib/demo/character-analysis").then(
        ({ getCharacterFindings }) => {
          import("@/lib/demo/encounter").then(({ DEMO_PAYLOAD }) => {
            const findings = getCharacterFindings(id);
            setDemoState({
              phase: "done",
              findings,
              prMeta: DEMO_PAYLOAD.pr_meta,
            });
          });
        }
      );
    }
  }, [backendAvailable, id, demoState]);

  // Return remote state if backend is available or checking, demo state if backend failed
  if (backendAvailable === false && demoState) {
    return demoState;
  }

  return remoteState;
}

// Made with Bob
