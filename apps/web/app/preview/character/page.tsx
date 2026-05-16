"use client";

import * as React from "react";
import { AegisIsland } from "@/components/islands/AegisIsland";
import { CHARACTERS } from "@/tokens/characters";
import { visualsFor } from "@/tokens/level_visuals";

const STATUSES = ["idle", "thinking", "active", "done"] as const;
type Status = (typeof STATUSES)[number];

export default function AegisShowcase() {
  const [pulseKey, setPulseKey] = React.useState<number | undefined>(undefined);

  function triggerPulse() {
    setPulseKey((k) => (k ?? 0) + 1);
  }

  return (
    <main className="flex-1 px-6 py-20">
      <div className="relative mx-auto max-w-7xl">
        <header className="mb-16">
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fg-soft)]">
            preview · island · 01 of 06
          </p>
          <h1 className="mt-3 font-display text-6xl leading-[1.02] tracking-tight text-[var(--fg)]">
            Aegis &mdash; Fortaleza de Brasa
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[var(--fg-muted)]">
            A floating stepped keep with crenellations, ember veins glowing
            through the stone, torches whose flames flicker out of sync, and a
            vigilant paladin silhouette. The number of torches scales with the
            character&rsquo;s level.
          </p>
        </header>

        {/* level progression — three keep variants side by side */}
        <Section label="Level progression · L2 → L5 → L8">
          <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-12">
            {[2, 5, 8].map((lvl) => (
              <LevelCard key={lvl} level={lvl} />
            ))}
          </div>
        </Section>

        {/* status × bob */}
        <Section label="Status lifecycle · idle / thinking / active / done">
          <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-12">
            {STATUSES.map((status) => (
              <StatusCard key={status} status={status} />
            ))}
          </div>
        </Section>

        {/* interaction */}
        <Section label="Interaction · found-something pulse">
          <div className="flex flex-col items-center gap-6">
            <AegisIsland
              level={8}
              status="active"
              pulseKey={pulseKey}
              width={340}
            />
            <button
              type="button"
              onClick={triggerPulse}
              className="rounded-full border border-[var(--border-strong)] bg-white/70 px-5 py-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg)] shadow-[var(--shadow-panel)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-[var(--color-aegis)] hover:text-[var(--color-aegis)]"
            >
              Trigger finding pulse
            </button>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-24">
      <h2 className="mb-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--fg-soft)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        <span>{label}</span>
        <span className="h-px flex-1 bg-[var(--border)]" />
      </h2>
      {children}
    </section>
  );
}

function LevelCard({ level }: { level: number }) {
  const v = visualsFor("aegis", level);
  return (
    <figure className="flex flex-col items-center">
      <AegisIsland level={level} status="active" width={300} />
      <figcaption className="mt-6 text-center">
        <p className="font-display text-xl tracking-tight text-[var(--fg)]">
          Level {String(level).padStart(2, "0")}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fg-soft)]">
          {v.torches} torches &middot; ember {(v.emberIntensity * 100).toFixed(0)}%
        </p>
      </figcaption>
    </figure>
  );
}

function StatusCard({ status }: { status: Status }) {
  return (
    <figure className="flex flex-col items-center">
      <AegisIsland level={6} status={status} width={260} />
      <figcaption className="mt-6 text-center">
        <p
          className="font-mono text-[10px] uppercase tracking-[0.22em]"
          style={{
            color:
              status === "idle"
                ? "var(--fg-soft)"
                : CHARACTERS.aegis.accent,
          }}
        >
          {status}
        </p>
      </figcaption>
    </figure>
  );
}
