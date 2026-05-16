import type { CharacterId, CharacterName } from "@/types/encounter";

/**
 * Per-character "island archetype" — narrative type of the floating land.
 * Used by Archipelago to look up which <Island/> component to render.
 */
export type IslandArchetype =
  | "ember-fortress"      // Aegis
  | "aquatic-library"    // Schema
  | "luminous-garden"   // Pixel
  | "cartographer-peak" // Atlas
  | "rune-temple"      // Echo
  | "scroll-tower";   // Codex

export interface CharacterToken {
  id: CharacterId;
  name: CharacterName;
  /**
   * Display class label. Decoupled from `CharacterClass` in the backend
   * encounter contract — UI lore can evolve without breaking the API.
   */
  class: string;
  /** Domain shorthand for badges (`"Security"`, `"Tests"`, `"Comms"`...). */
  classShort: string;
  /** Full flavor paragraph shown on the character island. */
  description: string;
  defaultLevel: number;
  /** Island archetype — drives which inline SVG island renders. */
  island: IslandArchetype;
  /** Primary accent — borders, glow, accent rule under the name. */
  accent: string;
  /** ~10% alpha of the accent for soft fills. */
  accentSoft: string;
  /** Halo color behind the robot. Slightly warmer/wider than accent. */
  glow: string;
  /** Pale surface tint used by the robot slot gradient. */
  surface: string;
  /** Border tint of the island, accent-shifted off the neutral border. */
  border: string;
  /**
   * Local stone/material palette used INSIDE the island SVG.
   * Order: deepest → mid → light → top-highlight.
   * Aegis: warm stone with brasa veins.
   * Other characters keep theirs even if their islands aren't built yet.
   */
  stone: {
    deep: string;
    mid: string;
    light: string;
    top: string;
    shadow: string;
    /** Glowing accent vein color (brasa, runa, data, savia, ámbar...). */
    veinHi: string;
    veinLo: string;
  };
}

export const CHARACTERS: Record<CharacterId, CharacterToken> = {
  aegis: {
    id: "aegis",
    name: "Aegis",
    class: "Security Paladin",
    classShort: "Security",
    description:
      "Aegis hunts the kind of bugs that ship to prod and don't come back: forged sessions, hardcoded secrets, broken auth, SSRF tunnels.",
    defaultLevel: 8,
    island: "ember-fortress",
    accent: "#C2410C",
    accentSoft: "rgba(194, 65, 12, 0.10)",
    glow: "rgba(252, 169, 116, 0.55)",
    surface: "#FFF1E6",
    border: "#EFE0D6",
    stone: {
      deep:   "#3B2E25",
      mid:    "#7C6B5E",
      light:  "#A99587",
      top:    "#D2C2B2",
      shadow: "#241B16",
      veinHi: "#FCA974",
      veinLo: "#C2410C",
    },
  },
  schema: {
    id: "schema",
    name: "Schema",
    class: "Database Mage",
    classShort: "Database",
    description:
      "Schema reads every migration like a contract. Field by field, foreign key by foreign key, looking for the column that lies about itself.",
    defaultLevel: 7,
    island: "aquatic-library",
    accent: "#0E7490",
    accentSoft: "rgba(14, 116, 144, 0.10)",
    glow: "rgba(14, 116, 144, 0.30)",
    surface: "#ECF6F7",
    border: "#D9E7EB",
    stone: {
      deep:   "#243842",
      mid:    "#6F8A93",
      light:  "#A6BEC6",
      top:    "#D4E1E6",
      shadow: "#172029",
      veinHi: "#7DD3E2",
      veinLo: "#0E7490",
    },
  },
  pixel: {
    id: "pixel",
    name: "Pixel",
    class: "UX Bard",
    classShort: "UX",
    description:
      "Pixel reads the diff like a designer. Focus, copy, contrast, motion. He'll catch a 'whoopsie!' modal before it ever ships.",
    defaultLevel: 6,
    island: "luminous-garden",
    accent: "#BE185D",
    accentSoft: "rgba(190, 24, 93, 0.10)",
    glow: "rgba(190, 24, 93, 0.30)",
    surface: "#FBEEF4",
    border: "#ECDCE3",
    stone: {
      deep:   "#3F2A2E",
      mid:    "#85716C",
      light:  "#BDA59E",
      top:    "#E2CDC4",
      shadow: "#21161A",
      veinHi: "#F9A8D4",
      veinLo: "#BE185D",
    },
  },
  atlas: {
    id: "atlas",
    name: "Atlas",
    class: "Architecture Ranger",
    classShort: "Architecture",
    description:
      "Atlas watches the seams. He flags the moment one module reaches into another, sniffs out missing flags, untangles drifting layers.",
    defaultLevel: 9,
    island: "cartographer-peak",
    accent: "#4D7C0F",
    accentSoft: "rgba(77, 124, 15, 0.10)",
    glow: "rgba(77, 124, 15, 0.28)",
    surface: "#F2F7EA",
    border: "#DEE6CF",
    stone: {
      deep:   "#2B331F",
      mid:    "#6F7B5C",
      light:  "#A6AE8E",
      top:    "#D4D9BA",
      shadow: "#1A1F12",
      veinHi: "#B4D88D",
      veinLo: "#4D7C0F",
    },
  },
  echo: {
    id: "echo",
    name: "Echo",
    class: "Signal Operative",
    classShort: "Comms",
    description:
      "Echo tracks the silent things: stale endpoints, ghosted heartbeats, the retries that never come back. When the system goes quiet, Echo listens.",
    defaultLevel: 7,
    island: "rune-temple",
    accent: "#6D28D9",
    accentSoft: "rgba(109, 40, 217, 0.10)",
    glow: "rgba(109, 40, 217, 0.30)",
    surface: "#F2ECFA",
    border: "#E0D8EE",
    stone: {
      deep:   "#2E2840",
      mid:    "#7E7793",
      light:  "#B4ACC4",
      top:    "#E1DCEC",
      shadow: "#1A1626",
      veinHi: "#C4B5FD",
      veinLo: "#6D28D9",
    },
  },
  codex: {
    id: "codex",
    name: "Codex",
    class: "Documentation Scribe",
    classShort: "Docs",
    description:
      "Codex keeps the docs in lockstep with the diff. If the README still describes last quarter's architecture, Codex marks it down.",
    defaultLevel: 5,
    island: "scroll-tower",
    accent: "#B45309",
    accentSoft: "rgba(180, 83, 9, 0.10)",
    glow: "rgba(180, 83, 9, 0.30)",
    surface: "#FAF1E2",
    border: "#EBDEC7",
    stone: {
      deep:   "#3C2D17",
      mid:    "#8B6F46",
      light:  "#C2A57A",
      top:    "#E6D4AF",
      shadow: "#231809",
      veinHi: "#FBBF24",
      veinLo: "#B45309",
    },
  },
};

export const CHARACTER_ORDER: readonly CharacterId[] = [
  "aegis",
  "schema",
  "pixel",
  "atlas",
  "echo",
  "codex",
];
