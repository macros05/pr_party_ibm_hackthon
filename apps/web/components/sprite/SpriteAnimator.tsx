"use client";

import * as React from "react";
import type { CharacterId } from "@/types/encounter";
import {
  loadManifest,
  resolveAnimation,
  framePathsFor,
  type AnimName,
  type SpritesManifest,
} from "@/lib/sprites/manifest";
import { getCachedImage, preloadAnimation } from "@/lib/sprites/preload";
import {
  usePageVisible,
  usePrefersReducedMotion,
} from "@/lib/motion/reduced-motion";

interface Props {
  character: CharacterId;
  animation: AnimName;
  size: number;
  /** If true, ignore loop=false and keep cycling. */
  forceLoop?: boolean;
  /** Fires once after the last frame of a non-looping animation. */
  onComplete?: () => void;
}

/**
 * Pre-loads every frame of (character, animation) and plays it back
 * at the manifest-declared fps with requestAnimationFrame. The frame
 * itself is rendered through a CSS `background-image` so swapping it
 * doesn't trigger React reconciliation.
 *
 * Behaviour notes:
 *  - If the requested animation doesn't exist (e.g. "walk" on Echo),
 *    `resolveAnimation` falls back through walk/float/idle.
 *  - `prefers-reduced-motion`: locks to frame 0.
 *  - Tab hidden: rAF loop pauses; resumes from current frame on wake.
 *  - Non-looping animations stop on the last frame and call onComplete.
 */
export function SpriteAnimator({
  character,
  animation,
  size,
  forceLoop = false,
  onComplete,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const visible = usePageVisible();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  // Mirror `onComplete` into a ref so its identity changing (e.g. when
  // the parent re-renders on every pointer/wind tick) does NOT reset the
  // rAF effect and snap the sprite back to frame 0 — which was the
  // primary cause of the perceived "blinking".
  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Animation buffer — paths + fps/loop, captured per (char, anim) pair.
  const [buf, setBuf] = React.useState<{
    paths: string[];
    fps: number;
    loop: boolean;
    ready: boolean;
    /** The resolved animation name (may differ from `animation` prop). */
    resolved: AnimName;
  } | null>(null);

  // Reset + load whenever (character, animation) changes.
  React.useEffect(() => {
    let cancelled = false;
    setBuf(null);

    (async () => {
      const manifest: SpritesManifest = await loadManifest();
      const resolved = resolveAnimation(manifest, character, animation);
      const entry = framePathsFor(manifest, character, resolved);
      if (!entry) return;
      const loaded = await preloadAnimation(character, resolved);
      if (cancelled || !loaded) return;
      setBuf({
        paths: loaded.paths,
        fps: loaded.fps,
        loop: loaded.loop,
        ready: true,
        resolved,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [character, animation]);

  // Drive the rAF loop. Writes directly into the DOM element to avoid
  // re-rendering for every frame.
  const completedRef = React.useRef(false);
  React.useEffect(() => {
    completedRef.current = false;
    if (!buf || !buf.ready) return;
    const el = containerRef.current;
    if (!el) return;

    // Always paint frame 0 immediately.
    paint(el, buf.paths[0]);

    if (reduced) return; // freeze on frame 0
    if (!visible) return;

    const paths = buf.paths;
    const frameMs = 1000 / buf.fps;
    const loop = buf.loop || forceLoop;
    let raf = 0;
    let lastT = performance.now();
    let idx = 0;

    function tick(now: number) {
      const delta = now - lastT;
      if (delta >= frameMs) {
        // Catch up if we lagged (cap at 4 to avoid huge jumps)
        const steps = Math.min(4, Math.floor(delta / frameMs));
        lastT += steps * frameMs;
        let i = idx;
        for (let s = 0; s < steps; s++) {
          if (i + 1 >= paths.length) {
            if (loop) {
              i = 0;
            } else {
              i = paths.length - 1;
              if (!completedRef.current) {
                completedRef.current = true;
                if (el) paint(el, paths[i]);
                onCompleteRef.current?.();
              }
              return;
            }
          } else {
            i = i + 1;
          }
        }
        idx = i;
        if (el) paint(el, paths[idx]);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // `onComplete` is intentionally excluded — its current value is
    // always read through `onCompleteRef` so changing its identity
    // doesn't restart the animation loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buf, reduced, visible, forceLoop]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      style={{
        width: size,
        height: size,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
        backgroundPosition: "center",
        imageRendering: "pixelated",
        willChange: "background-image",
      }}
    />
  );
}

function paint(el: HTMLDivElement, src: string) {
  // Prefer the cached HTMLImageElement when present (decoded already)
  const img = getCachedImage(src);
  el.style.backgroundImage = img ? `url("${img.src}")` : `url("${src}")`;
}
