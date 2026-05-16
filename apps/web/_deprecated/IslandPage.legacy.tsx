"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { CharacterId, Finding, Severity } from "@/types/encounter";
import { CHARACTERS, CHARACTER_ORDER } from "@/tokens/characters";
import { HOTSPOTS } from "@/tokens/hotspots";
import { useIslandAnalysis, hpFromFindings } from "@/lib/demo/character-analysis";
import { WhiteKeyFilter } from "@/components/battle/Effects";
import { WALK_PATHS } from "@/lib/motion/walk-paths";

const DESCRIPTIONS: Record<CharacterId, string> = {
  aegis:
    "Aegis hunts the kind of bugs that ship to prod and don't come back: forged sessions, hardcoded secrets, broken auth, SSRF tunnels.",
  schema:
    "Schema reads every migration like a contract. Indexes, locks, NULL handling, query plans — nothing slips past her by accident.",
  pixel:
    "Pixel reads the diff like a designer. Focus, copy, contrast, motion. He'll catch a 'whoopsie!' modal before it ever ships.",
  atlas:
    "Atlas watches the seams. He flags the moment one module reaches into another, sniffs out missing flags, untangles drifting layers.",
  echo:
    "Echo audits the tests under the tests. Coverage gaps, flaky time-based assertions, false confidence. If the suite lies, Echo names it.",
  codex:
    "Codex keeps the docs in lockstep with the diff. If the README still describes last quarter's architecture, Codex marks it down.",
};

const SEVERITY_TONE: Record<Severity, string> = {
  critical: "#E04C2B",
  high:     "#E0BB72",
  medium:   "#B9D87B",
  low:      "#7DD3E2",
  none:     "#B6A684",
};

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  none: "Info",
};

const PHASE_LABEL = {
  scanning:  "Scanning the diff",
  analyzing: "Audit in progress",
  done:      "Audit complete",
} as const;

const PR_HP_START = 220;

