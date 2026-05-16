"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { CharacterId } from "@/types/encounter";
import { CHARACTER_ORDER, CHARACTERS } from "@/tokens/characters";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { ISLAND_POINTS } from "@/lib/sprites/island-points";
import {
  SpriteRobot,
  type SpriteRobotPhase,
  type SpriteRobotVerdict,
} from "@/components/sprite/SpriteRobot";
import { IslandHighlight } from "./IslandHighlight";
import { IslandAura } from "./IslandAura";
import { Fireflies } from "./Fireflies";

/**
 * Source island PNG dimensions (1376x768). We use this to compute the
 * actual rendered image rect inside the column when `object-fit: contain`
 * is applied — the robot and highlights anchor to pixel positions inside
 * that rect, not inside the (larger) column.
 */
const ISLAND_ASPECT = 1376 / 768;

interface Props {
  characterId: CharacterId;
  /** Drives the robot's animation. */
  phase: SpriteRobotPhase;
  /** Final verdict when phase === "done". */
  verdict: SpriteRobotVerdict;
  /** Cursor-driven tilt for the bob wrapper, in degrees. */
  tilt?: { rx: number; ry: number };
  /** Wind gust tilt in degrees, additive to the cursor rotateY. */
  windRoll?: number;
}

/**
 * The whole island stack inside the world column:
 *   - A non-bobbing contact shadow on the floor.
 *   - An aura of accent-tinted motes spiralling up around it.
 *   - A blinking field of fireflies around the silhouette.
 *   - The bob wrapper: island PNG, sprite robot anchored to it, and
 *     the highlight halos at each waypoint.
 *
 * The robot now lives INSIDE the bob wrapper so the island and the
 * robot move as one body when the island floats. Waypoints are
 * provided in island-image-local pixels derived from `ISLAND_POINTS`
 * and the rendered image's bounding rect (recomputed via
 * `ResizeObserver`).
 */
