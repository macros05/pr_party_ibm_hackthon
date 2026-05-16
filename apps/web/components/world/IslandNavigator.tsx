"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CharacterId } from "@/types/encounter";
import { CHARACTERS, CHARACTER_ORDER } from "@/tokens/characters";

interface Props {
  current: CharacterId;
}

/**
 * Two floating chevron buttons that page through the council. Sit in
 * the left half (the world column) — left arrow at the viewport edge,
 * right arrow just before the panel column starts.
 *
 * Also wires arrow-key shortcuts (left/right) on the window, ignoring
 * presses originating inside an input/textarea/contentEditable.
 */
export function IslandNavigator({ current }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const githubUrl = searchParams.get("github_url");
  const fixture = searchParams.get("fixture") || "pr1";

  const idx = CHARACTER_ORDER.indexOf(current);
  const prev = CHARACTER_ORDER[(idx - 1 + CHARACTER_ORDER.length) % CHARACTER_ORDER.length];
  const next = CHARACTER_ORDER[(idx + 1) % CHARACTER_ORDER.length];

  const buildUrl = (characterId: CharacterId) =>
    githubUrl
      ? `/island/${characterId}?github_url=${encodeURIComponent(githubUrl)}`
      : `/island/${characterId}?fixture=${fixture}`;

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = document.activeElement;
      if (t && isEditable(t)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        router.push(buildUrl(prev));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        router.push(buildUrl(next));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, router, fixture]);

  return (
    <>
      <NavArrow
        side="left"
        target={prev}
        label={`Previous · ${CHARACTERS[prev].name}`}
        onClick={() => router.push(buildUrl(prev))}
      />
      <NavArrow
        side="right"
        target={next}
        label={`Next · ${CHARACTERS[next].name}`}
        onClick={() => router.push(buildUrl(next))}
      />
    </>
  );
}

function NavArrow({
  side,
  target,
  label,
  onClick,
}: {
  side: "left" | "right";
  target: CharacterId;
  label: string;
  onClick: () => void;
}) {
  const c = CHARACTERS[target];
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="pointer-events-auto absolute top-1/2 z-[5] flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full transition hover:scale-110"
      style={{
        // Arrows sit just inside the world column's edges. The right
        // arrow lives at the inner edge (next to the panel), not at
        // mid-viewport, since the column geometry is now 60/40.
        left: side === "left" ? 24 : undefined,
        right: side === "right" ? 24 : undefined,
        background: "rgba(0,0,0,0.40)",
        border: `1px solid ${c.accent}33`,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        color: "#ffffff",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(0,0,0,0.60)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(0,0,0,0.40)";
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {side === "left" ? (
          <polyline points="15 18 9 12 15 6" />
        ) : (
          <polyline points="9 18 15 12 9 6" />
        )}
      </svg>
    </button>
  );
}

function isEditable(el: Element): boolean {
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}
