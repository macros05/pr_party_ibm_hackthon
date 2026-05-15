import type { Variants } from "motion/react";

/** Card entrance — fades in with a small upward drift. */
export const characterCardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.2, 0.6, 0.2, 1] },
  },
};

/**
 * Status indicator dot.
 * - idle: dim, static
 * - thinking: fast pulse (someone is consulting)
 * - active: slow steady pulse (in council)
 * - done: bright, static
 */
export const statusDotVariants: Variants = {
  idle: { scale: 1, opacity: 0.35 },
  thinking: {
    scale: [1, 1.6, 1],
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.4, repeat: Infinity, ease: "easeInOut" },
  },
  active: {
    scale: [1, 1.2, 1],
    opacity: [0.85, 1, 0.85],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
  },
  done: { scale: 1, opacity: 0.9 },
};
