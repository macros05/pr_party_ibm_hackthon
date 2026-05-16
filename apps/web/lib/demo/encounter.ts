"use client";

import * as React from "react";
import type {
  CharacterId,
  EncounterEvent,
  EncounterPayload,
  Finding,
} from "@/types/encounter";

/**
 * Scripted demo encounter used while the backend isn't wired.
 * The runner replays this list of events with realistic timings so
 * the UI feels like it's reading an SSE stream.
 */

const PR_HP_START = 220;

export const DEMO_PAYLOAD: EncounterPayload = {
  pr_meta: {
    repo: "acme/payments-api",
    pr_number: 482,
    title: "feat(auth): rotate session tokens on privilege escalation",
    diff_stats: { files_changed: 14, additions: 612, deletions: 188 },
  },
  encounter: {
    started_at: "2026-05-16T09:42:00Z",
    duration_ms: 24_000,
    pr_hp_start: PR_HP_START,
    pr_hp_end: 38,
    verdict: "changes_required",
  },
  characters: [
    { id: "aegis",  name: "Aegis",  class: "Security Paladin",      level: 8, status: "idle", findings: [] },
    { id: "schema", name: "Schema", class: "Database Mage",         level: 7, status: "idle", findings: [] },
    { id: "pixel",  name: "Pixel",  class: "UX Bard",               level: 6, status: "idle", findings: [] },
    { id: "atlas",  name: "Atlas",  class: "Architecture Ranger",   level: 9, status: "idle", findings: [] },
    { id: "echo",   name: "Echo",   class: "Test Cleric",           level: 7, status: "idle", findings: [] },
    { id: "codex",  name: "Codex",  class: "Documentation Scribe",  level: 5, status: "idle", findings: [] },
  ],
  dialogues: [],
};

const F = (
  id: string,
  severity: Finding["severity"],
  action: Finding["action"],
  damage: number,
  file: string,
  line: number,
  category: string,
  title: string,
  voiced: string,
): Finding => ({
  id,
  severity,
  action,
  damage,
  file,
  line_start: line,
  line_end: line,
  category,
  title,
  explanation_raw: voiced,
  explanation_voiced: voiced,
  references: [],
});

interface ScriptStep {
  at: number; // ms from encounter_start
  event: EncounterEvent;
}

/**
 * Linear, deterministic script. Each finding triggers a `finding` event
 * plus a paired `pr_hp` event for the damage. Character status flips
 * idle → thinking → active → done as they take turns.
 */
