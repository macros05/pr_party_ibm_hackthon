"use client";

import { usePrefersReducedMotion } from "@/lib/motion/reduced-motion";

/**
 * Full-bleed sky with three layered passes:
 *   1. Deep vertical gradient (cooler at the top, warmer at the bottom)
 *      with a slow breathing of stops (±2% over 30s).
 *   2. Warm solar halo radiating from the top-right corner, gently
 *      pulsing in opacity (0.40 → 0.55 → 0.40 over 8s).
 *   3. A tiny lens flare strip — three softened circles aligned with
 *      the halo's diagonal — only visible on wide viewports.
 *
 * Pure CSS keyframes, no JS rAF.
 */
export function SkyBackground() {
  const reduced = usePrefersReducedMotion();
  return (
    <>
      <style>{`
        @keyframes pr-party-sky-breath {
          0%, 100% { background-position: 0% 0%; }
          50%      { background-position: 0% 2%; }
        }
        @keyframes pr-party-sun-pulse {
          0%, 100% { opacity: 0.42; transform: scale(1); }
          50%      { opacity: 0.58; transform: scale(1.04); }
        }
        @keyframes pr-party-flare-pulse {
          0%, 100% { opacity: 0.08; }
          50%      { opacity: 0.18; }
        }
      `}</style>

      {/* deep vertical sky */}
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, #7AB8DD 0%, #B8DFF5 35%, #FFE8CC 70%, #FFF1D8 100%)",
          backgroundSize: "100% 110%",
          animation: reduced
            ? "none"
            : "pr-party-sky-breath 30s ease-in-out infinite",
        }}
      />

      {/* warm solar halo */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 800px 600px at 85% 15%, rgba(255, 248, 220, 0.55), transparent 60%)",
          animation: reduced
            ? "none"
            : "pr-party-sun-pulse 8s ease-in-out infinite",
          transformOrigin: "85% 15%",
        }}
      />

      {/* mini lens flare along the halo's diagonal — wide screens only */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 pointer-events-none hidden xl:block"
      >
        <span
          style={{
            position: "absolute",
            top: "26%",
            left: "72%",
            width: 90,
            height: 90,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 240, 200, 0.85), transparent 60%)",
            filter: "blur(2px)",
            animation: reduced
              ? "none"
              : "pr-party-flare-pulse 8s ease-in-out infinite",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "44%",
            left: "58%",
            width: 56,
            height: 56,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 235, 200, 0.7), transparent 60%)",
            filter: "blur(3px)",
            animation: reduced
              ? "none"
              : "pr-party-flare-pulse 8s ease-in-out infinite",
            animationDelay: "1.2s",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "60%",
            left: "44%",
            width: 36,
            height: 36,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255, 230, 190, 0.55), transparent 60%)",
            filter: "blur(3px)",
            animation: reduced
              ? "none"
              : "pr-party-flare-pulse 8s ease-in-out infinite",
            animationDelay: "2.4s",
          }}
        />
      </div>
    </>
  );
}
