"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import type { CharacterId, CharacterStatus } from "@/types/encounter";
import { CHARACTERS } from "@/tokens/characters";
import { BOB } from "@/lib/motion/island";

interface RobotProps {
  id: CharacterId;
  status: CharacterStatus;
  hovered: boolean;
  /** when this number bumps, the robot shakes (crit) */
  critKey: number | null;
  /** dim this robot because another zone is the current focus */
  dimmed: boolean;
  /** rendered width in px — the robot scales relative to this */
  width: number;
}

/**
 * A robot floating over the battle map. It bobs idle, wanders gently
 * around its zone, halos brighter as status escalates idle → thinking
 * → active, lifts on hover, shakes on crit, dims when another robot
 * holds the focus.
 */
export function Robot({ id, status, hovered, critKey, dimmed, width }: RobotProps) {
  const c = CHARACTERS[id];
  const bob = BOB[id];

  const haloOpacity =
    status === "idle"     ? 0.20 :
    status === "thinking" ? 0.55 :
    status === "active"   ? 0.95 : 0.40;

  // patrol path (one full loop per ~14s, character-unique phase)
  const patrolDuration = 12 + bob.delay * 3;
  const patrolPhase = bob.delay;

  return (
    <motion.div
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width }}
      animate={{
        y: hovered ? -10 : 0,
        opacity: dimmed ? 0.40 : 1,
        filter: dimmed ? "saturate(0.5)" : "saturate(1)",
      }}
      transition={{ type: "spring", stiffness: 240, damping: 22, opacity: { duration: 0.5 }, filter: { duration: 0.5 } }}
    >
      {/* halo */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[44px]"
        style={{
          width: width * 2.2,
          height: width * 2.2,
          background: c.glow,
        }}
        animate={{
          opacity: haloOpacity,
          scale: status === "active" ? [1, 1.08, 1] : 1,
        }}
        transition={{
          opacity: { duration: 0.6 },
          scale: status === "active" ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0 },
        }}
      />

      {/* thinking ring */}
      {status === "thinking" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: width * 1.45,
            height: width * 1.45,
            border: `1px dashed ${c.accent}`,
            boxShadow: `0 0 18px ${c.accent}66`,
          }}
          animate={{ opacity: [0.25, 0.9, 0.25], rotate: 360 }}
          transition={{
            opacity: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
            rotate:  { duration: 8,   repeat: Infinity, ease: "linear" },
          }}
        />
      )}

      {/* patrol wrapper — slow loop inside the zone */}
      <motion.div
        animate={{
          x: [0, 8, 0, -8, 0],
          y: [0, -3, 0, 3, 0],
          rotate: [0, 1.2, 0, -1.2, 0],
        }}
        transition={{
          duration: patrolDuration,
          delay: patrolPhase,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* bob wrapper — faster vertical breathing */}
        <motion.div
          animate={{ y: [0, -bob.amp, 0] }}
          transition={{
            duration: bob.duration,
            delay: bob.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* crit shake */}
          <CritShake critKey={critKey}>
            <div
              className="relative h-auto w-full"
              style={{
                filter:
                  status === "idle"
                    ? "url(#whiteKey) drop-shadow(0 12px 14px rgba(0,0,0,0.55))"
                    : `url(#whiteKey) drop-shadow(0 16px 20px rgba(0,0,0,0.65)) drop-shadow(0 0 12px ${c.accent}aa)`,
                transition: "filter 600ms ease",
              }}
            >
              <Image
                src={`/characters/${id}.png`}
                alt={c.name}
                width={1122}
                height={1402}
                draggable={false}
                priority
                className="h-auto w-full select-none"
              />
            </div>
          </CritShake>
        </motion.div>
      </motion.div>

      {/* nameplate */}
      <Nameplate id={id} status={status} hovered={hovered} dimmed={dimmed} width={width} />
    </motion.div>
  );
}

function CritShake({
  critKey,
  children,
}: {
  critKey: number | null;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div
        key={critKey ?? "still"}
        animate={
          critKey == null
            ? { x: 0, y: 0 }
            : { x: [0, -5, 5, -4, 4, -2, 2, 0], y: [0, 2, -2, 1, -1, 0, 0, 0] }
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Nameplate({
  id,
  status,
  hovered,
  dimmed,
  width,
}: {
  id: CharacterId;
  status: CharacterStatus;
  hovered: boolean;
  dimmed: boolean;
  width: number;
}) {
  const c = CHARACTERS[id];
  const visible = hovered || status === "active" || status === "thinking";
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-center"
      style={{ top: width * 1.05 }}
      animate={{
        opacity: dimmed ? 0.45 : visible ? 1 : 0.62,
        y: visible ? 0 : 3,
      }}
      transition={{ duration: 0.25 }}
    >
      <p
        className="font-display text-[14px] leading-none tracking-tight"
        style={{
          color: "var(--fg)",
          textShadow: "0 2px 6px rgba(0,0,0,0.92), 0 0 18px rgba(0,0,0,0.6)",
        }}
      >
        {c.name}
      </p>
      <p
        className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.20em]"
        style={{
          color: c.accent,
          textShadow: "0 1px 3px rgba(0,0,0,0.95)",
        }}
      >
        {c.classShort} · L{c.defaultLevel.toString().padStart(2, "0")}
      </p>
    </motion.div>
  );
}
