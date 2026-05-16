"use client";

import * as React from "react";

/**
 * Reactive `prefers-reduced-motion` hook. SSR returns `false` (no
 * preference known), then re-renders on mount once the matchMedia
 * query is available.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/**
 * Page Visibility hook. `false` when the tab is hidden — useful for
 * pausing rAF loops and timed animations.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const update = () => setVisible(!document.hidden);
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  return visible;
}
