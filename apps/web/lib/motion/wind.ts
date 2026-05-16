"use client";

import * as React from "react";

/**
 * A tiny shared "wind" cycle that components read via a stable ref —
 * no React state, so consumers don't re-render on every frame.
 *
 * Every WIND_PERIOD_MS, a 2s gust ramps up and down on a smooth
 * cosine envelope, scaling the underlying value (drift / motion) to
 * a max multiplier of 1.5x. Components that want to react read
 * `ref.current` inside their own rAF or animation loop.
 *
 * The loop is a global singleton — only one rAF tick per frame
 * regardless of how many subscribers there are.
 */
const WIND_PERIOD_MS = 13_000;
const GUST_MS = 2_000;
const PEAK = 1.5;

let started = false;
const multRef = { current: 1 };
const rollRef = { current: 0 }; // small island roll in degrees

function tick() {
  const t = performance.now();
  const cycle = t % WIND_PERIOD_MS;
  let m = 1;
  let r = 0;
  if (cycle < GUST_MS) {
    const s = cycle / GUST_MS;
    const env = 0.5 - 0.5 * Math.cos(s * Math.PI * 2); // 0 → 1 → 0
    m = 1 + (PEAK - 1) * env;
    r = 0.6 * env; // peak ±0.6deg
  }
  multRef.current = m;
  rollRef.current = r;
  requestAnimationFrame(tick);
}

function ensureLoop() {
  if (started) return;
  if (typeof window === "undefined") return;
  started = true;
  requestAnimationFrame(tick);
}

/**
 * Returns a ref whose `.current` holds the current wind multiplier.
 * Always 1 on the server.
 */
export function useWindMultRef(): { current: number } {
  React.useEffect(() => {
    ensureLoop();
  }, []);
  return multRef;
}

/**
 * React hook that returns the current wind roll (deg) on a throttled
 * cadence (every ~80ms while gusting, then 0 between gusts). Used by
 * the island tilt which is fine to update at this rate. Avoids 60 Hz
 * React re-renders.
 */
export function useWindRoll(): number {
  const [roll, setRoll] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    ensureLoop();
    let raf = 0;
    let last = 0;
    function tickRoll() {
      const now = performance.now();
      if (now - last > 80) {
        last = now;
        setRoll(Number(rollRef.current.toFixed(2)));
      }
      raf = requestAnimationFrame(tickRoll);
    }
    raf = requestAnimationFrame(tickRoll);
    return () => cancelAnimationFrame(raf);
  }, []);
  return roll;
}
