"use client";

import { motion } from "motion/react";
import type { CharacterId, Finding } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";
import { CharacterNameplate } from "./CharacterNameplate";
import { PullRequestHeader } from "./PullRequestHeader";
import { FindingsRail } from "./FindingsRail";
import { StatusFooter } from "./StatusFooter";

interface Props {
  characterId: CharacterId;
  phase: "scanning" | "analyzing" | "done";
  findings: Finding[];
  prMeta: { title: string; repo: string; pr_number: number };
}

// 8x8 fbm noise texture, used as a subtle grain. Pre-encoded once.
const NOISE_DATA_URI =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
       <filter id="n" x="0" y="0">
         <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/>
         <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.92  0 0 0 0 0.8  0 0 0 0.55 0"/>
       </filter>
       <rect width="100%" height="100%" filter="url(#n)" opacity="0.45"/>
     </svg>`,
  );

/**
 * The right column. ~40vw on desktop (≥1100px), ~45vw at narrower
 * desktops (≥900px), full-width below 900px (stacked under the
 * island, taking ~45vh).
 *
 * Surface is a dark stone with a soft accent gradient bleeding down
 * from the top, plus a subtle SVG noise overlay so it never reads as
 * a flat gradient.
 */
export function CharacterPanel({
  characterId,
  phase,
  findings,
  prMeta,
}: Props) {
  const c = CHARACTERS[characterId];

  return (
    <motion.aside
      key={characterId}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className="absolute z-[5] flex flex-col"
      style={{
        // Geometry comes from IslandPage's CSS vars so the panel
        // sits on the right on desktop and below on mobile.
        top: "var(--panel-top, 0)",
        right: 0,
        bottom: 0,
        left: "var(--panel-left, 60vw)",
        background: `linear-gradient(180deg, ${c.accent}1A 0%, rgba(10,11,15,0) 30%), #0A0B0F`,
        borderLeft: `1px solid ${c.accent}33`,
        boxShadow: `-40px 0 100px -40px rgba(0,0,0,0.85), inset 1px 0 0 ${c.accent}11`,
      }}
    >
      {/* Grain overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url("${NOISE_DATA_URI}")`,
          backgroundSize: "240px 240px",
          opacity: 0.06,
          mixBlendMode: "overlay",
        }}
      />

      {/* Accent vertical hairline on the left edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 h-full w-px"
        style={{
          background: `linear-gradient(180deg, transparent 0%, ${c.accent}80 35%, ${c.accent}40 70%, transparent 100%)`,
        }}
      />

      {/* Sweep wipe on entrance */}
      <motion.span
        aria-hidden
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 0.85, ease: "easeOut", delay: 0.1 }}
        className="pointer-events-none absolute inset-y-0 left-0 z-[1]"
        style={{
          width: "60%",
          background:
            "linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          mixBlendMode: "screen",
        }}
      />

      <div className="relative z-[2] flex h-full flex-col">
        <CharacterNameplate id={characterId} phase={phase} />
        <PullRequestHeader
          characterId={characterId}
          title={prMeta.title}
          repo={prMeta.repo}
          prNumber={prMeta.pr_number}
        />
        <FindingsRail findings={findings} accent={c.accent} phase={phase} />
        <StatusFooter
          phase={phase}
          accent={c.accent}
          findingCount={findings.length}
        />
      </div>

    </motion.aside>
  );
}
