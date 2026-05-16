"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { CHARACTERS } from "@/tokens/characters";
import { visualsFor } from "@/tokens/level_visuals";

/**
 * Aegis — Fortaleza de Brasa.
 *
 * A floating stepped-stone keep with crenellations, ember veins, torches and
 * a vigilant paladin silhouette. Pure SVG, no raster art (the robot is the
 * only optional <Image>; falls back to an inline humanoid silhouette).
 *
 * Coord system: viewBox 320 × 400.
 *   y =  44 : flame tips
 *   y =  80 : crenellation tops
 *   y = 110 : keep walking surface (robot's feet)
 *   y = 140 : base of keep wall
 *   y = 178 : top of middle step
 *   y = 216 : top of bottom step
 *   y = 320 : tip of rock drip
 *   y = 360 : ground shadow
 */

interface AegisIslandProps {
  level?: number;
  /** Encounter lifecycle — drives halo + flame energy. */
  status?: "idle" | "thinking" | "active" | "done";
  /** Set true to suppress the idle bob (parent owns motion). */
  freeze?: boolean;
  /** When provided, renders the official paladin PNG instead of the silhouette. */
  robotImageSrc?: string;
  /** Once-shot "found-something" pulse trigger. */
  pulseKey?: number;
  /** Width of the island in CSS px. Aspect locked to 320:400. */
  width?: number;
  className?: string;
}

const TORCH_SLOTS = [
  // crenellations — front two
  { x: 119, y: 110, scale: 1.0 },
  { x: 201, y: 110, scale: 1.0 },
  // middle step — sides
  { x:  78, y: 162, scale: 0.85 },
  { x: 242, y: 162, scale: 0.85 },
  // bottom step — sides
  { x:  65, y: 200, scale: 0.75 },
  { x: 255, y: 200, scale: 0.75 },
] as const;

