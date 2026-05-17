"use client";

import * as React from "react";
import { motion, useAnimationControls } from "motion/react";
import type { CharacterId } from "@/types/encounter";
import { SpriteAnimator } from "./SpriteAnimator";
import { ScanOverlay } from "./overlays/ScanOverlay";
import { VictoryOverlay } from "./overlays/VictoryOverlay";
import { HitOverlay } from "./overlays/HitOverlay";
import { WorkingScroll } from "./overlays/WorkingScroll";
import { travelAnimationFor, type AnimName } from "@/lib/sprites/manifest";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

export type SpriteRobotPhase = "idle" | "walking" | "scanning" | "done";
export type SpriteRobotVerdict = "clean" | "critical" | "neutral";

interface Waypoint {
  x: number;
  y: number;
}

interface Props {
  characterId: CharacterId;
  /** Driven by the parent's analysis machine. */
  phase: SpriteRobotPhase;
  /** Only inspected when phase === "done". */
  verdict: SpriteRobotVerdict;
  /** Sprite size in pixels. */
  size: number;
  /** Tour points expressed in pixels in the parent's coordinate space. */
  waypoints: Waypoint[];
  /** If true, lock to idle regardless of phase. */
  paused?: boolean;
  accent: string;
  /** Reports which waypoint index the robot is paused at (null while travelling). */
  onPauseIndex?: (idx: number | null) => void;
}

const TRAVEL_SPEED = 56; // px/sec — contemplative pace
const PAUSE_MS = 2500;

/**
 * The robot loops through the supplied waypoints with a "travel →
 * pause → travel → ..." cycle while the analysis is in progress.
 * During travel it plays its character-specific walk (or float for
 * Echo) animation; during pauses it switches to "scan" and reports
 * the waypoint index up to the parent so the matching IslandHighlight
 * can pulse.
 *
 * When `phase` flips to "done" the loop stops on the last visited
 * waypoint and a one-shot verdict animation plays (victory / hit /
 * idle).
 *
 * `prefers-reduced-motion`: snap to waypoint 0 and stay there; report
 * pause-index 0 so the first highlight remains glowing.
 *
 * Visual extras owned here:
 *  - Arrival ripple at the feet on mount.
 *  - Shadow ellipse.
 *  - Critical-hit shake.
 *  - Subtle vertical "step bob" while travelling.
 *  - Horizontal flip so the sprite faces its travel direction.
 */
