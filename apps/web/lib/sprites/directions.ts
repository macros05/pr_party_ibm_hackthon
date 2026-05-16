import type { Direction8 } from "./manifest";

/**
 * Bucket a (dx, dy) screen-space vector into one of the 8 compass
 * directions used by the sprite rotations. Screen Y grows downward,
 * so "south" corresponds to +y.
 *
 * Returns "south" for a zero vector (the idle facing).
 */
export function vectorToDirection8(dx: number, dy: number): Direction8 {
  if (dx === 0 && dy === 0) return "south";

  // angle in degrees, 0° = east, increasing counter-clockwise mathematically
  // but here we flip Y so it increases clockwise — easier to reason about.
  const angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180..180

  // Map to 0..360, then bucket into 45° slices centered on each compass point.
  const a = (angle + 360) % 360;
  if (a < 22.5 || a >= 337.5) return "east";
  if (a < 67.5) return "south-east";
  if (a < 112.5) return "south";
  if (a < 157.5) return "south-west";
  if (a < 202.5) return "west";
  if (a < 247.5) return "north-west";
  if (a < 292.5) return "north";
  return "north-east";
}
