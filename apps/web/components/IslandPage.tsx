"use client";

import * as React from "react";
import type { CharacterId } from "@/types/encounter";
import { CHARACTER_ORDER } from "@/tokens/characters";
import { useIslandAnalysisWithFallback } from "@/lib/api/use-island-analysis-remote";
import { FloatingIsland } from "@/components/world/FloatingIsland";
import { IslandNavigator } from "@/components/world/IslandNavigator";
import { ReturnHomeSeal } from "@/components/world/ReturnHomeSeal";
import type {
  SpriteRobotPhase,
  SpriteRobotVerdict,
} from "@/components/sprite/SpriteRobot";
import { CharacterPanel } from "@/components/character-panel/CharacterPanel";
import { IslandCrossfade } from "@/components/transitions/IslandCrossfade";
import {
  preloadInBackground,
  preloadIsland,
} from "@/lib/sprites/preload";
import { travelAnimationFor } from "@/lib/sprites/manifest";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { useWindRoll } from "@/lib/motion/wind";

interface Props {
  id: CharacterId;
  fixture: string;
}

/**
 * The whole island view. Composes:
 *   - left ~60vw world column: floating island + walking robot (lives
 *     inside FloatingIsland and follows the bob).
 *   - right ~40vw character panel: nameplate, PR, findings, status.
 *   - IslandNavigator (chevrons + keyboard nav) over the left column.
 *
 * The sky / clouds / birds / particles are owned by `app/island/layout.tsx`
 * and persist across navigations, so cross-fading between characters
 * reads as the camera shifting within the same world.
 *
 * Cursor tilt: tracks pointer over the left column and feeds a small
 * rotateX/rotateY (±2deg max) to FloatingIsland for 3D depth. Wind
 * gusts also tilt the island via `useWindRoll`.
 */
export function IslandPage({ id, fixture }: Props) {
  const {
    phase,
    findings,
    prMeta,
    isAnalyzing,
    characterError,
    globalError,
  } = useIslandAnalysisWithFallback(id, fixture);
  const reduced = usePrefersReducedMotion();
  const windRoll = useWindRoll();

  // Cursor-based tilt over the left column. We coalesce raw pointer
  // events through a single rAF tick so the whole tree (FloatingIsland,
  // robot, panel) re-renders at most once per frame instead of once per
  // pointer event — at 60+ Hz event rates the cascade was a significant
  // contributor to perceived sprite flicker.
  const columnRef = React.useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 });
  React.useEffect(() => {
    if (reduced) {
      setTilt({ rx: 0, ry: 0 });
      return;
    }
    const el = columnRef.current;
    if (!el) return;

    let pending: { rx: number; ry: number } | null = null;
    let last = { rx: 0, ry: 0 };
    let raf = 0;

    function flush() {
      raf = 0;
      if (!pending) return;
      // Skip the React setState entirely if the value is effectively
      // unchanged — saves a render when the cursor pauses.
      if (
        Math.abs(pending.rx - last.rx) < 0.02 &&
        Math.abs(pending.ry - last.ry) < 0.02
      ) {
        pending = null;
        return;
      }
      last = pending;
      setTilt(pending);
      pending = null;
    }

    function schedule() {
      if (raf) return;
      raf = requestAnimationFrame(flush);
    }

    function onMove(e: PointerEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1; // -1..1
      const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
      pending = { rx: -ny * 2, ry: nx * 2 };
      schedule();
    }
    function onLeave() {
      pending = { rx: 0, ry: 0 };
      schedule();
    }

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduced]);

  const verdict: SpriteRobotVerdict = React.useMemo(() => {
    if (phase !== "done") return "neutral";
    if (findings.some((f) => f.severity === "critical")) return "critical";
    if (findings.length === 0) return "clean";
    return "neutral";
  }, [phase, findings]);

  const robotPhase: SpriteRobotPhase = React.useMemo(() => {
    switch (phase) {
      case "scanning":
        return "walking";
      case "analyzing":
        return "scanning";
      case "done":
        return "done";
    }
  }, [phase]);

  React.useEffect(() => {
    const idx = CHARACTER_ORDER.indexOf(id);
    const prev = CHARACTER_ORDER[(idx - 1 + CHARACTER_ORDER.length) % CHARACTER_ORDER.length];
    const next = CHARACTER_ORDER[(idx + 1) % CHARACTER_ORDER.length];
    const t = window.setTimeout(() => {
      preloadIsland(prev);
      preloadIsland(next);
      preloadInBackground([
        { character: prev, animation: "idle" },
        { character: next, animation: "idle" },
        { character: prev, animation: travelAnimationFor(prev) },
        { character: next, animation: travelAnimationFor(next) },
      ]);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [id]);

  return (
    <>
      {/* Left ~60vw world column. The crossfade owns the island+robot
          pack so the sky/clouds/motes underneath never blink. */}
      <div
        ref={columnRef}
        className="absolute left-0 top-0 z-[2]"
        style={{
          width: "var(--world-w, 60vw)",
          height: "var(--world-h, 100vh)",
        }}
      >
        <IslandCrossfade cacheKey={id}>
          <FloatingIsland
            characterId={id}
            phase={robotPhase}
            verdict={verdict}
            tilt={tilt}
            windRoll={windRoll}
          />
        </IslandCrossfade>
        <IslandNavigator current={id} />
      </div>

      {/* Escape hatch back to the council hall — fixed top-right, above
          the panel and arrow controls so it remains reachable from any
          island regardless of layout. */}
      <ReturnHomeSeal />

      {/* Right ~40vw panel. */}
      <CharacterPanel
        characterId={id}
        phase={phase}
        findings={findings}
        prMeta={prMeta}
        isAnalyzing={isAnalyzing}
        characterError={characterError}
        globalError={globalError}
      />

      {/* Responsive column geometry. 60/40 default, 55/45 below 1100px,
          stacked vertical (world top 55vh / panel bottom 45vh) below
          900px. Both columns and the panel read these variables. */}
      <style>{`
        :root {
          --world-w: 60vw;
          --world-h: 100vh;
          --panel-top: 0;
          --panel-left: 60vw;
        }
        @media (max-width: 1100px) {
          :root {
            --world-w: 55vw;
            --panel-left: 55vw;
          }
        }
        @media (max-width: 899px) {
          :root {
            --world-w: 100vw;
            --world-h: 55vh;
            --panel-top: 55vh;
            --panel-left: 0;
          }
        }
      `}</style>
    </>
  );
}
