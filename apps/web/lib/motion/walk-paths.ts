import type { CharacterId } from "@/types/encounter";

/**
 * Per-character walking path. Each robot follows its own loop around
 * the island it lives on. Waypoints are in *robot-width units*: a value
 * of 1 = one robot width. They get multiplied by the robot's rendered
 * width so paths scale with the stage.
 *
 * Tips when tuning:
 *  - keep the path roughly within the island silhouette (rough patrol)
 *  - the LAST waypoint should equal the FIRST so the loop is seamless
 *  - duration controls how slow the patrol feels (12-22s reads natural)
 *  - facing[i] is which way the robot is looking while heading TO
 *    waypoint i+1 (1 = right, -1 = left)
 */

export interface Waypoint {
  /** dx in robot-width units */
  x: number;
  /** dy in robot-width units */
  y: number;
}

export interface WalkPath {
  /** Waypoints in robot-width units. Loop is seamless if last == first. */
  waypoints: Waypoint[];
  /** Direction the robot faces while heading toward each waypoint (segment i → i+1). */
  facing: Array<1 | -1>;
  /** Duration of one full loop, seconds. */
  duration: number;
  /** Phase offset so the 6 robots desync. */
  delay: number;
}

export const WALK_PATHS: Record<CharacterId, WalkPath> = {
  aegis: {
    waypoints: [
      { x: -0.55, y:  0.10 },
      { x:  0.55, y:  0.10 },
      { x:  0.55, y: -0.10 },
      { x: -0.55, y: -0.10 },
      { x: -0.55, y:  0.10 },
    ],
    facing: [1, 1, -1, -1],
    duration: 16,
    delay: 0,
  },
  schema: {
    waypoints: [
      { x:  0.00, y:  0.20 },
      { x:  0.60, y:  0.00 },
      { x:  0.00, y: -0.20 },
      { x: -0.60, y:  0.00 },
      { x:  0.00, y:  0.20 },
    ],
    facing: [1, -1, -1, 1],
    duration: 18,
    delay: 1.4,
  },
  pixel: {
    waypoints: [
      { x: -0.45, y:  0.15 },
      { x:  0.45, y:  0.05 },
      { x:  0.45, y: -0.15 },
      { x: -0.45, y: -0.05 },
      { x: -0.45, y:  0.15 },
    ],
    facing: [1, 1, -1, -1],
    duration: 14,
    delay: 0.7,
  },
  atlas: {
    waypoints: [
      { x: -0.50, y:  0.08 },
      { x:  0.20, y:  0.20 },
      { x:  0.55, y:  0.00 },
      { x:  0.20, y: -0.18 },
      { x: -0.50, y: -0.08 },
      { x: -0.50, y:  0.08 },
    ],
    facing: [1, 1, -1, -1, 1],
    duration: 20,
    delay: 2.1,
  },
  echo: {
    waypoints: [
      { x:  0.00, y:  0.18 },
      { x:  0.55, y:  0.05 },
      { x:  0.00, y: -0.18 },
      { x: -0.55, y:  0.05 },
      { x:  0.00, y:  0.18 },
    ],
    facing: [1, -1, -1, 1],
    duration: 17,
    delay: 0.4,
  },
  codex: {
    waypoints: [
      { x: -0.40, y:  0.12 },
      { x:  0.40, y:  0.18 },
      { x:  0.55, y: -0.05 },
      { x: -0.55, y: -0.05 },
      { x: -0.40, y:  0.12 },
    ],
    facing: [1, 1, -1, 1],
    duration: 19,
    delay: 3.2,
  },
};
