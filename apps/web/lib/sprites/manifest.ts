/**
 * Sprite manifest loader. Mirrors the shape produced by the generation
 * pipeline at `/public/sprites/manifest.json` — version 2. Frame paths
 * are reconstructed at runtime from `{file}/frame_NNN.png`, since the
 * global manifest stores the south-facing directory and frame count
 * rather than enumerating every frame.
 */

import type { CharacterId } from "@/types/encounter";

export type Direction8 =
  | "north"
  | "north-east"
  | "east"
  | "south-east"
  | "south"
  | "south-west"
  | "west"
  | "north-west";

/** Animation names available to most characters. Echo replaces "walk" with "float". */
export type AnimName = "idle" | "walk" | "float" | "scan" | "victory" | "hit";

export interface AnimationEntry {
  file: string;
  frames: number;
  fps: number;
  loop: boolean;
}

export interface CharacterManifest {
  animations: Partial<Record<AnimName, AnimationEntry>>;
}

export interface SpritesManifest {
  version: number;
  generated_at: string;
  frame_size: [number, number];
  characters: Record<CharacterId, CharacterManifest>;
  islands: Record<CharacterId, string>;
}

let cached: SpritesManifest | null = null;
let inflight: Promise<SpritesManifest> | null = null;

export async function loadManifest(): Promise<SpritesManifest> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = fetch("/sprites/manifest.json", { cache: "force-cache" })
    .then(async (r) => {
      if (!r.ok) throw new Error(`manifest http ${r.status}`);
      const json = (await r.json()) as SpritesManifest;
      cached = json;
      return json;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

/**
 * Build the list of public-URL paths for a (character, animation) pair.
 * The manifest stores the south-facing directory; frames are
 * `frame_000.png` ... `frame_NNN.png` zero-padded to 3 digits.
 *
 * Returns `null` when the animation isn't available for that character
 * (e.g. asking for "walk" on Echo, who only has "float"). Callers
 * should fall back to `idle` in that case.
 */
export function framePathsFor(
  manifest: SpritesManifest,
  character: CharacterId,
  animation: AnimName,
): { paths: string[]; entry: AnimationEntry } | null {
  const charEntry = manifest.characters[character];
  if (!charEntry) return null;
  const animEntry = charEntry.animations[animation];
  if (!animEntry) return null;
  const paths: string[] = [];
  for (let i = 0; i < animEntry.frames; i++) {
    const n = i.toString().padStart(3, "0");
    paths.push(`/sprites/${animEntry.file}/frame_${n}.png`);
  }
  return { paths, entry: animEntry };
}

/**
 * The canonical name to consume for the "moving between waypoints"
 * animation. Echo doesn't have a "walk" cycle — she floats. Every
 * other character uses "walk".
 */
export function travelAnimationFor(character: CharacterId): AnimName {
  return character === "echo" ? "float" : "walk";
}

/**
 * Resolve animation with a fallback chain. If the requested animation
 * doesn't exist on this character, try sensible substitutes before
 * giving up.
 */
export function resolveAnimation(
  manifest: SpritesManifest,
  character: CharacterId,
  requested: AnimName,
): AnimName {
  const char = manifest.characters[character];
  if (!char) return requested;
  if (char.animations[requested]) return requested;
  if (requested === "walk" && char.animations.float) return "float";
  if (requested === "float" && char.animations.walk) return "walk";
  if (char.animations.idle) return "idle";
  return requested;
}
