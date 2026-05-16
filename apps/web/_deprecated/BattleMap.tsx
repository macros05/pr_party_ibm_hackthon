"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { CHARACTERS, CHARACTER_ORDER } from "@/tokens/characters";
import { HOTSPOTS } from "@/tokens/hotspots";
import type { CharacterId } from "@/types/encounter";

const MAP_RATIO = 1672 / 941;

/**
 * Home — full-bleed battle map with 6 clickable islands.
 * No robots, no chrome. Hover a zone → it glows in the character's
 * accent and a small nameplate floats up. Click → navigate to that
 * character's island page.
 */
export function BattleMap() {
  const [debug, setDebug] = React.useState(false);
  const [hovered, setHovered] = React.useState<CharacterId | null>(null);

  React.useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  return (
    <div className="relative h-dvh w-dvw overflow-hidden">
      {/* full-bleed map stage */}
      <div
        data-debug={debug || undefined}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: `max(100vw, calc(100vh * ${MAP_RATIO}))`,
          height: `max(100vh, calc(100vw / ${MAP_RATIO}))`,
        }}
      >
        <Image
          src="/map.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
          className="select-none object-cover"
          draggable={false}
        />

        {/* warm rim + vignette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 75% at 50% 55%, rgba(252, 200, 130, 0.05) 0%, transparent 55%), radial-gradient(120% 120% at 50% 50%, transparent 55%, rgba(20, 14, 8, 0.55) 100%)",
          }}
        />

        {/* hotspots — clickable islands */}
        {CHARACTER_ORDER.map((id) => {
          const h = HOTSPOTS[id];
          const c = CHARACTERS[id];
          const isHovered = hovered === id;
          return (
            <Link
              key={id}
              href={`/island/${id}`}
              prefetch
              className="hotspot absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              data-character={id}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.w}%`,
                height: `${h.h}%`,
              }}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() =>
                setHovered((prev) => (prev === id ? null : prev))
              }
            >
              {/* glow on hover */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(closest-side, ${c.accent} 0%, transparent 65%)`,
                  mixBlendMode: "screen",
                }}
                animate={{ opacity: isHovered ? 0.42 : 0 }}
                transition={{ duration: 0.4 }}
              />

              {/* outer ring on hover */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  width: "78%",
                  height: "78%",
                  border: `1.5px solid ${c.accent}`,
                  boxShadow: `0 0 24px ${c.accent}`,
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: isHovered ? 0.65 : 0,
                  scale: isHovered ? 1 : 0.9,
                }}
                transition={{ duration: 0.3 }}
              />

              {/* nameplate — slides up on hover */}
              <AnimatePresence>
                {isHovered && <IslandNameplate id={id} />}
              </AnimatePresence>
            </Link>
          );
        })}
      </div>

      {/* ambient hint — bottom-center, only when nothing is hovered */}
      <AnimatePresence>
        {!hovered && (
          <motion.p
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 0.7, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.36em] text-[var(--fg-soft)]"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}
          >
            choose an island
          </motion.p>
        )}
      </AnimatePresence>

      {debug && (
        <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-50 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fg-soft)]">
          debug · edit{" "}
          <span className="text-[var(--fg-muted)]">tokens/hotspots.ts</span>
        </div>
      )}
    </div>
  );
}

function IslandNameplate({ id }: { id: CharacterId }) {
  const c = CHARACTERS[id];
  return (
    <motion.div
      key="name"
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
      style={{ bottom: "-14%" }}
    >
      <div
        className="rounded-full px-5 py-2"
        style={{
          background: "rgba(20, 16, 10, 0.88)",
          border: `1px solid ${c.accent}88`,
          boxShadow: `0 14px 26px -12px rgba(0,0,0,0.85), 0 0 18px ${c.accent}55`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <p
          className="font-display text-[22px] leading-none tracking-tight"
          style={{ color: "var(--fg)" }}
        >
          {c.name}
        </p>
        <p
          className="mt-1 font-mono text-[9px] uppercase tracking-[0.24em]"
          style={{ color: c.accent }}
        >
          {c.class} · L{c.defaultLevel.toString().padStart(2, "0")}
        </p>
      </div>
    </motion.div>
  );
}