function SpriteRobotImpl({
  characterId,
  phase,
  verdict,
  size,
  waypoints,
  paused = false,
  accent,
  onPauseIndex,
}: Props) {
  const controls = useAnimationControls();
  const reduced = usePrefersReducedMotion();
  const [oneShotPlayed, setOneShotPlayed] = React.useState(false);
  const [stage, setStage] = React.useState<"travel" | "pause">("pause");

  // The robot's currently-occupied waypoint index, persisted across
  // every render. Without this, any change to `waypoints`/`phase`/etc.
  // would re-run the tour effect and snap the robot back to index 0.
  const tourIdxRef = React.useRef(0);
  // Track the last waypoint position we actually committed to motion
  // controls — used to resume travel from the live position after a
  // resize instead of teleporting to waypoint[0].
  const lastPosRef = React.useRef<Waypoint | null>(null);

  React.useEffect(() => {
    if (phase !== "done") setOneShotPlayed(false);
  }, [phase, verdict]);

  // Stable callback identity — the SpriteAnimator already insulates
  // itself with a ref, but keeping this stable also avoids unnecessary
  // diffs on the prop wire.
  const handleSpriteComplete = React.useCallback(() => {
    if (phase === "done" && !oneShotPlayed) setOneShotPlayed(true);
  }, [phase, oneShotPlayed]);

  // When the character changes, restart the tour from waypoint 0. The
  // SpriteRobot is keyed by character one level up, so a fresh mount
  // is the path for crossfading, but guard against in-place id swaps
  // anyway.
  React.useEffect(() => {
    tourIdxRef.current = 0;
    lastPosRef.current = null;
  }, [characterId]);

  const wpKey = waypoints
    .map((w) => `${w.x.toFixed(0)},${w.y.toFixed(0)}`)
    .join("|");

  // Drive the tour loop.
  React.useEffect(() => {
    if (waypoints.length === 0) return;

    // Clamp the resumed index to the new waypoint count.
    if (tourIdxRef.current >= waypoints.length) {
      tourIdxRef.current = 0;
    }

    // On the very first render of a tour, or after a resize that
    // moved the waypoints under our feet, we ease toward the current
    // waypoint instead of snapping. This is what kills the "blinking"
    // teleport-to-zero on every resize observer tick.
    const targetWp = waypoints[tourIdxRef.current];
    const lastPos = lastPosRef.current;
    if (!lastPos) {
      controls.set({ x: targetWp.x, y: targetWp.y });
      lastPosRef.current = { x: targetWp.x, y: targetWp.y };
    } else if (lastPos.x !== targetWp.x || lastPos.y !== targetWp.y) {
      // Ease to the new pixel coords for the same logical waypoint.
      controls.start({
        x: targetWp.x,
        y: targetWp.y,
        transition: { duration: 0.25, ease: "easeOut" },
      });
      lastPosRef.current = { x: targetWp.x, y: targetWp.y };
    }

    if (paused || phase === "done" || phase === "idle") {
      setStage("pause");
      onPauseIndex?.(null);
      return;
    }
    if (reduced) {
      setStage("pause");
      onPauseIndex?.(0);
      return;
    }

    let cancelled = false;

    async function loop() {
      while (!cancelled) {
        const i = tourIdxRef.current;
        setStage("pause");
        onPauseIndex?.(i);
        await wait(PAUSE_MS);
        if (cancelled) return;

        const next = (i + 1) % waypoints.length;
        const from = waypoints[i];
        const to = waypoints[next];
        const dist = Math.hypot(to.x - from.x, to.y - from.y);
        const duration = Math.max(0.45, dist / TRAVEL_SPEED);

        setStage("travel");
        onPauseIndex?.(null);
        await controls.start({
          x: to.x,
          y: to.y,
          transition: { duration, ease: [0.55, 0.05, 0.45, 0.95] },
        });
        if (cancelled) return;
        tourIdxRef.current = next;
        lastPosRef.current = { x: to.x, y: to.y };
      }
    }
    loop();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wpKey, phase, paused, reduced]);

  const animation: AnimName = React.useMemo(() => {
    if (paused) return "idle";
    if (phase === "done") {
      if (oneShotPlayed) return "idle";
      if (verdict === "clean") return "victory";
      if (verdict === "critical") return "hit";
      return "idle";
    }
    if (phase === "idle") return "idle";
    return stage === "travel" ? travelAnimationFor(characterId) : "scan";
  }, [characterId, phase, paused, verdict, oneShotPlayed, stage]);

  const showScanOverlay =
    !paused && phase !== "done" && phase !== "idle" && stage === "pause";

  const shakeKey = `${phase}-${verdict}-${oneShotPlayed}`;
  const traveling = stage === "travel" && !paused && phase !== "done" && phase !== "idle";

  // The agent is "working" any time it's not done/idle/paused — show a
  // floating parchment so the user can see at a glance which agents are
  // still running. Always labelled "Analyzing"; disappears the moment the
  // verdict lands.
  const showWorkingScroll =
    !paused && phase !== "done" && phase !== "idle";

  return (
    <motion.div
      className="absolute"
      style={{
        top: 0,
        left: 0,
        width: size,
        height: size,
        marginLeft: -size / 2,
        marginTop: -size / 2,
        zIndex: 4,
      }}
      animate={controls}
      initial={false}
    >
      <ArrivalRipple size={size} accent={accent} />

      {/* Continuous "thinking" halo around the robot the whole time the
          agent is working — independent of the travel/pause cycle so the
          glow never disappears mid-analysis. */}
      {showWorkingScroll && !reduced && (
        <ThinkingHalo size={size} accent={accent} />
      )}

      {showWorkingScroll && (
        <WorkingScroll size={size} accent={accent} />
      )}

      <span
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          bottom: -size * 0.08,
          transform: "translateX(-50%)",
          width: size * 0.6,
          height: size * 0.14,
          background:
            "radial-gradient(closest-side, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 70%)",
          filter: "blur(2px)",
          pointerEvents: "none",
        }}
      />

      {/* Step bob — a slow, single-bounce wave that only runs while
          traveling. The previous implementation packed four keyframes
          into 0.55s (~7 Hz), which read as a buzz rather than walking.
          One bounce per ~0.95s sits in the gait range and looks calm. */}
      <motion.div
        animate={
          traveling && !reduced
            ? { y: [0, -3, 0] }
            : { y: 0 }
        }
        transition={
          traveling && !reduced
            ? { duration: 0.95, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.25, ease: "easeOut" }
        }
        style={{ width: "100%", height: "100%", position: "relative" }}
      >
        <motion.div
          key={shakeKey}
          animate={
            phase === "done" &&
            verdict === "critical" &&
            !oneShotPlayed &&
            !reduced
              ? { x: [0, -4, 4, -3, 3, 0] }
              : { x: 0 }
          }
          transition={{ duration: 0.4, ease: "easeOut" }}
          style={{ width: "100%", height: "100%", position: "relative" }}
        >
          {/* Sprite + scan overlays. No horizontal flip — the manifest
              only ships the "south" facing, so mirroring would just show
              an inverted south sprite which reads as a glitchy half-turn. */}
          <SpriteAnimator
            character={characterId}
            animation={animation}
            size={size}
            onComplete={handleSpriteComplete}
          />

          {showScanOverlay && (
            <ScanOverlay key="scan" size={size} accent={accent} />
          )}
          {phase === "done" && verdict === "clean" && !oneShotPlayed && (
            <VictoryOverlay key="victory" size={size} />
          )}
          {phase === "done" && verdict === "critical" && !oneShotPlayed && (
            <HitOverlay key="hit" />
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Memoized export. The parent (`IslandPage` → `FloatingIsland`) re-renders
 * on every `pointermove` because cursor-tilt lives in React state. Without
 * this memo, those re-renders cascaded through the SpriteRobot and even
 * though the rAF loop is insulated by refs, the surrounding motion.divs
 * still went through reconciliation and contributed to visible flicker.
 * All props are reference-stable across pointer moves (waypoints comes
 * from a useMemo, onPauseIndex is a useState setter, etc.), so the
 * default shallow comparison is sufficient.
 */
export const SpriteRobot = React.memo(SpriteRobotImpl);

function ArrivalRipple({ size, accent }: { size: number; accent: string }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;
  return (
    <>
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          key={delay}
          aria-hidden
          initial={{ opacity: 0.75, scale: 0.3 }}
          animate={{ opacity: 0, scale: 1.6 }}
          transition={{ duration: 0.8, delay, ease: "easeOut" }}
          style={{
            position: "absolute",
            left: "50%",
            bottom: -size * 0.05,
            width: size * 0.8,
            height: size * 0.2,
            marginLeft: -(size * 0.8) / 2,
            borderRadius: "50%",
            border: `1px solid ${accent}`,
            mixBlendMode: "screen",
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * A breathing accent halo behind the robot whenever its agent is actively
 * working. The pulse is intentionally slow (~2s) — fast pulsing read as
 * danger/error in playtests. A second concentric ring rotates very slowly
 * so the effect looks volumetric rather than a flat strobe.
 */
function ThinkingHalo({ size, accent }: { size: number; accent: string }) {
  return (
    <>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          top: "50%",
          width: size * 1.35,
          height: size * 1.35,
          marginLeft: -(size * 1.35) / 2,
          marginTop: -(size * 1.35) / 2,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${accent}33 0%, ${accent}10 55%, transparent 75%)`,
          filter: "blur(8px)",
          mixBlendMode: "screen",
        }}
        animate={{ opacity: [0.45, 0.85, 0.45], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          left: "50%",
          top: "50%",
          width: size * 1.05,
          height: size * 1.05,
          marginLeft: -(size * 1.05) / 2,
          marginTop: -(size * 1.05) / 2,
          borderRadius: "50%",
          border: `1px dashed ${accent}66`,
          opacity: 0.55,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}
