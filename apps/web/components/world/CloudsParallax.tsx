"use client";

import * as React from "react";
import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";
import { useWindMultRef } from "@/lib/motion/wind";

/**
 * Three parallax cloud layers (back / mid / front). Each layer renders
 * a tile-able SVG strip twice side-by-side and slides the wrapper from
 * translateX(0) to translateX(-50%) in a continuous loop so the seam
 * is invisible.
 *
 * Each cloud is a group of three offset bezier-shaped paths — a soft
 * shadow underneath, a cream body, and a brighter highlight on top —
 * for a painterly, NOT-flat look. Cloud shape templates rotate per
 * cloud so the strip never repeats a silhouette in a row.
 *
 * The "front" layer sits at z-5 so a few clouds drift in front of the
 * island (which is at z-2/z-3 inside its column). Back layer is
 * atmospherically desaturated to suggest depth.
 *
 * A subtle "gust" wrapper above each strip listens to the global wind
 * cycle and pushes the clouds left by ~16px on the gust envelope. The
 * underlying CSS drift continues uninterrupted, so the gust just rides
 * on top.
 */
export function CloudsParallax() {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <style>{`
        @keyframes pr-party-cloud-drift {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
      `}</style>
      <CloudLayer
        z={1}
        topPct={4}
        opacity={0.40}
        speedSec={180}
        scale={0.8}
        gustPx={8}
        seed="back"
        bodyFill="#D6E6F2"
        shadowFill="rgba(140, 175, 200, 0.35)"
        highlightFill="rgba(255, 255, 255, 0.4)"
        reduced={reduced}
      />
      <CloudLayer
        z={1}
        topPct={16}
        opacity={0.70}
        speedSec={110}
        scale={1.0}
        gustPx={14}
        seed="mid"
        bodyFill="#F6FAFE"
        shadowFill="rgba(168, 197, 222, 0.45)"
        highlightFill="rgba(255, 255, 255, 0.55)"
        reduced={reduced}
      />
      <CloudLayer
        z={5}
        topPct={36}
        opacity={0.88}
        speedSec={65}
        scale={1.45}
        gustPx={22}
        seed="front"
        bodyFill="#FAFCFE"
        shadowFill="rgba(168, 197, 222, 0.5)"
        highlightFill="rgba(255, 255, 255, 0.7)"
        reduced={reduced}
      />
    </>
  );
}