export function IslandPage({ id }: { id: CharacterId }) {
  const c = CHARACTERS[id];
  const path = WALK_PATHS[id];
  const { phase, findings, prMeta } = useIslandAnalysis(id);
  const hp = hpFromFindings(findings, PR_HP_START);
  const hpPct = Math.max(0, Math.min(100, (hp / PR_HP_START) * 100));
  const fillTone =
    hpPct > 66 ? "#5BD18A" :
    hpPct > 33 ? "#E0BB72" :
                  "#E04C2B";

  // Layout — compute where the island lands in viewport pixels so
  // both the zoomed map and the walking robot share one coordinate space.
  const layout = useIslandLayout(id);
  const robotWidth = Math.max(220, layout.vw * 0.16);
  const baseUnit = robotWidth;

  const walkPoints = React.useMemo(() => {
    if (!layout.vw) return [];
    return path.waypoints.map((w) => ({
      x: layout.islandX + w.x * baseUnit * 1.6,
      y: layout.islandY + w.y * baseUnit * 1.2,
    }));
  }, [path.waypoints, layout.vw, layout.islandX, layout.islandY, baseUnit]);

  const facingTrack = React.useMemo(() => {
    // build a step-function over `times` so flips snap at waypoints
    const len = path.waypoints.length;
    const fac: Array<number> = [];
    const times: Array<number> = [];
    for (let i = 0; i < len; i++) {
      const t = i / (len - 1);
      const f = i < path.facing.length ? path.facing[i] : path.facing[path.facing.length - 1];
      fac.push(f);
      times.push(t);
    }
    return { fac, times };
  }, [path]);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      <WhiteKeyFilter />

      {/* ZOOMED MAP BACKGROUND — the printed map shifted so the island
          fills the screen, heavy vignette pulling the eye to center. */}
      <IslandBackdrop layout={layout} />

      {/* ambient color wash — character accent across the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: `radial-gradient(80% 60% at 40% 65%, ${c.accent}26 0%, transparent 55%)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 50%, transparent 45%, rgba(20, 14, 8, 0.78) 100%)",
        }}
      />

      {/* film grain on top */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          opacity: 0.055,
          mixBlendMode: "overlay",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='180' height='180' filter='url(%23n)' opacity='0.9'/></svg>\")",
        }}
      />

      {/* top-left: back link + small map mini */}
      <BackLink />

      {/* center-left: big nameplate */}
      <CharacterNameplate id={id} phase={phase} />

      {/* WALKING ROBOT — big, traversing the page */}
      <div className="absolute inset-0 z-[15] pointer-events-none">
        <GroundShadow
          walkPoints={walkPoints}
          duration={path.duration}
          delay={path.delay}
          width={baseUnit}
        />
        <WalkingRobot
          id={id}
          walkPoints={walkPoints}
          facingTrack={facingTrack}
          duration={path.duration}
          delay={path.delay}
          width={robotWidth}
          accent={c.accent}
          phase={phase}
        />
        {/* scan ripple while scanning */}
        {phase === "scanning" && walkPoints[0] && (
          <ScanRipple x={walkPoints[0].x} y={walkPoints[0].y - baseUnit * 0.3} accent={c.accent} />
        )}
      </div>

      {/* RIGHT-RAIL: findings feed */}
      <FindingsRail
        findings={findings}
        accent={c.accent}
        phase={phase}
        prTitle={prMeta.title}
        prRepo={prMeta.repo}
        prNumber={prMeta.pr_number}
      />

      {/* BOTTOM: HP bar + status */}
      <div className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 pointer-events-auto">
        <div
          className="flex items-center gap-4 rounded-full px-5 py-2"
          style={{
            background: "rgba(20,16,10,0.85)",
            border: "1px solid rgba(176, 136, 75, 0.55)",
            boxShadow:
              "0 14px 36px -16px rgba(0,0,0,0.85), inset 0 1px 0 rgba(224,187,114,0.18)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.30em] text-[var(--fg-soft)]">
            PR HP
          </span>
          <div
            className="relative h-[12px] w-[280px] overflow-hidden rounded-full"
            style={{
              background: "rgba(20, 16, 10, 0.9)",
              border: "1px solid rgba(176, 136, 75, 0.45)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
            }}
          >
            <motion.div
              className="absolute left-0 top-0 h-full"
              animate={{ width: `${hpPct}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                background: `linear-gradient(180deg, ${fillTone} 0%, ${darken(fillTone)} 100%)`,
                boxShadow: `0 0 14px ${fillTone}88, inset 0 0 0 1px rgba(255,255,255,0.10)`,
              }}
            />
          </div>
          <span className="font-display text-[14px] tabular-nums leading-none text-[var(--fg)]">
            {hp}
            <span className="ml-1 text-[var(--fg-soft)] text-[10px]">/ {PR_HP_START}</span>
          </span>
          <span
            className="ml-2 font-mono text-[10px] uppercase tracking-[0.26em]"
            style={{ color: phase === "done" ? "#5BD18A" : c.accent }}
          >
            {PHASE_LABEL[phase]}
          </span>
        </div>
      </div>

      {/* island peers — tiny tab on top edge with other characters */}
      <PeersRail current={id} />

      {/* description card — bottom-left */}
      <div className="absolute bottom-6 left-6 z-30 max-w-[360px]">
        <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[var(--fg-soft)]">
          {c.class}
        </p>
        <p className="mt-2 text-[13px] leading-snug text-[var(--fg-muted)]">
          {DESCRIPTIONS[id]}
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   useIslandLayout — computes where the map should sit so the
   target island lands at (vw * targetX, vh * targetY). Exposes
   that point so the walking robot can share the coordinate space.
   ============================================================ */

const MAP_ASPECT = 1672 / 941;
const ISLAND_ZOOM = 2.0;
/** where on screen we want the island centered */
const TARGET_X_FRAC = 0.40;
const TARGET_Y_FRAC = 0.60;

interface IslandLayout {
  vw: number;
  vh: number;
  mapW: number;
  mapH: number;
  mapLeft: number;
  mapTop: number;
  /** viewport pixel coords of the island center */
  islandX: number;
  islandY: number;
}

function useIslandLayout(id: CharacterId): IslandLayout {
  const [layout, setLayout] = React.useState<IslandLayout>({
    vw: 0, vh: 0, mapW: 0, mapH: 0, mapLeft: 0, mapTop: 0, islandX: 0, islandY: 0,
  });

  React.useLayoutEffect(() => {
    function update() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const h = HOTSPOTS[id];

      // Base size: cover the viewport keeping aspect ratio.
      const fitW = Math.max(vw, vh * MAP_ASPECT);
      const fitH = fitW / MAP_ASPECT;
      const mapW = fitW * ISLAND_ZOOM;
      const mapH = fitH * ISLAND_ZOOM;

      const targetX = vw * TARGET_X_FRAC;
      const targetY = vh * TARGET_Y_FRAC;

      const mapLeft = targetX - (h.x / 100) * mapW;
      const mapTop  = targetY - (h.y / 100) * mapH;

      setLayout({ vw, vh, mapW, mapH, mapLeft, mapTop, islandX: targetX, islandY: targetY });
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [id]);

  return layout;
}

/* ============================================================
   IslandBackdrop — zoom on the island region of map.png
   ============================================================ */

function IslandBackdrop({ layout }: { layout: IslandLayout }) {
  if (!layout.vw) return null;
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Image
        src="/map.png"
        alt=""
        width={1672}
        height={941}
        priority
        unoptimized
        className="absolute select-none"
        style={{
          width: layout.mapW,
          height: layout.mapH,
          left: layout.mapLeft,
          top: layout.mapTop,
          filter: "saturate(0.85) brightness(0.78)",
          maxWidth: "none",
        }}
        draggable={false}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(70% 70% at ${TARGET_X_FRAC * 100}% ${TARGET_Y_FRAC * 100}%, transparent 0%, rgba(20, 14, 8, 0.55) 65%, rgba(14, 10, 6, 0.95) 100%)`,
        }}
      />
    </div>
  );
}

