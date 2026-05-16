"use client";

import type { CharacterId } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";

interface Props {
  characterId: CharacterId;
  title: string;
  repo: string;
  prNumber: number;
}

export function PullRequestHeader({
  characterId,
  title,
  repo,
  prNumber,
}: Props) {
  const c = CHARACTERS[characterId];
  return (
    <header
      className="mx-12 mt-8 rounded-md px-5 pb-4 pt-4 xl:mx-16"
      style={{
        borderTop: `2px solid ${c.accent}`,
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(2px)",
      }}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
        Pull request
      </p>
      <p className="mt-2 font-display text-[18px] leading-snug text-white/95">
        {title}
      </p>
      <p className="mt-1 font-mono text-[10px] text-white/45">
        {repo} <span className="text-white/30">·</span> #{prNumber}
      </p>
    </header>
  );
}