function CloudLayer({
  z,
  topPct,
  opacity,
  speedSec,
  scale,
  gustPx,
  seed,
  bodyFill,
  shadowFill,
  highlightFill,
  reduced,
}: {
  z: number;
  topPct: number;
  opacity: number;
  speedSec: number;
  scale: number;
  gustPx: number;
  seed: "back" | "mid" | "front";
  bodyFill: string;
  shadowFill: string;
  highlightFill: string;
  reduced: boolean;
}) {
  const gustRef = React.useRef<HTMLDivElement | null>(null);
  const windRef = useWindMultRef();

  React.useEffect(() => {
    if (reduced) return;
    let raf = 0;
    function tick() {
      const env = Math.max(0, (windRef.current - 1) / 0.5); // 0..1
      if (gustRef.current) {
        gustRef.current.style.transform = `translate3d(${(-gustPx * env).toFixed(2)}px, 0, 0)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, gustPx, windRef]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 overflow-hidden"
      style={{
        top: `${topPct}%`,
        height: `${30 + scale * 18}%`,
        zIndex: z,
        opacity,
      }}
    >
      <div
        ref={gustRef}
        style={{
          width: "100%",
          height: "100%",
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: "200%",
            height: "100%",
            animation: reduced
              ? "none"
              : `pr-party-cloud-drift ${speedSec}s linear infinite`,
            willChange: "transform",
          }}
        >
          <CloudStrip
            seed={seed}
            scale={scale}
            bodyFill={bodyFill}
            shadowFill={shadowFill}
            highlightFill={highlightFill}
          />
          <CloudStrip
            seed={seed}
            scale={scale}
            bodyFill={bodyFill}
            shadowFill={shadowFill}
            highlightFill={highlightFill}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Six painterly cloud silhouettes. Each is a single bezier path that
 * is rendered three times — offset down-right (shadow), centered
 * (body) and offset up-left (highlight) — for a non-flat look.
 */
const CLOUD_PATHS = [
  // 0 — broad, low-belly cloud
  "M 0,40 Q 12,12 38,18 Q 60,4 84,22 Q 110,10 128,34 Q 144,24 152,46 Q 148,62 122,60 Q 96,72 64,64 Q 32,70 12,62 Q -4,56 0,40 Z",
  // 1 — taller, single-peaked
  "M 0,46 Q 6,18 30,16 Q 50,2 72,20 Q 96,8 110,32 Q 122,22 132,42 Q 130,58 108,58 Q 84,68 56,60 Q 28,66 8,60 Q -4,54 0,46 Z",
  // 2 — slim, drifting
  "M 0,32 Q 14,10 34,14 Q 54,6 70,22 Q 82,16 92,32 Q 88,44 70,44 Q 50,52 30,46 Q 12,48 0,42 Z",
  // 3 — wide and lumpy
  "M 0,42 Q 8,18 28,20 Q 44,8 60,20 Q 76,8 92,22 Q 108,12 128,28 Q 142,22 158,40 Q 156,58 132,60 Q 108,68 84,62 Q 60,72 38,64 Q 18,68 4,58 Q -6,52 0,42 Z",
  // 4 — small, puffy
  "M 0,28 Q 6,8 22,10 Q 36,0 50,12 Q 64,4 76,18 Q 82,28 70,34 Q 56,42 40,38 Q 22,42 8,36 Q -2,34 0,28 Z",
  // 5 — large dramatic with crown
  "M 0,52 Q 10,22 36,22 Q 58,6 80,24 Q 100,12 118,28 Q 138,18 152,38 Q 168,30 178,52 Q 172,68 148,70 Q 120,78 90,70 Q 60,80 34,72 Q 12,76 0,64 Q -8,58 0,52 Z",
];

/** Compose a strip from a deterministic-by-seed-and-index set of clouds. */
function CloudStrip({
  seed,
  scale,
  bodyFill,
  shadowFill,
  highlightFill,
}: {
  seed: "back" | "mid" | "front";
  scale: number;
  bodyFill: string;
  shadowFill: string;
  highlightFill: string;
}) {
  // Random-ish but stable per (seed,index) jitter so the layer doesn't
  // hammer the same shape over and over but still tiles deterministically.
  const seedOffsets = React.useMemo(() => {
    const arr = STRIPS[seed];
    return arr.map((cloud, i) => ({
      pathIdx: (i + (seed === "back" ? 0 : seed === "mid" ? 2 : 4)) % CLOUD_PATHS.length,
      jitterY: (hashCode(`${seed}-${i}`) % 40) - 20,
      // delay-ish: each cloud has a different vertical bob amount/phase
      bobPhase: (hashCode(`${seed}-y-${i}`) % 1000) / 1000,
      // slight per-cloud scale variation
      sJitter: 0.85 + ((hashCode(`${seed}-s-${i}`) % 30) / 100),
    }));
  }, [seed]);

  const clouds = STRIPS[seed];

  return (
    <svg
      viewBox="0 0 1000 300"
      preserveAspectRatio="none"
      style={{
        width: "50%",
        height: "100%",
        display: "block",
        float: "left",
      }}
    >
      {clouds.map((c, i) => {
        const meta = seedOffsets[i];
        const d = CLOUD_PATHS[meta.pathIdx];
        const finalScale = c.s * scale * meta.sJitter;
        const y = c.y + meta.jitterY;
        return (
          <g
            key={i}
            transform={`translate(${c.x}, ${y}) scale(${finalScale})`}
          >
            {/* shadow */}
            <path d={d} fill={shadowFill} transform="translate(4, 8)" />
            {/* body */}
            <path d={d} fill={bodyFill} />
            {/* highlight */}
            <path
              d={d}
              fill={highlightFill}
              transform="translate(-3, -6) scale(0.75) translate(20, 12)"
            />
          </g>
        );
      })}
    </svg>
  );
}

interface Cloud {
  x: number;
  y: number;
  s: number;
}

const STRIPS: Record<"back" | "mid" | "front", Cloud[]> = {
  back: [
    { x: 60, y: 130, s: 0.85 },
    { x: 220, y: 60, s: 1.0 },
    { x: 390, y: 150, s: 0.75 },
    { x: 560, y: 80, s: 1.05 },
    { x: 740, y: 170, s: 0.9 },
    { x: 880, y: 100, s: 0.8 },
  ],
  mid: [
    { x: 60, y: 110, s: 1.05 },
    { x: 260, y: 170, s: 0.9 },
    { x: 460, y: 80, s: 1.2 },
    { x: 700, y: 140, s: 1.0 },
    { x: 880, y: 100, s: 0.95 },
  ],
  front: [
    { x: 100, y: 150, s: 1.3 },
    { x: 360, y: 90, s: 1.5 },
    { x: 620, y: 170, s: 1.15 },
    { x: 870, y: 110, s: 1.4 },
  ],
};

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