/* ============================================================
   WalkingRobot — robot moving along walkPoints, with flip + step.
   Layered animation system so it reads as a living character:
   - dual halo (slow + fast) breathing out of phase
   - chassis breathing + step squash + forward lean
   - orbital energy motes circling the robot
   - scan beam projected to the ground while scanning
   - foot dust puff in sync with the gait
   - antenna spark above the head
   - triumphant corona when phase === "done"
   ============================================================ */

function WalkingRobot({
  id,
  walkPoints,
  facingTrack,
  duration,
  delay,
  width,
  accent,
  phase,
}: {
  id: CharacterId;
  walkPoints: Array<{ x: number; y: number }>;
  facingTrack: { fac: number[]; times: number[] };
  duration: number;
  delay: number;
  width: number;
  accent: string;
  phase: "scanning" | "analyzing" | "done";
}) {
  if (walkPoints.length === 0) return null;

  const xs = walkPoints.map((p) => p.x);
  const ys = walkPoints.map((p) => p.y);

  // walking only during scanning/analyzing; when done, plant on center
  const stationaryX = walkPoints[0].x;
  const stationaryY = walkPoints[0].y;
  const isMoving = phase !== "done";

  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ width, top: 0, left: 0 }}
      animate={
        phase === "done"
          ? { x: stationaryX, y: stationaryY }
          : { x: xs, y: ys }
      }
      transition={
        phase === "done"
          ? { duration: 1.0, ease: "easeOut" }
          : {
              duration,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
    >
      {/* outer breathing halo — wide soft glow */}
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[60px]"
        style={{
          width: width * 2.1,
          height: width * 2.1,
          background: accent,
        }}
        animate={{
          opacity: phase === "done" ? [0.45, 0.72, 0.45] : [0.30, 0.62, 0.30],
          scale: phase === "done" ? [1, 1.08, 1] : [1, 1.05, 1],
        }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* inner core halo — tighter, faster, out of phase */}
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[26px]"
        style={{
          width: width * 1.1,
          height: width * 1.1,
          background: accent,
        }}
        animate={{
          opacity: phase === "done" ? [0.55, 0.85, 0.55] : [0.35, 0.7, 0.35],
        }}
        transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* scan beam — downward cone, only during scanning */}
      {phase === "scanning" && <ScanBeam width={width} accent={accent} />}

      {/* orbital motes — energy dots circling at varied radii */}
      <OrbitalMotes width={width} accent={accent} active={isMoving} />

      {/* triumphant corona — slow rotating golden ring once done */}
      {phase === "done" && <DoneCorona width={width} accent={accent} />}

      {/* analyzing rim — dashed ring rotating during the audit */}
      {isMoving && (
        <motion.span
          aria-hidden
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: width * 1.4,
            height: width * 1.4,
            border: `1px dashed ${accent}`,
            opacity: 0.55,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      )}

      {/* step bounce — y-hop with subtle vertical squash on landing */}
      <motion.div
        style={{ transformOrigin: "50% 100%" }}
        animate={
          phase === "done"
            ? { y: [0, -6, 0], scaleY: [1, 1.02, 1] }
            : { y: [0, -12, 0, -7, 0], scaleY: [1, 0.95, 1.02, 0.97, 1] }
        }
        transition={{
          duration: phase === "done" ? 3.6 : 0.7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* flip wrapper — direction (facing track keys snap at waypoints) */}
        <motion.div
          animate={{
            scaleX: phase === "done" ? 1 : facingTrack.fac,
          }}
          transition={
            phase === "done"
              ? { duration: 0.3 }
              : {
                  duration,
                  delay,
                  repeat: Infinity,
                  ease: "linear",
                  times: facingTrack.times,
                }
          }
        >
          {/* sway / forward lean — gait tilt */}
          <motion.div
            animate={{
              rotate: phase === "done" ? [0, -1.4, 0, 1.4, 0] : [-3.5, 3.5, -3.5],
            }}
            transition={{
              duration: phase === "done" ? 4.4 : 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* chassis breathing — gentle scale pulse */}
            <motion.div
              animate={{
                scale: phase === "done" ? [1, 1.04, 1] : [1, 1.02, 1],
              }}
              transition={{
                duration: phase === "done" ? 3.0 : 2.4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div
                className="relative h-auto w-full"
                style={{
                  filter: `url(#whiteKey) drop-shadow(0 18px 24px rgba(0,0,0,0.7)) drop-shadow(0 0 22px ${accent}aa)`,
                }}
              >
                <Image
                  src={`/characters/${id}.png`}
                  alt={CHARACTERS[id].name}
                  width={1122}
                  height={1402}
                  draggable={false}
                  priority
                  className="h-auto w-full select-none"
                />
                {/* glint sweep — diagonal sheen passing across the chassis */}
                <motion.span
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `linear-gradient(115deg, transparent 38%, ${accent}55 50%, transparent 62%)`,
                    mixBlendMode: "screen",
                  }}
                  animate={{ opacity: [0, 0.6, 0], x: ["-30%", "30%", "30%"] }}
                  transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    times: [0, 0.35, 1],
                    repeatDelay: 1.6,
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* foot dust — small ellipse that puffs in sync with each step */}
      <FootDust width={width} active={isMoving} />

      {/* antenna spark — tiny twinkle floating above the head */}
      <AntennaSpark width={width} accent={accent} />
    </motion.div>
  );
}

