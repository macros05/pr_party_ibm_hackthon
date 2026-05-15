import type { CharacterId } from "@/types/encounter";

export interface CharacterTokens {
  /** Primary accent. Borders, icons, status dots. */
  accent: string;
  /** Muted accent (~14% alpha). Icon container backgrounds. */
  accentSoft: string;
  /** Halo/glow color. Hover, crit overlays. */
  glow: string;
}

/**
 * Per-character palette in OKLCH. Mirrors the @theme tokens declared in
 * globals.css so components can apply them as inline CSS variables when the
 * character id drives the value at render time.
 */
export const CHARACTER_TOKENS: Record<CharacterId, CharacterTokens> = {
  aegis: {
    accent: "oklch(64% 0.21 25)",
    accentSoft: "oklch(64% 0.21 25 / 0.14)",
    glow: "oklch(78% 0.16 80)",
  },
  schema: {
    accent: "oklch(64% 0.18 240)",
    accentSoft: "oklch(64% 0.18 240 / 0.14)",
    glow: "oklch(72% 0.15 240)",
  },
  pixel: {
    accent: "oklch(66% 0.25 330)",
    accentSoft: "oklch(66% 0.25 330 / 0.14)",
    glow: "oklch(74% 0.20 330)",
  },
  atlas: {
    accent: "oklch(70% 0.18 150)",
    accentSoft: "oklch(70% 0.18 150 / 0.14)",
    glow: "oklch(78% 0.15 150)",
  },
  echo: {
    accent: "oklch(64% 0.22 290)",
    accentSoft: "oklch(64% 0.22 290 / 0.14)",
    glow: "oklch(72% 0.18 290)",
  },
  codex: {
    accent: "oklch(74% 0.18 70)",
    accentSoft: "oklch(74% 0.18 70 / 0.14)",
    glow: "oklch(82% 0.15 70)",
  },
};
