"use client";

/**
 * Shared module-level streaming store for an encounter.
 *
 * The previous implementation had each of the six island pages call
 * /analyze/sync on mount. With a real GitHub URL that endpoint blocks for
 * 1–10+ minutes (six Granite searchers + validator + per-finding voice
 * rewrites) and there was no timeout, no progress, and no error UI — the
 * page just spun. Worse, each island fired its own duplicate request.
 *
 * This store opens ONE SSE connection per analysis source (GitHub URL or
 * fixture name) and fans the per-character events out to whichever islands
 * are subscribed. Each character_complete event lands immediately in the
 * relevant character's slot, so the panel shows findings as soon as that
 * agent's searcher + voice rewriter return — instead of waiting for the
 * whole council.
 */

import type { CharacterId, Finding } from "@/types/encounter";
import type { BackendEncounterResult } from "./adapter";
import { adaptEncounterResult, adaptFinding } from "./adapter";

const ALL_CHARACTERS: CharacterId[] = [
  "aegis",
  "schema",
  "pixel",
  "atlas",
  "echo",
  "codex",
];

export type CharacterStatus = "idle" | "working" | "done" | "error";

export interface CharacterSlot {
  status: CharacterStatus;
  findings: Finding[];
  error?: string;
}

export interface EncounterStoreState {
  source: string;
  /** Wallclock ms when the stream was opened — for elapsed timers. */
  startedAt: number;
  /** "connecting" until the first character_started arrives. */
  phase: "connecting" | "streaming" | "complete" | "error";
  /** Backend-supplied PR metadata. Populated by the `started` event. */
  prMeta: {
    repo: string;
    pr_number: number;
    title: string;
    diff_stats: { files_changed: number; additions: number; deletions: number };
  };
  characters: Record<CharacterId, CharacterSlot>;
  /** Top-level error (failed to even start). Per-character errors live in slots. */
  error: string | null;
  /** Final adapted encounter once the `complete` event lands. */
  final: ReturnType<typeof adaptEncounterResult> | null;
}

type Listener = (state: EncounterStoreState) => void;

// Hard cap so a hung backend connection doesn't keep the UI in a loading
// limbo forever. Granite searchers + voice rewriters can be slow; 5 min is
// the same ceiling watsonx itself enforces per request.
const STREAM_HARD_TIMEOUT_MS = 5 * 60 * 1000;

interface SessionInternals {
  state: EncounterStoreState;
  listeners: Set<Listener>;
  abort: AbortController;
  timeoutId: number | null;
}

// Keyed by `source` (GitHub URL or fixture name). One session per source.
const sessions = new Map<string, SessionInternals>();

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

function freshSlot(): CharacterSlot {
  return { status: "idle", findings: [] };
}

function freshState(source: string): EncounterStoreState {
  return {
    source,
    startedAt: Date.now(),
    phase: "connecting",
    prMeta: {
      repo: parseRepo(source),
      pr_number: 0,
      title: "Convening the council…",
      diff_stats: { files_changed: 0, additions: 0, deletions: 0 },
    },
    characters: Object.fromEntries(
      ALL_CHARACTERS.map((id) => [id, freshSlot()]),
    ) as Record<CharacterId, CharacterSlot>,
    error: null,
    final: null,
  };
}

function parseRepo(source: string): string {
  if (!source.includes("github.com")) return "fixture";
  const m = source.match(/github\.com\/([^/]+\/[^/]+)/);
  return m ? m[1] : "unknown/repo";
}

function notify(session: SessionInternals) {
  for (const l of session.listeners) {
    try {
      l(session.state);
    } catch (err) {
      console.error("encounter-store listener threw", err);
    }
  }
}

function buildRequestPayload(source: string) {
  if (source.includes("github.com")) {
    return { github_url: source };
  }
  // fixture name (pr1/pr2/pr3)
  return {
    pr_number: 1,
    repo_owner: "dummy",
    repo_name: "dummy",
    use_fixture: source,
  };
}

function applyStarted(
  session: SessionInternals,
  data: { pr_number: number; pr_title: string; pr_author?: string },
) {
  session.state = {
    ...session.state,
    phase: "streaming",
    prMeta: {
      ...session.state.prMeta,
      pr_number: data.pr_number,
      title: data.pr_title,
    },
  };
  notify(session);
}

function applyCharacterStarted(session: SessionInternals, id: CharacterId) {
  const prev = session.state.characters[id];
  if (prev.status === "working") return;
  session.state = {
    ...session.state,
    characters: {
      ...session.state.characters,
      [id]: { ...prev, status: "working" },
    },
  };
  notify(session);
}

function applyCharacterComplete(
  session: SessionInternals,
  id: CharacterId,
  rawFindings: BackendEncounterResult["findings"],
) {
  const findings = rawFindings.map(adaptFinding);
  session.state = {
    ...session.state,
    characters: {
      ...session.state.characters,
      [id]: { status: "done", findings },
    },
  };
  notify(session);
}

function applyCharacterError(
  session: SessionInternals,
  id: CharacterId,
  error: string,
) {
  session.state = {
    ...session.state,
    characters: {
      ...session.state.characters,
      [id]: { status: "error", findings: [], error },
    },
  };
  notify(session);
}