export function FloatingIsland({
  characterId,
  phase,
  verdict,
  tilt,
  windRoll = 0,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const c = CHARACTERS[characterId];
  const index = Math.max(0, CHARACTER_ORDER.indexOf(characterId));

  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [boxSize, setBoxSize] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setBoxSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The wrapper takes the column. The visible image, constrained by
  // object-fit: contain, occupies a rectangle inside that wrapper —
  // compute its pixel rect so waypoints anchor correctly.
  const rendered = React.useMemo(() => {
    const { w, h } = boxSize;
    if (w === 0 || h === 0) return null;
    const boxAspect = w / h;
    let rw: number;
    let rh: number;
    if (boxAspect > ISLAND_ASPECT) {
      rh = h;
      rw = h * ISLAND_ASPECT;
    } else {
      rw = w;
      rh = w / ISLAND_ASPECT;
    }
    return { rw, rh, ox: (w - rw) / 2, oy: (h - rh) / 2 };
  }, [boxSize]);

  const points = ISLAND_POINTS[characterId];
  const waypointPx = React.useMemo(() => {
    if (!rendered) return [];
    return points.map((p) => ({
      x: (rendered.rw * p.xPct) / 100,
      y: (rendered.rh * p.yPct) / 100,
    }));
  }, [points, rendered]);

  // Which waypoint the robot is currently inspecting (null while moving).
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);

  const rx = tilt?.rx ?? 0;
  const ry = (tilt?.ry ?? 0) + windRoll;

  return (
    <div
      ref={wrapperRef}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: 2, perspective: 1200 }}
    >
      {rendered && (
        <>
          {/* Non-bobbing contact shadow — fixed to the "ground". */}
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: rendered.ox + rendered.rw * 0.5,
              top: rendered.oy + rendered.rh - 30,
              width: rendered.rw * 0.7,
              height: 50,
              transform: "translate(-50%, 0)",
              background:
                "radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 70%)",
              filter: "blur(8px)",
              pointerEvents: "none",
              zIndex: 1,
            }}
          />

          {/* Accent-tinted aura behind the island silhouette. */}
          <IslandAura
            cx={rendered.ox + rendered.rw * 0.5}
            cy={rendered.oy + rendered.rh * 0.62}
            radius={Math.min(280, rendered.rw * 0.45)}
            accent={c.accent}
          />

          {/* Sparse blinking fireflies. */}
          <Fireflies
            cx={rendered.ox + rendered.rw * 0.5}
            cy={rendered.oy + rendered.rh * 0.5}
            accent={c.accent}
            radius={Math.min(420, rendered.rw * 0.55)}
          />
        </>
      )}

      {/* Bob wrapper — owns the island image + robot + highlights, so they
          all float as one body. Cursor tilt and wind roll are absorbed here. */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          transformStyle: "preserve-3d",
        }}
        animate={
          reduced
            ? { rotateX: rx, rotateY: ry }
            : { y: [0, -6, 0, 5, 0], rotateX: rx, rotateY: ry }
        }
        transition={
          reduced
            ? { rotateX: { duration: 0.6, ease: "easeOut" }, rotateY: { duration: 0.6, ease: "easeOut" } }
            : {
                y: {
                  duration: 6 + index * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotateX: { duration: 0.6, ease: "easeOut" },
                rotateY: { duration: 0.6, ease: "easeOut" },
              }
        }
      >
        {rendered && (
          <div
            style={{
              position: "absolute",
              left: rendered.ox,
              top: rendered.oy,
              width: rendered.rw,
              height: rendered.rh,
            }}
          >
            {/* Codex has a baked-in god-ray on the tower that is cropped
                hard at the top edge of the source PNG. Paint a soft
                continuation above the image so the beam reads as
                stretching down from offscreen rather than being clipped. */}
            {characterId === "codex" && (
              <CodexBeamExtension
                width={rendered.rw}
                height={rendered.rh}
              />
            )}

            <Image
              src={`/islands/${characterId}.png`}
              alt=""
              fill
              priority
              unoptimized
              draggable={false}
              sizes="60vw"
              style={{ objectFit: "fill", userSelect: "none" }}
            />

            {/* Island point highlights — driven by which waypoint the robot is at */}
            {points.map((p, i) => (
              <IslandHighlight
                key={i}
                x={waypointPx[i]?.x ?? 0}
                y={waypointPx[i]?.y ?? 0}
                active={activeIdx === i && phase !== "done" && phase !== "idle"}
                accent={c.accent}
              />
            ))}

            {/* The little explorer, anchored to the island. */}
            {waypointPx.length > 0 && (
              <SpriteRobot
                characterId={characterId}
                phase={phase}
                verdict={verdict}
                size={64}
                waypoints={waypointPx}
                accent={c.accent}
                onPauseIndex={setActiveIdx}
              />
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Codex' tower has a god-ray painted into the source PNG that ends with
 * a hard horizontal cut at the top edge of the image. This component
 * does two things to hide the seam:
 *
 *   1. Paints an SVG continuation ABOVE the image, tracing the same
 *      diagonal axis as the in-image beam (top of beam in PNG sits at
 *      ~x=27%/y=0%, anchor on the tower roof at ~x=53%/y=24%). The
 *      continuation is wider and softer than the in-image beam so the
 *      transition is invisible.
 *
 *   2. Lays a thin "feather" gradient over the top edge of the image
 *      that fades the hard cut into transparency — even if the user's
 *      sky is light, the bright stripe at y=0 of the PNG stops reading
 *      as a horizontal line.
 *
 * Both layers use `mix-blend-mode: screen` so they read as light over
 * whatever sky is behind, and the whole stack pulses gently to feel
 * volumetric.
 */
function CodexBeamExtension({
  width,
  height,
}: {
  width: number;
  height: number;
}) {
  const reduced = usePrefersReducedMotion();

  // In-image beam endpoints we are continuing upward.
  const beamBottomX = width * 0.27; // center of the beam where it meets y=0 of the PNG
  const tipX = width * 0.53; // center of where the beam lands on the tower
  const tipY = height * 0.24;

  // Direction unit vector along the beam (from tip → top edge of PNG):
  const dx = beamBottomX - tipX;
  const dy = 0 - tipY;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;

  // Extend by ~65% of the rendered island height upward along that axis.
  const extendLen = height * 0.7;
  const topX = beamBottomX + ux * extendLen;
  const topY = 0 + uy * extendLen;

  // Beam half-width at the bottom (matches what we see at y=0) and tapered
  // wider at the top so the extension feels like a soft cone of light.
  const halfBot = width * 0.07;
  const halfTop = width * 0.13;
  // Perpendicular unit vector to offset the beam edges.
  const px = -uy;
  const py = ux;

  // Four corners of the beam quad in container-local coords.
  const p1x = beamBottomX + px * halfBot;
  const p1y = 0 + py * halfBot;
  const p2x = beamBottomX - px * halfBot;
  const p2y = 0 - py * halfBot;
  const p3x = topX - px * halfTop;
  const p3y = topY - py * halfTop;
  const p4x = topX + px * halfTop;
  const p4y = topY + py * halfTop;

  // SVG viewport must include the extended top (which is at negative y).
  const padTop = Math.ceil(-Math.min(topY, p3y, p4y)) + 8;
  const vbX = -16;
  const vbY = -padTop;
  const vbW = width + 32;
  const vbH = padTop + height + 8;

  return (
    <motion.div
      aria-hidden
      animate={reduced ? undefined : { opacity: [0.7, 1, 0.7] }}
      transition={
        reduced
          ? undefined
          : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
      }
      style={{
        position: "absolute",
        left: 0,
        top: -padTop,
        width: width,
        height: padTop + 12,
        pointerEvents: "none",
        mixBlendMode: "screen",
        zIndex: 0,
        overflow: "visible",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="none"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          {/* Fade from full-brightness at the bottom of the extension
              (where it meets the in-image beam) to transparent at the
              top, in the beam's local coordinate frame. */}
          <linearGradient
            id="codex-beam-grad"
            gradientUnits="userSpaceOnUse"
            x1={beamBottomX}
            y1={0}
            x2={topX}
            y2={topY}
          >
            <stop offset="0%" stopColor="#E2F1FF" stopOpacity={0.85} />
            <stop offset="40%" stopColor="#DCEBFF" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#DCEBFF" stopOpacity={0} />
          </linearGradient>
          {/* Soft horizontal feather hiding the hard cut at y=0 of the PNG. */}
          <linearGradient
            id="codex-beam-feather"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="0%" stopColor="#E2F1FF" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#E2F1FF" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Beam continuation polygon. */}
        <polygon
          points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
          fill="url(#codex-beam-grad)"
          style={{ filter: "blur(6px)" }}
        />

        {/* Feather at the bottom of the beam to dissolve the seam where
            the SVG meets the painted beam in the PNG. */}
        <rect
          x={beamBottomX - width * 0.11}
          y={-18}
          width={width * 0.22}
          height={24}
          fill="url(#codex-beam-feather)"
          transform={`rotate(${(Math.atan2(uy, ux) * 180) / Math.PI + 90} ${beamBottomX} 0)`}
          style={{ filter: "blur(4px)" }}
        />
      </svg>
    </motion.div>
  );
}
