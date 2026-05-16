import type { CharacterId } from "@/types/encounter";

/**
 * A point of interest on an island. Coordinates are expressed as
 * percentages of the rendered island image's bounding box (NOT the
 * column it lives in), so they survive any resize.
 */
export interface IslandPoint {
  /** percentage X relative to the rendered island image width */
  xPct: number;
  /** percentage Y relative to the rendered island image height */
  yPct: number;
  /** descriptive label for accessibility / tooltips */
  label: string;
}

/**
 * Three per-character waypoints where the robot pauses to scan.
 * Coordinates are tuned against the painterly island PNGs (1376x768),
 * placing the robot on the walkable top surface — never below ~Y=58%
 * (the painted "floor" ends there on every island) and never narrower
 * than ~X=28% / wider than ~X=72% (the rocky base under-cuts the land
 * past those bounds).
 *
 * If a point looks off, prefer adjusting yPct first; the surface plane
 * (where things "stand") sits well above the geometric center of the
 * floating mass.
 */
export const ISLAND_POINTS: Record<CharacterId, IslandPoint[]> = {
  aegis: [
    { xPct: 50, yPct: 47, label: "Central courtyard" },
    { xPct: 34, yPct: 46, label: "West tower base" },
    { xPct: 66, yPct: 50, label: "East tower base" },
  ],
  schema: [
    { xPct: 50, yPct: 45, label: "Central crystal cluster" },
    { xPct: 30, yPct: 48, label: "West rune pillar" },
    { xPct: 70, yPct: 48, label: "East rune pillar" },
  ],
  pixel: [
    { xPct: 50, yPct: 52, label: "Central fountain" },
    { xPct: 34, yPct: 44, label: "Left cherry tree" },
    { xPct: 66, yPct: 48, label: "Right flower bed" },
  ],
  atlas: [
    { xPct: 50, yPct: 47, label: "Map table" },
    { xPct: 35, yPct: 44, label: "Cartographer hut" },
    { xPct: 66, yPct: 43, label: "Observation dish" },
  ],
  echo: [
    { xPct: 50, yPct: 50, label: "Central altar stone" },
    { xPct: 32, yPct: 48, label: "West pillar" },
    { xPct: 68, yPct: 48, label: "East pillar" },
  ],
  codex: [
    { xPct: 60, yPct: 48, label: "Tower base" },
    { xPct: 46, yPct: 53, label: "Pedestal with book" },
    { xPct: 34, yPct: 55, label: "Scroll pile" },
  ],
};