function applyComplete(
  session: SessionInternals,
  data: BackendEncounterResult,
) {
  const adapted = adaptEncounterResult(
    data,
    session.state.source.includes("github.com") ? session.state.source : undefined,
  );

  // Make sure every character ends up in a terminal state — if the backend
  // never emitted a character_complete (no findings, no error), promote
  // working/idle slots to "done" with empty findings so islands don't spin.
  const characters = { ...session.state.characters };
  for (const id of ALL_CHARACTERS) {
    const slot = characters[id];
    if (slot.status === "working" || slot.status === "idle") {
      characters[id] = { status: "done", findings: slot.findings };
    }
  }

  session.state = {
    ...session.state,
    phase: "complete",
    prMeta: adapted.pr_meta,
    characters,
    final: adapted,
  };
  notify(session);
  clearTimeoutSafely(session);
}

function applyTopLevelError(session: SessionInternals, message: string) {
  const characters = { ...session.state.characters };
  for (const id of ALL_CHARACTERS) {
    const slot = characters[id];
    if (slot.status === "idle" || slot.status === "working") {
      characters[id] = { status: "error", findings: [], error: message };
    }
  }
  session.state = {
    ...session.state,
    phase: "error",
    characters,
    error: message,
  };
  notify(session);
  clearTimeoutSafely(session);
}

function clearTimeoutSafely(session: SessionInternals) {
  if (session.timeoutId !== null) {
    window.clearTimeout(session.timeoutId);
    session.timeoutId = null;
  }
}

async function runStream(session: SessionInternals) {
  const apiUrl = getApiUrl();
  const url = `${apiUrl}/analyze/stream`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(buildRequestPayload(session.state.source)),
      signal: session.abort.signal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => response.statusText);
      applyTopLevelError(
        session,
        `Council unreachable (${response.status}): ${text || response.statusText}`,
      );
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      applyTopLevelError(session, "Stream body unreadable.");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let currentEvent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      // SSE frames are separated by blank lines; lines start with
      // "event:" or "data:". We parse line-by-line for robustness.
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        const rawLine = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);
        const line = rawLine.replace(/\r$/, "");

        if (line === "") {
          // Frame boundary — reset event name for the next frame
          currentEvent = "";
          continue;
        }
        if (line.startsWith(":")) continue; // comment / heartbeat
        if (line.startsWith("event:")) {
          currentEvent = line.slice(6).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          const dataStr = line.slice(5).trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            dispatchEvent(session, currentEvent, data);
          } catch (err) {
            console.error("SSE parse error", err, dataStr);
          }
        }
      }
    }

    // Stream ended without a `complete` event — treat as soft failure
    if (
      session.state.phase !== "complete" &&
      session.state.phase !== "error"
    ) {
      applyTopLevelError(
        session,
        "The council was interrupted before completing its verdict.",
      );
    }
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === "AbortError") {
      // Caller closed the session — leave state as-is.
      return;
    }
    const message =
      err instanceof Error ? err.message : "Unknown streaming error";
    applyTopLevelError(session, message);
  }
}

function dispatchEvent(
  session: SessionInternals,
  name: string,
  data: { [key: string]: unknown },
) {
  switch (name) {
    case "started":
      applyStarted(session, data as { pr_number: number; pr_title: string });
      break;
    case "character_started":
      applyCharacterStarted(session, data.character_id as CharacterId);
      break;
    case "character_complete":
      applyCharacterComplete(
        session,
        data.character_id as CharacterId,
        (data.findings as BackendEncounterResult["findings"]) || [],
      );
      break;
    case "character_error":
      applyCharacterError(
        session,
        data.character_id as CharacterId,
        String(data.error ?? "Unknown character error"),
      );
      break;
    case "complete":
      applyComplete(session, data as unknown as BackendEncounterResult);
      break;
    case "error":
      applyTopLevelError(
        session,
        String(
          (data as { message?: string }).message ??
            "Backend reported an unknown error.",
        ),
      );
      break;
    default:
      // ignore unknown events
      break;
  }
}

function startSession(source: string): SessionInternals {
  const session: SessionInternals = {
    state: freshState(source),
    listeners: new Set(),
    abort: new AbortController(),
    timeoutId: null,
  };

  session.timeoutId = window.setTimeout(() => {
    if (
      session.state.phase !== "complete" &&
      session.state.phase !== "error"
    ) {
      session.abort.abort();
      applyTopLevelError(
        session,
        "The council took too long to respond. Try again in a moment.",
      );
    }
  }, STREAM_HARD_TIMEOUT_MS);

  // Fire off the stream — don't await; the function pushes state via
  // notify() as events arrive.
  void runStream(session);

  return session;
}

/** Subscribe to (and lazily start) an encounter stream for the given source. */
export function subscribe(
  source: string,
  listener: Listener,
): { unsubscribe: () => void; getState: () => EncounterStoreState } {
  let session = sessions.get(source);
  if (!session) {
    session = startSession(source);
    sessions.set(source, session);
  }
  session.listeners.add(listener);
  // Push current state synchronously so the caller doesn't render an
  // empty placeholder waiting for the next event tick.
  listener(session.state);

  return {
    unsubscribe: () => {
      const s = sessions.get(source);
      if (!s) return;
      s.listeners.delete(listener);
      // We deliberately do NOT tear the session down when listeners hit 0 —
      // the user navigating between islands would otherwise cancel a slow
      // analysis mid-flight. The session lives until `clearAll()`.
    },
    getState: () => session!.state,
  };
}

/** Clear all sessions (e.g. when the user starts a brand new PR analysis). */
export function clearAll(): void {
  for (const session of sessions.values()) {
    clearTimeoutSafely(session);
    session.abort.abort();
    session.listeners.clear();
  }
  sessions.clear();
}

/** Internal: snapshot current state for a source (or null). Used by tests/debug. */
export function peek(source: string): EncounterStoreState | null {
  return sessions.get(source)?.state ?? null;
}