/* ============================================================
   ScanBeam — narrow conical gradient projecting downward.
   Only mounted during the scanning phase.
   ============================================================ */

function ScanBeam({ width, accent }: { width: number; accent: string }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{
        top: "55%",
        width: width * 0.9,
        height: width * 1.6,
        background: `linear-gradient(180deg, ${accent}cc 0%, ${accent}33 55%, transparent 100%)`,
        clipPath: "polygon(42% 0, 58% 0, 92% 100%, 8% 100%)",
        filter: "blur(6px)",
        mixBlendMode: "screen",
      }}
      animate={{ opacity: [0.35, 0.85, 0.35], scaleY: [0.95, 1.05, 0.95] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ============================================================
   OrbitalMotes — small dots circling around the robot at varied
   radii / speeds. Each is wrapped in a rotating ring whose width
   == 2*radius so the dot orbits the robot's center.
   ============================================================ */

function OrbitalMotes({
  width,
  accent,
  active,
}: {
  width: number;
  accent: string;
  active: boolean;
}) {
  // four motes — different radii, speeds, and starting angles
  const motes = [
    { radius: 0.78, duration: 7.2,  size: 5,  offset: 0,    opacity: 0.85 },
    { radius: 0.95, duration: 9.6,  size: 4,  offset: -2.4, opacity: 0.70 },
    { radius: 1.10, duration: 11.5, size: 6,  offset: -5.0, opacity: 0.78 },
    { radius: 0.65, duration: 5.8,  size: 3,  offset: -1.2, opacity: 0.90 },
  ];

  return (
    <>
      {motes.map((m, i) => {
        const d = width * m.radius * 2;
        return (
          <motion.span
            key={i}
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ width: d, height: d }}
            animate={{ rotate: active ? 360 : 0 }}
            transition={{
              duration: m.duration,
              repeat: Infinity,
              ease: "linear",
              delay: m.offset,
            }}
          >
            <motion.span
              className="absolute left-0 top-1/2 block -translate-y-1/2 rounded-full"
              style={{
                width: m.size,
                height: m.size,
                background: accent,
                boxShadow: `0 0 14px ${accent}, 0 0 4px rgba(255,255,255,0.9)`,
              }}
              animate={{ opacity: [m.opacity * 0.4, m.opacity, m.opacity * 0.4] }}
              transition={{
                duration: 1.6 + i * 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.span>
        );
      })}
    </>
  );
}

/* ============================================================
   FootDust — three tiny ellipses at the robot's base that puff
   on the gait beat. Each is offset so the dust feels turbulent.
   ============================================================ */

function FootDust({ width, active }: { width: number; active: boolean }) {
  if (!active) return null;
  const puffs = [
    { x: -0.08, scale: 1.0, delay: 0.0 },
    { x:  0.10, scale: 0.85, delay: 0.18 },
    { x: -0.02, scale: 0.7, delay: 0.36 },
  ];
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2"
      style={{ top: "92%", width: width * 0.6, height: width * 0.18 }}
    >
      {puffs.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-0 block rounded-full"
          style={{
            width: width * 0.32,
            height: width * 0.08,
            background:
              "radial-gradient(closest-side, rgba(255,235,200,0.55) 0%, rgba(255,235,200,0) 70%)",
            filter: "blur(2px)",
            transform: `translateX(${p.x * width}px)`,
          }}
          animate={{
            opacity: [0, 0.7, 0],
            y: [0, -10 * p.scale, -18 * p.scale],
            scaleX: [0.5, 1.0 * p.scale, 1.35 * p.scale],
            scaleY: [1, 0.85, 0.6],
          }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeOut",
            delay: p.delay,
          }}
        />
      ))}
    </span>
  );
}

