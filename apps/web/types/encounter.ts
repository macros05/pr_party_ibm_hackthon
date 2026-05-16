/**
 * Contrato JSON entre el backend (FastAPI + Bob + Granite) y el frontend.
 * Origen: SPEC.md §4. Cualquier cambio aquí debe sincronizarse con el backend.
 */

export type CharacterId =
  | "aegis"
  | "schema"
  | "pixel"
  | "atlas"
  | "echo"
  | "codex";

export type CharacterName =
  | "Aegis"
  | "Schema"
  | "Pixel"
  | "Atlas"
  | "Echo"
  | "Codex";

export type CharacterClass =
  | "Security Paladin"
  | "Database Mage"
  | "UX Bard"
  | "Architecture Ranger"
  | "Test Cleric"
  | "Documentation Scribe";

/**
 * Ciclo de vida de un personaje durante el encuentro.
 * `idle` antes de entrar, `thinking` mientras Bob procesa, `active` cuando
 * empieza a publicar findings vía SSE, `done` al terminar su turno.
 */
export type CharacterStatus = "idle" | "thinking" | "active" | "done";

export type Severity = "critical" | "high" | "medium" | "low" | "none";

export type FindingAction =
  | "crit_hit"
  | "hit"
  | "graze"
  | "whisper"
  | "miss"
  | "parry";

export type Verdict = "blocked" | "changes_required" | "approved_with_notes";

export interface DiffStats {
  files_changed: number;
  additions: number;
  deletions: number;
}

export interface PrMeta {
  repo: string;
  pr_number: number;
  title: string;
  diff_stats: DiffStats;
}

export interface EncounterMeta {
  started_at: string;
  duration_ms: number;
  pr_hp_start: number;
  pr_hp_end: number;
  verdict: Verdict;
}

/**
 * `category` es libre: el JSON ejemplo usa subcategorías (`"rce"`), no los
 * dominios del spec. Dominios sugeridos por personaje: security, db, ux,
 * architecture, tests, docs.
 */
export interface Finding {
  id: string;
  severity: Severity;
  action: FindingAction;
  damage: number;
  file: string;
  line_start: number;
  line_end: number;
  category: string;
  title: string;
  explanation_raw: string;
  explanation_voiced: string;
  suggested_patch?: string;
  references: string[];
}

export interface Character {
  id: CharacterId;
  name: CharacterName;
  class: CharacterClass;
  level: number;
  status: CharacterStatus;
  findings: Finding[];
}

export interface DialogueExchange {
  from: CharacterId;
  text: string;
}

export interface Dialogue {
  between: [CharacterId, CharacterId];
  topic: string;
  exchanges: DialogueExchange[];
}

export interface EncounterPayload {
  pr_meta: PrMeta;
  encounter: EncounterMeta;
  characters: Character[];
  dialogues: Dialogue[];
}

/**
 * Stream SSE durante el encuentro. El snapshot final (`EncounterPayload`)
 * se reconstruye a partir de estos eventos, o llega de golpe si el backend
 * prefiere resolver el encuentro como una sola respuesta.
 */
export type EncounterEvent =
  | {
      type: "encounter_start";
      encounter_id: string;
      pr_meta: PrMeta;
      pr_hp_start: number;
    }
  | {
      type: "character_status";
      character_id: CharacterId;
      status: CharacterStatus;
    }
  | {
      type: "finding";
      character_id: CharacterId;
      finding: Finding;
    }
  | {
      type: "dialogue";
      dialogue: Dialogue;
    }
  | {
      type: "pr_hp";
      hp: number;
      delta: number;
    }
  | {
      type: "encounter_end";
      encounter: EncounterMeta;
    };
