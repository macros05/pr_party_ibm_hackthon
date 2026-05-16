import type { CharacterId } from "@/types/encounter";

/**
 * Zonas interactivas sobre el battle map (`/public/map.png`).
 *
 * Coordenadas en PORCENTAJE relativas al mapa renderizado.
 * `x` y `y` son el centro de la zona donde flota el robot.
 * `w` y `h` el área de hover en %.
 *
 * Las 6 islas del mapa (top→bottom, left→right):
 *   castillo · cristal/altar · bosque rosado
 *   montaña · templo runa · torre
 *
 * Ajustar viendo el mapa con `?debug` en la URL.
 */
export interface Hotspot {
  /** Centro de la zona, en % del ancho del mapa. */
  x: number;
  /** Centro de la zona, en % del alto del mapa. */
  y: number;
  /** Ancho del área de hover, en % del ancho del mapa. */
  w: number;
  /** Alto del área de hover, en % del alto del mapa. */
  h: number;
}

export const HOTSPOTS: Record<CharacterId, Hotspot> = {
  aegis:  { x: 19, y: 30, w: 22, h: 36 },  // castillo
  schema: { x: 47, y: 26, w: 22, h: 36 },  // cristal altar
  pixel:  { x: 78, y: 32, w: 22, h: 36 },  // bosque rosado
  atlas:  { x: 22, y: 68, w: 22, h: 36 },  // montaña
  echo:   { x: 47, y: 72, w: 22, h: 36 },  // templo runa
  codex:  { x: 75, y: 68, w: 22, h: 36 },  // torre
};