/* ============================================================
   AntennaSpark — small twinkle above the robot, hinting at
   an active comms link.
   ============================================================ */

function AntennaSpark({ width, accent }: { width: number; accent: string }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-full"
      style={{
        top: "-2%",
        width: 8,
        height: 8,
        background: accent,
        boxShadow: `0 0 18px ${accent}, 0 0 6px rgba(255,255,255,0.95)`,
      }}
      animate={{
        opacity: [0.25, 1, 0.25],
        scale: [0.7, 1.3, 0.7],
        y: [0, -4, 0],
      }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* faint vertical line connecting spark to the robot's head */}
      <span
        className="absolute left-1/2 top-full block -translate-x-1/2"
        style={{
          width: 1,
          height: width * 0.08,
          background: `linear-gradient(180deg, ${accent}aa 0%, transparent 100%)`,
        }}
      />
    </motion.span>
  );
}

/* ============================================================
   DoneCorona — celebratory ring stack shown when the audit
   finishes. Two concentric rings counter-rotate, plus a static
   warm halo radiating outward.
   ============================================================ */

function DoneCorona({ width, accent }: { width: number; accent: string }) {
  return (
    <>
      {/* radiant golden wash */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: width * 2.6,
          height: width * 2.6,
          background: `radial-gradient(closest-side, rgba(255,210,140,0.35) 0%, transparent 65%)`,
        }}
      />
      {/* outer rotating ring */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: width * 1.7,
          height: width * 1.7,
          border: `1.5px solid ${accent}`,
          boxShadow: `0 0 22px ${accent}88, inset 0 0 16px ${accent}55`,
        }}
        animate={{ rotate: 360, opacity: [0.55, 0.95, 0.55] }}
        transition={{
          rotate: { duration: 18, repeat: Infinity, ease: "linear" },
          opacity: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      {/* inner counter-rotating dotted ring */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: width * 1.25,
          height: width * 1.25,
          border: `1px dashed ${accent}cc`,
          opacity: 0.7,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
    </>
  );
}

/* ============================================================
   GroundShadow — soft ellipse that tracks the robot's X
   ============================================================ */

function GroundShadow({
  walkPoints,
  duration,
  delay,
  width,
}: {
  walkPoints: Array<{ x: number; y: number }>;
  duration: number;
  delay: number;
  width: number;
}) {
  if (walkPoints.length === 0) return null;
  const xs = walkPoints.map((p) => p.x);
  const ys = walkPoints.map((p) => p.y + width * 0.45);

  return (
    <motion.div
      aria-hidden
      className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
      style={{
        top: 0,
        left: 0,
        width: width * 1.1,
        height: width * 0.18,
        background:
          "radial-gradient(closest-side, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0) 70%)",
        filter: "blur(2px)",
      }}
      animate={{ x: xs, y: ys }}
      transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ============================================================
   ScanRipple — concentric pulses while scanning
   ============================================================ */

function ScanRipple({ x, y, accent }: { x: number; y: number; accent: string }) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            top: 0,
            left: 0,
            width: 220,
            height: 220,
            border: `1.5px solid ${accent}`,
            boxShadow: `0 0 28px ${accent}88`,
            x,
            y,
          }}
          initial={{ scale: 0.2, opacity: 0.85 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut",
          }}
        />
      ))}
    </>
  );
}

