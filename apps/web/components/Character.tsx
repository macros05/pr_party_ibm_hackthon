"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  Compass,
  Database,
  Feather,
  Shield,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import type {
  Character as CharacterType,
  CharacterId,
  CharacterStatus,
} from "@/types/encounter";
import { CHARACTER_TOKENS } from "@/lib/character-tokens";
import {
  characterCardVariants,
  statusDotVariants,
} from "@/lib/motion/character";

const ICON_BY_ID: Record<CharacterId, LucideIcon> = {
  aegis: Shield,
  schema: Database,
  pixel: Sparkles,
  atlas: Compass,
  echo: Stethoscope,
  codex: Feather,
};

const STATUS_LABEL: Record<CharacterStatus, string> = {
  idle: "standing by",
  thinking: "consulting",
  active: "in council",
  done: "turn complete",
};

interface CharacterProps {
  character: CharacterType;
}

export function Character({ character }: CharacterProps) {
  const tokens = CHARACTER_TOKENS[character.id];
  const Icon = ICON_BY_ID[character.id];
  const findingsCount = character.findings.length;
  const isDimmed = character.status === "idle";

  const styleVars = {
    "--accent": tokens.accent,
    "--accent-soft": tokens.accentSoft,
    "--glow": tokens.glow,
  } as React.CSSProperties;

  return (
    <motion.article
      variants={characterCardVariants}
      initial="hidden"
      animate="visible"
      style={styleVars}
      data-character={character.id}
      data-status={character.status}
      className={[
        "group relative isolate overflow-hidden rounded-[10px]",
        "border border-[var(--border)] bg-[var(--surface)]/80",
        "backdrop-blur-sm transition-opacity duration-300",
        isDimmed ? "opacity-55" : "opacity-100",
      ].join(" ")}
    >
      {/* left accent rail */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
        style={{
          background: "var(--accent)",
          boxShadow: "0 0 14px 0 var(--accent)",
        }}
      />

      {/* corner glow when active */}
      {character.status === "active" && (
        <span
          aria-hidden
          className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-3xl"
          style={{ background: "var(--accent)", opacity: 0.22 }}
        />
      )}

      <div className="relative flex items-start gap-4 p-4">
        {/* icon */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md"
          style={{
            background: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </div>

        {/* meta */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate text-[15px] font-medium tracking-tight text-[var(--fg)]">
              {character.name}
            </h3>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fg-soft)]">
              lv·{String(character.level).padStart(2, "0")}
            </span>
          </div>

          <p className="mt-0.5 truncate text-xs text-[var(--fg-muted)]">
            {character.class}
          </p>

          {/* cosmetic HP rail (per spec §5: cosmetic) */}
          <div className="mt-3 h-px overflow-hidden bg-[var(--border)]">
            <div
              className="h-full transition-[width] duration-500"
              style={{
                width: `${Math.min(100, character.level * 11)}%`,
                background: "var(--accent)",
                opacity: isDimmed ? 0.35 : 0.75,
              }}
            />
          </div>

          {/* status row */}
          <div className="mt-2.5 flex items-center gap-2">
            <span className="relative inline-flex h-2 w-2">
              <motion.span
                variants={statusDotVariants}
                animate={character.status}
                className="absolute inset-0 rounded-full"
                style={{ background: "var(--accent)" }}
              />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
              {STATUS_LABEL[character.status]}
              {character.status === "done" && (
                <span className="text-[var(--fg-soft)]">
                  {" · "}
                  {findingsCount}{" "}
                  {findingsCount === 1 ? "finding" : "findings"}
                </span>
              )}
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
