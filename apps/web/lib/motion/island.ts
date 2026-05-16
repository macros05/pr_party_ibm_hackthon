import type { Variants } from "motion/react";
import type { CharacterId } from "@/types/encounter";

/**
 * Staggered entrance: islands tween in with a small lift + scale, ordered
 * from center outwards — caller passes its index as `custom`.
 */
export const islandEnterVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      delay: 0.06 * custom,
      ease: [0.22, 0.61, 0.36, 1],
    },
  }),
};

/**
 * Per-character idle bob. Frequencies and phases are intentionally
 * non-harmonic so the six robots never line up — the council feels alive.
 */
export const BOB: Record<
  CharacterId,
  { duration: number; delay: number; amp: number }
> = {
  aegis: { duration: 3.4, delay: 0.0, amp: 4 },
  schema: { duration: 4.1, delay: 0.6, amp: 3 },
  pixel: { duration: 3.7, delay: 1.2, amp: 5 },
  atlas: { duration: 4.6, delay: 0.3, amp: 3 },
  echo: { duration: 3.9, delay: 0.9, amp: 4 },
  codex: { duration: 4.3, delay: 1.5, amp: 3 },
};
