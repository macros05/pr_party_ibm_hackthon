import type { CharacterId } from "@/types/encounter";
import {
  framePathsFor,
  loadManifest,
  resolveAnimation,
  type AnimName,
} from "./manifest";

/** Cache of fully-loaded image objects, keyed by URL. */
const imageCache = new Map<string, HTMLImageElement>();

/** In-flight per-URL promises, so concurrent callers share work. */
const inflight = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const hit = imageCache.get(src);
  if (hit) return Promise.resolve(hit);
  const existing = inflight.get(src);
  if (existing) return existing;

  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      imageCache.set(src, img);
      inflight.delete(src);
      resolve(img);
    };
    img.onerror = (e) => {
      inflight.delete(src);
      reject(e);
    };
    img.src = src;
  });
  inflight.set(src, p);
  return p;
}

export function getCachedImage(src: string): HTMLImageElement | undefined {
  return imageCache.get(src);
}

/**
 * Preload every frame of (character, animation). Resolves once all
 * frames are decoded (or rejects on first failure).
 */
export async function preloadAnimation(
  character: CharacterId,
  animation: AnimName,
): Promise<{ paths: string[]; fps: number; loop: boolean } | null> {
  const manifest = await loadManifest();
  const resolved = resolveAnimation(manifest, character, animation);
  const entry = framePathsFor(manifest, character, resolved);
  if (!entry) return null;
  await Promise.all(entry.paths.map(loadImage));
  return {
    paths: entry.paths,
    fps: entry.entry.fps,
    loop: entry.entry.loop,
  };
}

/**
 * Preload a list of (character, animation) pairs in the background.
 * Fire-and-forget; errors are swallowed because preload misses just
 * mean the runtime loader has to do the work on demand.
 */
export function preloadInBackground(
  pairs: Array<{ character: CharacterId; animation: AnimName }>,
): void {
  for (const p of pairs) {
    preloadAnimation(p.character, p.animation).catch(() => {
      /* swallow */
    });
  }
}

/**
 * Preload the island background PNG so cross-fade has the bitmap ready.
 */
export function preloadIsland(character: CharacterId): void {
  loadImage(`/islands/${character}.png`).catch(() => {
    /* swallow */
  });
}