export function buildScript(): ScriptStep[] {
  const steps: ScriptStep[] = [];

  // kickoff
  steps.push({
    at: 0,
    event: {
      type: "encounter_start",
      encounter_id: "demo-001",
      pr_meta: DEMO_PAYLOAD.pr_meta,
      pr_hp_start: PR_HP_START,
    },
  });

  // ── AEGIS — Security ─────────────────────────────────────────────
  steps.push({ at:   400, event: { type: "character_status", character_id: "aegis", status: "thinking" } });
  steps.push({ at:  1100, event: { type: "character_status", character_id: "aegis", status: "active" } });
  steps.push({
    at: 1500,
    event: {
      type: "finding",
      character_id: "aegis",
      finding: F(
        "aegis-1", "critical", "crit_hit", 48,
        "src/auth/session.ts", 137,
        "rce",
        "Session token forged with unverified HMAC",
        "Sin verificar la firma. Cualquiera puede inyectar un token.",
      ),
    },
  });
  steps.push({ at: 1600, event: { type: "pr_hp", hp: PR_HP_START - 48, delta: -48 } });

  steps.push({
    at: 3200,
    event: {
      type: "finding",
      character_id: "aegis",
      finding: F(
        "aegis-2", "high", "hit", 22,
        "src/auth/session.ts", 188,
        "secret",
        "Hardcoded fallback secret in production path",
        "Hay un secreto literal en el código. Rota y muévelo al vault.",
      ),
    },
  });
  steps.push({ at: 3300, event: { type: "pr_hp", hp: PR_HP_START - 70, delta: -22 } });
  steps.push({ at: 3900, event: { type: "character_status", character_id: "aegis", status: "done" } });

  // ── SCHEMA — Database ────────────────────────────────────────────
  steps.push({ at: 4200, event: { type: "character_status", character_id: "schema", status: "thinking" } });
  steps.push({ at: 4900, event: { type: "character_status", character_id: "schema", status: "active" } });
  steps.push({
    at: 5400,
    event: {
      type: "finding",
      character_id: "schema",
      finding: F(
        "schema-1", "high", "hit", 18,
        "migrations/2026_05_session_keys.sql", 12,
        "index",
        "Missing composite index on (user_id, rotated_at)",
        "Esta query va a hacer full scan en producción.",
      ),
    },
  });
  steps.push({ at: 5500, event: { type: "pr_hp", hp: PR_HP_START - 88, delta: -18 } });
  steps.push({
    at: 7000,
    event: {
      type: "finding",
      character_id: "schema",
      finding: F(
        "schema-2", "medium", "graze", 8,
        "migrations/2026_05_session_keys.sql", 27,
        "constraint",
        "NOT NULL added without backfill default",
        "Vas a romper inserts vivos. Backfill antes.",
      ),
    },
  });
  steps.push({ at: 7100, event: { type: "pr_hp", hp: PR_HP_START - 96, delta: -8 } });
  steps.push({ at: 7600, event: { type: "character_status", character_id: "schema", status: "done" } });

  // ── PIXEL — UX ───────────────────────────────────────────────────
  steps.push({ at: 7900, event: { type: "character_status", character_id: "pixel", status: "thinking" } });
  steps.push({ at: 8500, event: { type: "character_status", character_id: "pixel", status: "active" } });
  steps.push({
    at: 9000,
    event: {
      type: "finding",
      character_id: "pixel",
      finding: F(
        "pixel-1", "medium", "hit", 14,
        "ui/components/SessionExpiredModal.tsx", 42,
        "a11y",
        "Modal traps focus but never returns it",
        "El foco se queda perdido. Lectores de pantalla se atascan aquí.",
      ),
    },
  });
  steps.push({ at: 9100, event: { type: "pr_hp", hp: PR_HP_START - 110, delta: -14 } });
  steps.push({
    at: 10500,
    event: {
      type: "finding",
      character_id: "pixel",
      finding: F(
        "pixel-2", "low", "whisper", 4,
        "ui/components/SessionExpiredModal.tsx", 87,
        "copy",
        "Error copy uses 'Oops!' — out of voice",
        "El tono no encaja con el resto del producto.",
      ),
    },
  });
  steps.push({ at: 10600, event: { type: "pr_hp", hp: PR_HP_START - 114, delta: -4 } });
  steps.push({ at: 11100, event: { type: "character_status", character_id: "pixel", status: "done" } });

  // ── ATLAS — Architecture ─────────────────────────────────────────
  steps.push({ at: 11400, event: { type: "character_status", character_id: "atlas", status: "thinking" } });
  steps.push({ at: 12200, event: { type: "character_status", character_id: "atlas", status: "active" } });
  steps.push({
    at: 12700,
    event: {
      type: "finding",
      character_id: "atlas",
      finding: F(
        "atlas-1", "critical", "crit_hit", 32,
        "src/auth/session.ts", 73,
        "coupling",
        "Auth service now calls billing module directly",
        "Estás rompiendo la frontera. El billing no debería saber de auth.",
      ),
    },
  });
  steps.push({ at: 12800, event: { type: "pr_hp", hp: PR_HP_START - 146, delta: -32 } });
  steps.push({
    at: 14300,
    event: {
      type: "finding",
      character_id: "atlas",
      finding: F(
        "atlas-2", "medium", "hit", 12,
        "src/lib/feature-flags.ts", 9,
        "flag",
        "New rotation logic shipped without a kill switch",
        "Si esto explota en prod no hay forma de apagarlo rápido.",
      ),
    },
  });
  steps.push({ at: 14400, event: { type: "pr_hp", hp: PR_HP_START - 158, delta: -12 } });
  steps.push({ at: 14900, event: { type: "character_status", character_id: "atlas", status: "done" } });

  // ── ECHO — Tests ─────────────────────────────────────────────────
  steps.push({ at: 15200, event: { type: "character_status", character_id: "echo", status: "thinking" } });
  steps.push({ at: 16000, event: { type: "character_status", character_id: "echo", status: "active" } });
  steps.push({
    at: 16500,
    event: {
      type: "finding",
      character_id: "echo",
      finding: F(
        "echo-1", "high", "hit", 16,
        "test/auth/session.spec.ts", 0,
        "coverage",
        "Token rotation has zero tests",
        "Cero coverage en la ruta caliente. Pídeme cómo escribirlos.",
      ),
    },
  });
  steps.push({ at: 16600, event: { type: "pr_hp", hp: PR_HP_START - 174, delta: -16 } });
  steps.push({
    at: 18100,
    event: {
      type: "finding",
      character_id: "echo",
      finding: F(
        "echo-2", "low", "whisper", 3,
        "test/auth/session.spec.ts", 211,
        "flake",
        "Time-based test will be flaky in CI",
        "Esto va a fallar intermitente. Inyecta clock.",
      ),
    },
  });
  steps.push({ at: 18200, event: { type: "pr_hp", hp: PR_HP_START - 177, delta: -3 } });
  steps.push({ at: 18700, event: { type: "character_status", character_id: "echo", status: "done" } });

  // ── CODEX — Docs ─────────────────────────────────────────────────
  steps.push({ at: 19000, event: { type: "character_status", character_id: "codex", status: "thinking" } });
  steps.push({ at: 19800, event: { type: "character_status", character_id: "codex", status: "active" } });
  steps.push({
    at: 20300,
    event: {
      type: "finding",
      character_id: "codex",
      finding: F(
        "codex-1", "medium", "hit", 5,
        "docs/auth/SESSION.md", 1,
        "stale",
        "Doc still describes single-token model",
        "La documentación va a confundir a quien intente usar esto.",
      ),
    },
  });
  steps.push({ at: 20400, event: { type: "pr_hp", hp: PR_HP_START - 182, delta: -5 } });
  steps.push({ at: 21300, event: { type: "character_status", character_id: "codex", status: "done" } });

  // verdict
  steps.push({
    at: 22000,
    event: {
      type: "encounter_end",
      encounter: {
        ...DEMO_PAYLOAD.encounter,
        pr_hp_end: PR_HP_START - 182, // 38 — matches encounter.pr_hp_end above
      },
    },
  });

  return steps;
}