/* ============================================================
   CharacterNameplate
   ============================================================ */

function CharacterNameplate({
  id,
  phase,
}: {
  id: CharacterId;
  phase: "scanning" | "analyzing" | "done";
}) {
  const c = CHARACTERS[id];
  return (
    <div className="absolute left-6 top-[20vh] z-20 max-w-[460px]">
      <p
        className="font-mono text-[10px] uppercase tracking-[0.32em]"
        style={{ color: c.accent }}
      >
        Council seat · {c.classShort}
      </p>
      <h1
        className="mt-3 font-display text-[110px] leading-[0.92] tracking-tight"
        style={{
          color: "var(--fg)",
          textShadow: `0 6px 30px rgba(0,0,0,0.85), 0 0 60px ${c.accent}55`,
        }}
      >
        {c.name}
      </h1>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
        Level {c.defaultLevel.toString().padStart(2, "0")}
        <span className="mx-3 text-[var(--fg-soft)]">·</span>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3 }}
            style={{ color: c.accent }}
          >
            {PHASE_LABEL[phase]}
          </motion.span>
        </AnimatePresence>
      </p>
    </div>
  );
}

/* ============================================================
   BackLink — corner button to return to the council
   ============================================================ */

function BackLink() {
  return (
    <Link
      href="/"
      className="group pointer-events-auto absolute left-6 top-6 z-30 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-[0.28em] transition hover:bg-white/5"
      style={{
        background: "rgba(20,16,10,0.65)",
        border: "1px solid rgba(224, 187, 114, 0.30)",
        color: "var(--fg)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <span aria-hidden className="text-[var(--fg-soft)] transition group-hover:-translate-x-0.5">←</span>
      Back to council
    </Link>
  );
}

/* ============================================================
   PeersRail — small clickable list of the other characters,
   pinned to the top-right.
   ============================================================ */

function PeersRail({ current }: { current: CharacterId }) {
  return (
    <nav className="pointer-events-auto absolute right-6 top-6 z-30">
      <div
        className="flex items-center gap-1 rounded-full px-2 py-1.5"
        style={{
          background: "rgba(20,16,10,0.65)",
          border: "1px solid rgba(224, 187, 114, 0.22)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        {CHARACTER_ORDER.map((id) => {
          const c = CHARACTERS[id];
          const active = id === current;
          return (
            <Link
              key={id}
              href={`/island/${id}`}
              className="rounded-full px-3 py-1 font-mono text-[9px] uppercase tracking-[0.22em] transition"
              style={{
                color: active ? "#14110C" : "var(--fg)",
                background: active ? c.accent : "transparent",
              }}
            >
              {c.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ============================================================
   FindingsRail — right column with findings appearing in sequence
   ============================================================ */

function FindingsRail({
  findings,
  accent,
  phase,
  prTitle,
  prRepo,
  prNumber,
}: {
  findings: Finding[];
  accent: string;
  phase: "scanning" | "analyzing" | "done";
  prTitle: string;
  prRepo: string;
  prNumber: number;
}) {
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [findings.length]);

  return (
    <aside
      className="absolute right-6 top-[120px] z-20 flex h-[calc(100dvh-220px)] w-[380px] flex-col rounded-lg"
      style={{
        background: "rgba(20, 16, 10, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(224, 187, 114, 0.22)",
        boxShadow: "var(--shadow-panel)",
      }}
    >
      <header className="border-b border-white/5 px-5 pb-4 pt-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]">
          Pull request
        </p>
        <p className="mt-2 font-display text-[18px] leading-tight text-[var(--fg)]">
          {prTitle}
        </p>
        <p className="mt-1 font-mono text-[10px] text-[var(--fg-muted)]">
          {prRepo} #{prNumber}
        </p>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "thin" }}>
        {phase === "scanning" && findings.length === 0 && (
          <ScanningPlaceholder accent={accent} />
        )}

        <AnimatePresence initial={false}>
          {findings.map((f, i) => (
            <FindingCard key={f.id} finding={f} index={i} accent={accent} />
          ))}
        </AnimatePresence>

        {phase === "done" && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-soft)]"
          >
            audit complete · {findings.length} finding{findings.length === 1 ? "" : "s"}
          </motion.p>
        )}
      </div>
    </aside>
  );
}

function ScanningPlaceholder({ accent }: { accent: string }) {
  return (
    <div className="mt-12 flex flex-col items-center gap-3">
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
      <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fg-soft)]">
        reading the diff…
      </p>
    </div>
  );
}

