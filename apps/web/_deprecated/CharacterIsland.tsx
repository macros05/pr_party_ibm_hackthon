"use client";

import * as React from "react";
import { motion } from "motion/react";
import type { Character } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";
import { islandEnterVariants, BOB } from "@/lib/motion/island";

interface CharacterIslandProps {
  /** Live character state from the encounter contract. */
  character: Character;
  /** Compositional depth: `back` islands render ~8% smaller. */
  depth?: "front" | "back";
  /** Order index for the staggered entrance. */
  order?: number;
}

const STATUS_LABEL: Record<Character["status"], string> = {
  idle: "standing by",
  thinking: "consulting",
  active: "in council",
  done: "concluded",
};

export function CharacterIsland({
  character,
  depth = "front",
  order = 0,
}: CharacterIslandProps) {
  const token = CHARACTERS[character.id];
  const bob = BOB[character.id];
  const isDimmed = character.status === "idle";
  const isActive = character.status === "active";
  const isThinking = character.status === "thinking";

  const vars = {
    "--accent": token.accent,
    "--accent-soft": token.accentSoft,
    "--glow": token.glow,
    "--surface": token.surface,
    "--border-tint": token.border,
  } as React.CSSProperties;

  return (
    <div
      style={{
        transform: depth === "back" ? "scale(0.92)" : "none",
        transformOrigin: "bottom center",
      }}
    >
      <motion.div
        custom={order}
        variants={islandEnterVariants}
        initial="hidden"
        animate="visible"
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={vars}
        data-character={character.id}
        data-status={character.status}
        data-depth={depth}
        className="group relative flex w-[260px] flex-col items-center text-center"
      >
        {/* halo behind robot — intensifies with status */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[14%] h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[64px] transition-opacity duration-700"
          style={{
            background: "var(--glow)",
            opacity: isDimmed ? 0.10 : isActive ? 0.95 : 0.42,
          }}
        />

        {/* robot — bobbing wrapper */}
        <motion.div
          className="relative h-[260px] w-[200px]"
          animate={{ y: [0, -bob.amp, 0] }}
          transition={{
            duration: bob.duration,
            delay: bob.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* TODO: swap for <Image src={`/characters/${character.id}.png`} … />
              once the Midjourney assets land in /public/characters/. */}
          <div
            className="relative flex h-full w-full items-end justify-center overflow-hidden rounded-[18px] border border-dashed"
            style={{
              background:
                "linear-gradient(180deg, var(--surface) 0%, transparent 78%)",
              borderColor: "var(--border-tint)",
              opacity: isDimmed ? 0.60 : 1,
            }}
          >
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, var(--accent-soft) 0%, transparent 70%)",
              }}
            />
            <span className="relative mb-3 font-mono text-[9px] uppercase tracking-[0.26em] text-[var(--fg-soft)]">
              robot · {character.id}
            </span>
          </div>

          {/* thinking ring around the robot slot */}
          {isThinking && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-[18px]"
              style={{ boxShadow: "inset 0 0 0 1px var(--accent)" }}
              animate={{ opacity: [0.18, 0.7, 0.18] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </motion.div>

        {/* pedestal disc — thin ellipse the robot stands on */}
        <div className="relative -mt-1 mb-1 h-[14px] w-[230px]">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-full rounded-[50%]"
            style={{
              background: "var(--bg-elev)",
              boxShadow:
                "0 14px 26px -12px rgba(26,26,26,0.30), 0 2px 4px rgba(26,26,26,0.04)",
              border: "1px solid var(--border-tint)",
            }}
          />
          {isActive && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-full rounded-[50%]"
              style={{ boxShadow: "0 0 0 1px var(--accent)" }}
            />
          )}
        </div>

        {/* label */}
        <div className="mt-5">
          <h3 className="font-display text-[28px] leading-none tracking-tight text-[var(--fg)]">
            {token.name}
          </h3>
          <span
            aria-hidden
            className="mx-auto mt-2 block h-[2px] w-7 rounded-full"
            style={{ background: "var(--accent)" }}
          />
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
            {token.classShort}
            <span className="mx-2 text-[var(--fg-soft)]">·</span>
            LV {String(character.level).padStart(2, "0")}
          </p>
          <p
            className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{
              color: isDimmed ? "var(--fg-soft)" : "var(--accent)",
              opacity: 0.88,
            }}
          >
            {STATUS_LABEL[character.status]}
            {character.status === "done" && (
              <span className="ml-2 text-[var(--fg-soft)]">
                · {character.findings.length}{" "}
                {character.findings.length === 1 ? "finding" : "findings"}
              </span>
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