/* ============================================================
   Runtime state
   ============================================================ */

export interface BubbleEmit {
  /** unique key per emit so AnimatePresence can track each one */
  key: number;
  character_id: CharacterId;
  finding: Finding;
  /** when set, the originating viewport-px coords of the robot */
  originX?: number;
  originY?: number;
}

export interface XPEmit {
  key: number;
  character_id: CharacterId;
  amount: number;
  critical: boolean;
}

export interface RingEmit {
  key: number;
  character_id: CharacterId;
  critical: boolean;
}

export interface CritEmit {
  key: number;
  character_id: CharacterId;
}

export interface EncounterState {
  phase: "idle" | "running" | "done";
  prMeta: EncounterPayload["pr_meta"] | null;
  hp: number;
  hpMax: number;
  hpDelta: number;
  characters: Record<CharacterId, { status: import("@/types/encounter").CharacterStatus; findingsCount: number }>;
  /** every finding ever emitted, newest last — panel reads this */
  findings: Array<{ character_id: CharacterId; finding: Finding }>;
  bubbles: BubbleEmit[];
  xps: XPEmit[];
  rings: RingEmit[];
  crits: CritEmit[];
  verdict: import("@/types/encounter").Verdict | null;
  startedAt: number | null;
}

const INITIAL_STATE: EncounterState = {
  phase: "idle",
  prMeta: null,
  hp: PR_HP_START,
  hpMax: PR_HP_START,
  hpDelta: 0,
  characters: {
    aegis:  { status: "idle", findingsCount: 0 },
    schema: { status: "idle", findingsCount: 0 },
    pixel:  { status: "idle", findingsCount: 0 },
    atlas:  { status: "idle", findingsCount: 0 },
    echo:   { status: "idle", findingsCount: 0 },
    codex:  { status: "idle", findingsCount: 0 },
  },
  findings: [],
  bubbles: [],
  xps: [],
  rings: [],
  crits: [],
  verdict: null,
  startedAt: null,
};