function FindingCard({
  finding,
  index,
  accent,
}: {
  finding: Finding;
  index: number;
  accent: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, x: 24, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
      className="relative mb-3 rounded-md p-3"
      style={{
        background: "rgba(255, 255, 255, 0.025)",
        border: "1px solid rgba(224, 187, 114, 0.10)",
      }}
    >
      <span
        aria-hidden
        className="absolute left-0 top-0 h-full w-[3px] rounded-l-md"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between gap-2 pl-1">
        <p
          className="font-mono text-[9px] uppercase tracking-[0.20em]"
          style={{ color: accent }}
        >
          Finding {String(index + 1).padStart(2, "0")}
        </p>
        <SeverityBadge severity={finding.severity} />
      </div>
      <h3 className="mt-2 pl-1 font-display text-[15px] leading-tight text-[var(--fg)]">
        {finding.title}
      </h3>
      <p className="mt-1.5 pl-1 text-[12px] leading-snug text-[var(--fg-muted)]">
        {finding.explanation_voiced}
      </p>
      <div className="mt-3 flex items-center justify-between pl-1">
        <code className="truncate font-mono text-[10px] text-[var(--fg-soft)]">
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

function darken(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, ((n >> 16) & 0xff) - 60);
  const g = Math.max(0, ((n >>  8) & 0xff) - 60);
  const b = Math.max(0, ((n      ) & 0xff) - 60);
  return `rgb(${r}, ${g}, ${b})`;
}