export function AegisIsland({
  level = 8,
  status = "active",
  freeze = false,
  robotImageSrc,
  pulseKey,
  width = 320,
  className,
}: AegisIslandProps) {
  const token = CHARACTERS.aegis;
  const { torches, emberIntensity } = visualsFor("aegis", level);
  const torchSlots = TORCH_SLOTS.slice(0, torches);

  const isIdle = status === "idle";
  const isActive = status === "active";

  // bob amp & duration tuned to feel weighty (Aegis is the heaviest island)
  const bobY = freeze ? 0 : -4;

  return (
    <motion.div
      className={["relative inline-block select-none", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width, aspectRatio: "320 / 400" }}
      animate={
        freeze
          ? undefined
          : { y: [0, bobY, 0] }
      }
      transition={{
        duration: 4.6,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      whileHover={{ y: -10 }}
      data-character="aegis"
      data-status={status}
    >
      <svg
        viewBox="0 0 320 400"
        className="block h-full w-full overflow-visible"
        aria-label="Fortaleza de Brasa — Aegis"
        role="img"
      >
        <defs>
          {/* ground shadow: long soft ellipse */}
          <radialGradient id="aegis-ground" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#2A1F13" stopOpacity="0.30" />
            <stop offset="55%"  stopColor="#2A1F13" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#2A1F13" stopOpacity="0" />
          </radialGradient>

          {/* stone gradients */}
          <linearGradient id="aegis-deep" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={token.stone.mid} />
            <stop offset="100%" stopColor={token.stone.deep} />
          </linearGradient>
          <linearGradient id="aegis-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={token.stone.light} />
            <stop offset="100%" stopColor={token.stone.mid} />
          </linearGradient>
          <linearGradient id="aegis-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={token.stone.top} />
            <stop offset="100%" stopColor={token.stone.light} />
          </linearGradient>
          <linearGradient id="aegis-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#E8D8C7" />
            <stop offset="100%" stopColor={token.stone.top} />
          </linearGradient>

          {/* ember vein: soft radial brasa glow */}
          <radialGradient id="aegis-ember" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FFE2C2" stopOpacity={emberIntensity} />
            <stop offset="40%"  stopColor={token.stone.veinHi} stopOpacity={emberIntensity * 0.85} />
            <stop offset="75%"  stopColor={token.stone.veinLo} stopOpacity={emberIntensity * 0.45} />
            <stop offset="100%" stopColor={token.stone.veinLo} stopOpacity="0" />
          </radialGradient>

          {/* flame */}
          <radialGradient id="aegis-flame" cx="50%" cy="65%" r="55%">
            <stop offset="0%"   stopColor="#FFF6E0" stopOpacity="1" />
            <stop offset="28%"  stopColor="#FBBF24" stopOpacity="1" />
            <stop offset="62%"  stopColor="#EA580C" stopOpacity="1" />
            <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="aegis-flame-core" cx="50%" cy="70%" r="40%">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
          </radialGradient>

          {/* local halo above the keep — warm sun catching the stone */}
          <radialGradient id="aegis-halo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#FCD9A6" stopOpacity={isActive ? 0.85 : isIdle ? 0.18 : 0.5} />
            <stop offset="65%"  stopColor="#FCA974" stopOpacity={isActive ? 0.25 : 0.08} />
            <stop offset="100%" stopColor="#FCA974" stopOpacity="0" />
          </radialGradient>

          {/* rock texture: subtle noise via pattern */}
          <pattern id="aegis-grain" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="transparent" />
            <circle cx="1" cy="1" r="0.4" fill={token.stone.shadow} opacity="0.30" />
            <circle cx="4" cy="3" r="0.3" fill={token.stone.shadow} opacity="0.20" />
            <circle cx="2" cy="5" r="0.3" fill={token.stone.shadow} opacity="0.18" />
          </pattern>
        </defs>

        {/* ── ground shadow ────────────────────────────────────────────── */}
        <ellipse cx="160" cy="360" rx="110" ry="13" fill="url(#aegis-ground)">
          {/* shadow elongates on hover via CSS class on parent */}
        </ellipse>

        {/* ── halo behind the keep ─────────────────────────────────────── */}
        <ellipse cx="160" cy="80" rx="98" ry="56" fill="url(#aegis-halo)" />

        {/* ── falling vapor particles ──────────────────────────────────── */}
        <g className="aegis-vapor" opacity="0.85">
          {VAPOR_SEEDS.map((v, i) => (
            <circle
              key={i}
              cx={v.x}
              cy={v.y}
              r={v.r}
              fill={token.stone.veinHi}
              opacity="0"
              style={{
                animation: `island-vapor ${v.dur}s ${v.delay}s infinite ease-in`,
                ["--vx" as string]: `${v.vx}px`,
                transformOrigin: `${v.x}px ${v.y}px`,
              }}
            />
          ))}
        </g>

        {/* ── ROCK BODY ────────────────────────────────────────────────── */}
        {/* drip / underside */}
        <path
          d="
            M 56 216
            L 64 246
            L 78 274
            L 100 296
            L 128 312
            L 152 320
            L 168 320
            L 192 312
            L 220 296
            L 242 274
            L 256 246
            L 264 216
            Z
          "
          fill="url(#aegis-deep)"
        />
        {/* drip texture */}
        <path
          d="M 56 216 L 64 246 L 78 274 L 100 296 L 128 312 L 152 320 L 168 320 L 192 312 L 220 296 L 242 274 L 256 246 L 264 216 Z"
          fill="url(#aegis-grain)"
          opacity="0.5"
        />
        {/* inner drip shadow — adds chiaroscuro to the underside */}
        <path
          d="M 96 260 L 124 296 L 158 312 L 192 296 L 220 260 L 208 254 L 184 286 L 160 296 L 138 286 L 110 254 Z"
          fill={token.stone.shadow}
          opacity="0.45"
        />
        {/* small detached chunks falling away — sense of erosion */}
        <path d="M 70 300 L 78 308 L 84 322 L 76 324 L 66 312 Z"      fill={token.stone.deep} opacity="0.7" />
        <path d="M 244 290 L 252 296 L 256 312 L 248 316 L 240 304 Z" fill={token.stone.deep} opacity="0.7" />

        {/* bottom step (widest tier) */}
        <path
          d="
            M 50 178
            L 56 216
            L 264 216
            L 270 178
            L 258 166
            L 62 166
            Z
          "
          fill="url(#aegis-mid)"
        />
        {/* bottom step grain */}
        <path
          d="M 50 178 L 56 216 L 264 216 L 270 178 L 258 166 L 62 166 Z"
          fill="url(#aegis-grain)"
          opacity="0.45"
        />
        {/* bottom step top-edge highlight */}
        <path
          d="M 62 166 L 258 166 L 264 174 L 56 174 Z"
          fill={token.stone.top}
          opacity="0.55"
        />
        {/* bottom step front-shadow under top ledge */}
        <path
          d="M 56 174 L 264 174 L 261 184 L 59 184 Z"
          fill={token.stone.shadow}
          opacity="0.18"
        />

        {/* middle step */}
        <path
          d="
            M 78 140
            L 62 166
            L 258 166
            L 242 140
            L 230 132
            L 90 132
            Z
          "
          fill="url(#aegis-light)"
        />
        <path
          d="M 78 140 L 62 166 L 258 166 L 242 140 L 230 132 L 90 132 Z"
          fill="url(#aegis-grain)"
          opacity="0.35"
        />
        {/* middle step highlight */}
        <path d="M 90 132 L 230 132 L 234 138 L 86 138 Z" fill="#E8D8C7" opacity="0.7" />
        {/* middle step under-ledge shadow */}
        <path d="M 86 138 L 234 138 L 230 148 L 90 148 Z" fill={token.stone.shadow} opacity="0.18" />

        {/* keep wall (top fortress wall, faces the viewer) */}
        <path
          d="
            M 106 110
            L 90 132
            L 230 132
            L 214 110
            Z
          "
          fill="url(#aegis-top)"
        />
        {/* wall stones grid — suggested via thin horizontal & vertical lines */}
        <g stroke={token.stone.shadow} strokeWidth="0.6" opacity="0.35" fill="none">
          <line x1="98" y1="120" x2="222" y2="120" />
          <line x1="138" y1="110" x2="134" y2="132" />
          <line x1="160" y1="110" x2="160" y2="132" />
          <line x1="182" y1="110" x2="186" y2="132" />
        </g>
        {/* doorway: a slim arched opening, dim */}
        <path
          d="M 152 132 L 152 122 Q 152 116 160 116 Q 168 116 168 122 L 168 132 Z"
          fill={token.stone.shadow}
          opacity="0.7"
        />
        <path
          d="M 152 132 L 152 122 Q 152 116 160 116 Q 168 116 168 122 L 168 132 Z"
          fill="url(#aegis-ember)"
          opacity={0.4 + emberIntensity * 0.4}
        />

        {/* ── crenellations on the keep wall ───────────────────────────── */}
        {CRENELLATIONS.map((c, i) => (
          <g key={i}>
            <rect
              x={c.x}
              y={c.y}
              width={c.w}
              height={c.h}
              fill="url(#aegis-top)"
            />
            {/* slim front-face shadow on each merlon */}
            <rect
              x={c.x}
              y={c.y + c.h - 3}
              width={c.w}
              height="3"
              fill={token.stone.shadow}
              opacity="0.3"
            />
            {/* top highlight stroke */}
            <rect
              x={c.x}
              y={c.y}
              width={c.w}
              height="1.5"
              fill="#F1E3D0"
              opacity="0.8"
            />
          </g>
        ))}

        {/* ── ember veins (glowing brasa cracks) ───────────────────────── */}
        <g style={{ mixBlendMode: "screen" as React.CSSProperties["mixBlendMode"] }}>
          <ellipse cx="120" cy="200" rx="18" ry="3.6" fill="url(#aegis-ember)" />
          <ellipse cx="200" cy="195" rx="15" ry="3.2" fill="url(#aegis-ember)" />
          <ellipse cx="160" cy="220" rx="22" ry="3.2" fill="url(#aegis-ember)" />
          <ellipse cx="100" cy="240" rx="10" ry="2.4" fill="url(#aegis-ember)" />
          <ellipse cx="218" cy="245" rx="11" ry="2.6" fill="url(#aegis-ember)" />
          <ellipse cx="160" cy="270" rx="16" ry="2.6" fill="url(#aegis-ember)" />
        </g>

        {/* hairline brasa cracks on the rock surface */}
        <g stroke={token.stone.veinLo} strokeWidth="0.8" fill="none" opacity={0.6 * emberIntensity}>
          <path d="M 90  200 q 8 -6 24 0 t 28 4" />
          <path d="M 184 198 q 10 -4 22 -2 t 22 6" />
          <path d="M 130 245 q 6 -4 16 -2 t 22 4" />
        </g>

        {/* ── TORCHES (count driven by level) ──────────────────────────── */}
        {torchSlots.map((t, i) => (
          <Torch key={i} x={t.x} y={t.y} scale={t.scale} delay={i * 0.18} />
        ))}

        {/* ── ROBOT placeholder (vigilant paladin silhouette) ─────────── */}
        {robotImageSrc ? (
          // 88×112 in island coords, anchored above keep
          <foreignObject x="112" y="20" width="96" height="120">
            <Image
              src={robotImageSrc}
              alt="Aegis"
              width={400}
              height={500}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              priority
            />
          </foreignObject>
        ) : (
          <PaladinSilhouette accent={token.accent} accentSoft={token.accentSoft} />
        )}

        {/* ── "found something" pulse ring ──────────────────────────────── */}
        {pulseKey !== undefined && (
          <motion.circle
            key={pulseKey}
            cx="160"
            cy="110"
            r="40"
            fill="none"
            stroke={token.accent}
            strokeWidth="2"
            initial={{ r: 30, opacity: 0.8 }}
            animate={{ r: 110, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        )}
      </svg>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

const CRENELLATIONS: { x: number; y: number; w: number; h: number }[] = [
  { x: 106, y: 92,  w: 14, h: 18 },
  { x: 124, y: 88,  w: 14, h: 22 },
  // middle gap (where robot stands) — no merlon between x=142..178
  { x: 182, y: 88,  w: 14, h: 22 },
  { x: 200, y: 92,  w: 14, h: 18 },
];

const VAPOR_SEEDS = [
  { x: 100, y: 296, r: 1.6, vx: -8, dur: 3.4, delay: 0.0 },
  { x: 220, y: 296, r: 1.4, vx:  9, dur: 3.8, delay: 0.6 },
  { x: 140, y: 312, r: 1.1, vx: -4, dur: 3.1, delay: 1.2 },
  { x: 180, y: 308, r: 1.4, vx:  6, dur: 3.6, delay: 1.8 },
  { x:  82, y: 282, r: 1.0, vx: -6, dur: 3.0, delay: 0.3 },
  { x: 240, y: 282, r: 1.0, vx:  7, dur: 3.2, delay: 0.9 },
  { x: 160, y: 320, r: 1.5, vx:  0, dur: 4.0, delay: 1.5 },
];

/* ─────────────────────────────────────────────────────────────────────── */
/* Sub-components in the same file: torch + paladin silhouette.            */

function Torch({
  x,
  y,
  scale = 1,
  delay = 0,
}: {
  x: number;
  y: number;
  scale?: number;
  delay?: number;
}) {
  // y is the base of the torch (where the cup meets stone)
  const flameDelay = `${delay}s`;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* pole */}
      <rect x="-1.5" y="-18" width="3" height="20" fill="#3A2A1B" rx="1" />
      {/* iron cup */}
      <ellipse cx="0" cy="-19" rx="5.5" ry="2.4" fill="#5A4030" />
      <ellipse cx="0" cy="-19.5" rx="5.5" ry="1.4" fill="#2C1F14" />
      {/* embers in cup */}
      <ellipse cx="0" cy="-20" rx="3" ry="0.8" fill="#FCA974" opacity="0.9" />

      {/* outer flame — flickers */}
      <g
        style={{
          transformOrigin: `0px -22px`,
          animation: `island-flame 1.8s ${flameDelay} infinite ease-in-out`,
        }}
      >
        <path
          d="M -7 -22
             Q -3 -34 0 -42
             Q 3 -34 7 -22
             Q 4 -28 0 -30
             Q -4 -28 -7 -22 Z"
          fill="url(#aegis-flame)"
        />
      </g>
      {/* inner flame core — softer flicker */}
      <g
        style={{
          transformOrigin: `0px -22px`,
          animation: `island-flame-soft 1.3s ${flameDelay} infinite ease-in-out`,
        }}
      >
        <path
          d="M -3 -22
             Q -1.5 -30 0 -34
             Q 1.5 -30 3 -22
             Q 1.5 -25 0 -26
             Q -1.5 -25 -3 -22 Z"
          fill="url(#aegis-flame-core)"
        />
      </g>
      {/* sparks rising */}
      <circle
        cx="-2"
        cy="-30"
        r="0.7"
        fill="#FFD79A"
        style={{
          animation: `island-spark 2.4s ${delay + 0.4}s infinite ease-out`,
          transformOrigin: "-2px -30px",
        }}
      />
      <circle
        cx="3"
        cy="-32"
        r="0.6"
        fill="#FFEDC2"
        style={{
          animation: `island-spark 2.8s ${delay + 1.2}s infinite ease-out`,
          transformOrigin: "3px -32px",
        }}
      />
    </g>
  );
}

function PaladinSilhouette({
  accent,
  accentSoft,
}: {
  accent: string;
  accentSoft: string;
}) {
  // Anchored at x=160, with feet at y=110 (keep walking surface).
  return (
    <g transform="translate(160 110)" data-role="robot-placeholder">
      {/* boot shadow */}
      <ellipse cx="0" cy="2" rx="18" ry="3" fill="#1A1A1A" opacity="0.22" />

      {/* legs */}
      <rect x="-9"  y="-26" width="7" height="28" rx="2.5" fill={accent} />
      <rect x="2"   y="-26" width="7" height="28" rx="2.5" fill={accent} />

      {/* skirt / belt */}
      <path
        d="M -14 -28 L -14 -22 Q 0 -18 14 -22 L 14 -28 Z"
        fill={accent}
      />
      <rect x="-15" y="-30" width="30" height="3" rx="1" fill="#3D1A0A" opacity="0.5" />

      {/* shield — held forward on the left arm */}
      <path
        d="M -28 -52
           Q -28 -28 -22 -22
           Q -16 -18 -10 -22
           Q -10 -52 -10 -54
           Q -19 -56 -28 -52 Z"
        fill={accent}
      />
      <path
        d="M -22 -50 Q -22 -32 -20 -28 L -20 -50 Z"
        fill="#3D1A0A"
        opacity="0.45"
      />
      {/* shield crest */}
      <circle cx="-19" cy="-40" r="2.5" fill="#FCD9A6" opacity="0.9" />
      <path d="M -19 -43 L -19 -36 M -22 -40 L -16 -40" stroke="#FCD9A6" strokeWidth="1" />

      {/* torso */}
      <path
        d="M -13 -54
           Q -13 -58 -9 -60
           L 9 -60
           Q 13 -58 13 -54
           L 13 -30
           Q 0 -26 -13 -30 Z"
        fill={accent}
      />
      {/* chest emblem */}
      <path
        d="M -4 -52 L 4 -52 L 4 -44 L 0 -40 L -4 -44 Z"
        fill="#3D1A0A"
        opacity="0.55"
      />

      {/* pauldrons */}
      <ellipse cx="-13" cy="-56" rx="6.5" ry="4.5" fill={accent} />
      <ellipse cx="13"  cy="-56" rx="6.5" ry="4.5" fill={accent} />
      <ellipse cx="-13" cy="-58" rx="6.5" ry="2.5" fill="#3D1A0A" opacity="0.4" />
      <ellipse cx="13"  cy="-58" rx="6.5" ry="2.5" fill="#3D1A0A" opacity="0.4" />

      {/* sword arm — right side, sword pointed down behind */}
      <path
        d="M 13 -52
           Q 22 -48 22 -36
           L 18 -34
           Q 14 -42 12 -46 Z"
        fill={accent}
      />
      <rect x="20" y="-34" width="2" height="22" fill="#3D1A0A" opacity="0.55" />
      <rect x="18" y="-12" width="6"  height="2"  fill="#3D1A0A" opacity="0.55" />

      {/* neck */}
      <rect x="-3" y="-66" width="6" height="7" fill={accent} />

      {/* helmet */}
      <path
        d="M -10 -78
           Q -10 -90 0 -90
           Q 10 -90 10 -78
           L 10 -66
           Q 0 -62 -10 -66 Z"
        fill={accent}
      />
      {/* helmet visor slit */}
      <rect x="-7" y="-76" width="14" height="2.2" rx="1" fill="#1A0B05" />
      {/* visor inner glow */}
      <rect x="-6.5" y="-75.4" width="13" height="1" fill="#FCA974" opacity="0.9" />
      {/* helmet crest plume */}
      <path
        d="M -1 -92
           Q 1 -98 5 -96
           Q 3 -90 1 -88 Z"
        fill="#7C2D12"
      />
      <path
        d="M -3 -92
           Q -1 -100 3 -98
           Q 1 -91 -1 -88 Z"
        fill="#C2410C"
      />

      {/* helmet bottom band */}
      <rect x="-10" y="-68" width="20" height="2.5" fill="#3D1A0A" opacity="0.55" />

      {/* placeholder marker (dashed accent halo at boot level — *no text*) */}
      <ellipse
        cx="0"
        cy="0"
        rx="16"
        ry="2"
        fill="none"
        stroke={accent}
        strokeOpacity="0.5"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      <ellipse cx="0" cy="0" rx="11" ry="1.2" fill={accentSoft} />
    </g>
  );
}
