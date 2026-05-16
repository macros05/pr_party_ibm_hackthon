/**
 * Adapter to map backend EncounterResult to frontend Finding format.
 * Handles schema differences between backend/app/models.py and types/encounter.ts
 */

import type { Finding, CharacterId, Verdict } from "@/types/encounter";

/**
 * Backend Finding shape (from backend/app/models.py)
 */
interface BackendFinding {
  id: string;
  title: string;
  description: string; // → explanation_raw
  severity: "critical" | "high" | "medium" | "low";
  damage: number;
  damage_type: "crit_hit" | "hit" | "graze" | "whisper"; // → action
  file_path: string; // → file
  line_start: number;
  line_end: number;
  code_snippet: string;
  character_id: CharacterId;
  character_dialogue: string; // → explanation_voiced
}

/**
 * Backend EncounterResult shape (from backend/app/models.py)
 */
export interface BackendEncounterResult {
  pr_number: number;
  pr_title: string;
  pr_author: string;
  verdict: "blocked" | "changes_required" | "approved";
  total_damage: number;
  remaining_hp: number; // 0-100 scale
  findings: BackendFinding[];
  dialogues: Array<{
    finding_id: string;
    character_1: CharacterId;
    dialogue_1: string;
    character_2: CharacterId;
    dialogue_2: string;
  }>;
  analysis_timestamp: string;
}

/**
 * Map backend Finding to frontend Finding.
 * Fills in missing fields with sensible defaults.
 */
export function adaptFinding(backendFinding: BackendFinding): Finding {
  return {
    id: backendFinding.id,
    severity: backendFinding.severity,
    action: backendFinding.damage_type, // damage_type → action
    damage: backendFinding.damage,
    file: backendFinding.file_path, // file_path → file
    line_start: backendFinding.line_start,
    line_end: backendFinding.line_end,
    category: inferCategory(backendFinding.character_id), // backend doesn't send category
    title: backendFinding.title,
    explanation_raw: backendFinding.description, // description → explanation_raw
    explanation_voiced: backendFinding.character_dialogue, // character_dialogue → explanation_voiced
    suggested_patch: undefined, // backend doesn't generate patches yet
    references: [], // backend doesn't send references
  };
}

/**
 * Infer category from character_id since backend doesn't send it.
 */
function inferCategory(characterId: CharacterId): string {
  const categoryMap: Record<CharacterId, string> = {
    aegis: "security",
    schema: "database",
    pixel: "ux",
    atlas: "architecture",
    echo: "tests",
    codex: "documentation",
  };
  return categoryMap[characterId] || "general";
}

/**
 * Map backend verdict to frontend verdict.
 * Backend uses "approved", frontend expects "approved_with_notes".
 */
export function adaptVerdict(backendVerdict: BackendEncounterResult["verdict"]): Verdict {
  if (backendVerdict === "approved") {
    return "approved_with_notes"; // backend "approved" → frontend "approved_with_notes"
  }
  return backendVerdict as Verdict;
}

/**
 * Scale backend HP (0-100) to frontend HP (0-220).
 * Frontend uses pr_hp_start: 220 in demo.
 */
export function scaleHP(backendHP: number, frontendMaxHP: number = 220): number {
  return Math.round((backendHP / 100) * frontendMaxHP);
}

/**
 * Full adapter: backend EncounterResult → frontend-compatible data.
 */
export function adaptEncounterResult(backend: BackendEncounterResult) {
  const frontendMaxHP = 220;
  const pr_hp_end = scaleHP(backend.remaining_hp, frontendMaxHP);
  const pr_hp_start = pr_hp_end + backend.total_damage;

  return {
    pr_meta: {
      repo: "unknown/repo", // backend doesn't send repo in EncounterResult
      pr_number: backend.pr_number,
      title: backend.pr_title,
      diff_stats: {
        files_changed: 0, // backend doesn't send diff_stats
        additions: 0,
        deletions: 0,
      },
    },
    encounter: {
      started_at: backend.analysis_timestamp,
      duration_ms: 0, // backend doesn't track duration
      pr_hp_start,
      pr_hp_end,
      verdict: adaptVerdict(backend.verdict),
    },
    findings: backend.findings.map(adaptFinding),
    // Backend dialogues are simpler; frontend expects different shape
    // For now, we'll skip dialogue adaptation (task 10 in TODO)
    dialogues: [],
  };
}

// Made with Bob