/* ============================================================
   Hook
   ============================================================ */

export function useEncounterDemo() {
  const [state, setState] = React.useState<EncounterState>(INITIAL_STATE);
  const timeoutsRef = React.useRef<number[]>([]);
  const keyRef = React.useRef(0);

  const clear = React.useCallback(() => {
    for (const id of timeoutsRef.current) window.clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  const reset = React.useCallback(() => {
    clear();
    setState(INITIAL_STATE);
  }, [clear]);

  const start = React.useCallback(() => {
    clear();
    keyRef.current = 0;
    setState({ ...INITIAL_STATE, phase: "running", startedAt: Date.now() });

    const script = buildScript();
    for (const step of script) {
      const id = window.setTimeout(() => {
        const ev = step.event;
        setState((prev) => {
          const next: EncounterState = {
            ...prev,
            bubbles: prev.bubbles,
            xps: prev.xps,
            rings: prev.rings,
            crits: prev.crits,
          };
          switch (ev.type) {
            case "encounter_start": {
              next.prMeta = ev.pr_meta;
              next.hp = ev.pr_hp_start;
              next.hpMax = ev.pr_hp_start;
              return next;
            }
            case "character_status": {
              next.characters = {
                ...prev.characters,
                [ev.character_id]: {
                  ...prev.characters[ev.character_id],
                  status: ev.status,
                },
              };
              return next;
            }
            case "finding": {
              const k = ++keyRef.current;
              const isCrit = ev.finding.action === "crit_hit";
              next.findings = [
                ...prev.findings,
                { character_id: ev.character_id, finding: ev.finding },
              ];
              next.bubbles = [
                ...prev.bubbles,
                { key: k, character_id: ev.character_id, finding: ev.finding },
              ];
              next.xps = [
                ...prev.xps,
                { key: k, character_id: ev.character_id, amount: ev.finding.damage, critical: isCrit },
              ];
              next.rings = [
                ...prev.rings,
                { key: k, character_id: ev.character_id, critical: isCrit },
              ];
              if (isCrit) {
                next.crits = [...prev.crits, { key: k, character_id: ev.character_id }];
              }
              next.characters = {
                ...prev.characters,
                [ev.character_id]: {
                  ...prev.characters[ev.character_id],
                  findingsCount: prev.characters[ev.character_id].findingsCount + 1,
                },
              };
              return next;
            }
            case "pr_hp": {
              next.hp = ev.hp;
              next.hpDelta = ev.delta;
              return next;
            }
            case "encounter_end": {
              next.phase = "done";
              next.verdict = ev.encounter.verdict;
              return next;
            }
            default:
              return prev;
          }
        });
      }, step.at);
      timeoutsRef.current.push(id);
    }
  }, [clear]);

  /** Garbage-collect emit lists so AnimatePresence doesn't pile up forever. */
  const consumeBubble  = React.useCallback((key: number) => setState((s) => ({ ...s, bubbles: s.bubbles.filter((b) => b.key !== key) })), []);
  const consumeXP      = React.useCallback((key: number) => setState((s) => ({ ...s, xps:     s.xps.filter((x) => x.key !== key) })), []);
  const consumeRing    = React.useCallback((key: number) => setState((s) => ({ ...s, rings:   s.rings.filter((r) => r.key !== key) })), []);
  const consumeCrit    = React.useCallback((key: number) => setState((s) => ({ ...s, crits:   s.crits.filter((c) => c.key !== key) })), []);

  React.useEffect(() => clear, [clear]);

  return { state, start, reset, consumeBubble, consumeXP, consumeRing, consumeCrit };
}
