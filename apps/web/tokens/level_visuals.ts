import type { CharacterId } from "@/types/encounter";

/**
 * Level → island visual richness. Each archetype has its own
 * ambient elements that multiply with character level, documented
 * in SPEC §presentation (visible progression).
 *
 * Aegis (Fortaleza de Brasa) — 1 antorcha por cada 2 niveles, base 2.
 * Schema (Biblioteca Acuática) — más columnas/tablas reflejadas.
 * Pixel (Jardín Luminoso) — más flores y densidad de hierba.
 * Atlas (Cima del Cartógrafo) — más mapas, segunda cumbre detrás.
 * Echo (Templo de las Runas) — más runas y halo más definido.
 * Codex (Torre de Pergaminos) — más pergaminos, pila más alta.
 *
 * Aegis is wired; the others ship with stub values until their
 * islands are designed and approved one by one.
 */

export interface AegisVisuals {
  /** Total torches around the fortress. */
  torches: number;
  /** Brasa ember vein intensity 0..1. */
  emberIntensity: number;
}
export interface SchemaVisuals {
  columns: number;
  reflectedTables: number;
}
export interface PixelVisuals {
  flowers: number;
  grassTufts: number;
}
export interface AtlasVisuals {
  rolledMaps: number;
  hasSecondPeak: boolean;
}
export interface EchoVisuals {
  runes: number;
  haloIntensity: number;
}
export interface CodexVisuals {
  floatingScrolls: number;
  bookStackHeight: number;
}

export interface LevelVisualsMap {
  aegis:  AegisVisuals;
  schema: SchemaVisuals;
  pixel:  PixelVisuals;
  atlas:  AtlasVisuals;
  echo:   EchoVisuals;
  codex:  CodexVisuals;
}

const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

export function visualsFor<K extends CharacterId>(
  id: K,
  level: number,
): LevelVisualsMap[K] {
  const lvl = clamp(level, 1, 20);
  switch (id) {
    case "aegis": {
      // base 2, +1 every 2 levels above 2, soft cap at 6
      const torches = clamp(2 + Math.floor(Math.max(0, lvl - 2) / 2), 2, 6);
      const emberIntensity = clamp(0.45 + (lvl - 1) * 0.05, 0.45, 1);
      return { torches, emberIntensity } as LevelVisualsMap[K];
    }
    case "schema":
      return {
        columns: clamp(2 + Math.floor(lvl / 2), 2, 6),
        reflectedTables: clamp(1 + Math.floor(lvl / 3), 1, 4),
      } as LevelVisualsMap[K];
    case "pixel":
      return {
        flowers: clamp(3 + lvl, 3, 14),
        grassTufts: clamp(4 + Math.floor(lvl * 1.2), 4, 18),
      } as LevelVisualsMap[K];
    case "atlas":
      return {
        rolledMaps: clamp(1 + Math.floor(lvl / 2), 1, 5),
        hasSecondPeak: lvl >= 6,
      } as LevelVisualsMap[K];
    case "echo":
      return {
        runes: clamp(4 + Math.floor(lvl / 2), 4, 10),
        haloIntensity: clamp(0.4 + lvl * 0.05, 0.4, 1),
      } as LevelVisualsMap[K];
    case "codex":
      return {
        floatingScrolls: clamp(2 + Math.floor(lvl / 2), 2, 6),
        bookStackHeight: clamp(3 + Math.floor(lvl / 2), 3, 7),
      } as LevelVisualsMap[K];
  }
  // exhaustive
  const _exhaustive: never = id;
  return _exhaustive;
}
