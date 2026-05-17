"""
PR analysis orchestrator - coordinates the entire Mythos pipeline.

Flow:
1. Load PR diff + context
2. Bob Searcher Pass → findings_raw
3. Bob Validator Pass → findings_validated
4. Classifier → assign characters
5. Voice Rewriter (Granite) → add character_dialogue
6. Calculate damage & verdict
7. Generate character dialogues
8. Return EncounterResult
"""
import asyncio
from datetime import datetime
from typing import Any, AsyncGenerator

from app.clients.bob_client import get_bob_client
from app.logging_config import get_logger
from app.models import (
    CharacterDialogue,
    EncounterResult,
    Finding,
    FindingValidated,
    Verdict,
)
from app.services.classifier import get_classifier
from app.services.diff_grounding import (
    DiffIndex,
    find_snippet_line,
    is_grounded,
    parse_diff,
)
from app.services.voice_rewriter import get_voice_rewriter

logger = get_logger(__name__)


# Per-character single source of truth: maps the prompt file used by the
# searcher to (id_prefix, category, character_id). The streaming pipeline
# uses this so each character can run, fail, and emit results independently.
CHARACTER_PIPELINE: list[tuple[str, str, str, str]] = [
    ("character_aegis.md",  "A",  "security",      "aegis"),
    ("character_schema.md", "SC", "database",      "schema"),
    ("character_pixel.md",  "P",  "ux",            "pixel"),
    ("character_atlas.md",  "AT", "architecture",  "atlas"),
    ("character_echo.md",   "E",  "tests",         "echo"),
    ("character_codex.md",  "C",  "documentation", "codex"),
]


_SEVERITY_DAMAGE = {"critical": 90, "high": 60, "medium": 30, "low": 10}
_SEVERITY_DAMAGE_TYPE = {
    "critical": "crit_hit",
    "high": "hit",
    "medium": "graze",
    "low": "whisper",
}


def _normalize_raw_to_validated(
    f: dict, category: str
) -> FindingValidated | None:
    """Convert a raw searcher dict into a FindingValidated, returning None on failure."""
    try:
        severity = f.get("severity", "low")
        return FindingValidated(
            id=f.get("id", "F000"),
            title=f.get("title", ""),
            description=f.get("explanation") or f.get("description", ""),
            severity=severity,
            damage=f.get("damage") or _SEVERITY_DAMAGE.get(severity, 10),
            damage_type=(
                f.get("damage_type")
                or _SEVERITY_DAMAGE_TYPE.get(severity, "whisper")
            ),
            file_path=f.get("file_path") or f.get("file", "unknown"),
            line_start=f.get("line_start", 1),
            line_end=f.get("line_end", 1),
            code_snippet=f.get("code_snippet", ""),
            category=category,
            validation_notes="",
        )
    except Exception as exc:
        logger.warning("normalize_validated_failed", error=str(exc), finding=str(f))
        return None


class PRAnalysisOrchestrator:
    """Orchestrates the complete PR analysis pipeline."""
    
    def __init__(self):
        self.bob = get_bob_client()
        self.classifier = get_classifier()
        self.voice_rewriter = get_voice_rewriter()
        logger.info("orchestrator_initialized")
    
    def _calculate_verdict(self, total_damage: int) -> Verdict:
        """
        Calculate PR verdict based on total damage.
        
        Rules:
        - ≥80 damage: blocked
        - 50-79 damage: changes_required
        - <50 damage: approved
        """
        if total_damage >= 80:
            return "blocked"
        elif total_damage >= 50:
            return "changes_required"
        else:
            return "approved"
    
    def _generate_dialogues(self, findings: list[Finding]) -> list[CharacterDialogue]:
        """
        Generate character dialogues based on finding patterns.
        
        For demo, we'll create dialogues when:
        - Multiple findings from same character (self-reflection)
        - Related findings from different characters (collaboration)
        """
        dialogues: list[CharacterDialogue] = []
        
        # Group findings by character
        by_character: dict[str, list[Finding]] = {}
        for finding in findings:
            if finding.character_id not in by_character:
                by_character[finding.character_id] = []
            by_character[finding.character_id].append(finding)
        
        # Create dialogues between characters with multiple findings
        characters_with_multiple = [
            char for char, finds in by_character.items() if len(finds) >= 2
        ]
        
        if len(characters_with_multiple) >= 2:
            # Create a dialogue between first two characters
            char1 = characters_with_multiple[0]
            char2 = characters_with_multiple[1]
            finding1 = by_character[char1][0]
            finding2 = by_character[char2][0]
            
            dialogue = CharacterDialogue(
                finding_id=finding1.id,
                character_1=char1,  # type: ignore
                dialogue_1=f"I've discovered {finding1.title.lower()}. This requires immediate attention!",
                character_2=char2,  # type: ignore
                dialogue_2=f"Indeed! And I've found {finding2.title.lower()} as well. These issues compound each other."
            )
            dialogues.append(dialogue)
        
        logger.info(
            "dialogues_generated",
            dialogue_count=len(dialogues)
        )
        
        return dialogues
    
    async def analyze_pr(
        self,
        pr_number: int,
        pr_title: str,
        pr_author: str,
        diff: str,
        package_json: str,
        context_files: dict[str, str]
    ) -> EncounterResult:
        """
        Analyze a PR through the complete pipeline.
        
        Args:
            pr_number: GitHub PR number
            pr_title: PR title
            pr_author: PR author username
            diff: Git diff content
            package_json: package.json content
            context_files: Dict of filename -> content
        
        Returns:
            Complete encounter result with voiced findings
        """
        logger.info(
            "pr_analysis_start",
            pr_number=pr_number,
            diff_length=len(diff),
            context_files_count=len(context_files)
        )
        
        # Step 1: Bob Searcher Pass
        logger.info("step_1_searcher_pass")
        findings_raw = await self.bob.searcher_pass(
            diff=diff,
            package_json=package_json,
            context_files=context_files
        )
        
        if not findings_raw:
            logger.info("no_findings_detected")
            # Return clean PR result
            return EncounterResult(
                pr_number=pr_number,
                pr_title=pr_title,
                pr_author=pr_author,
                verdict="approved",
                total_damage=0,
                remaining_hp=100,
                findings=[],
                dialogues=[],
                analysis_timestamp=datetime.utcnow().isoformat()
            )
        
        # Step 2: Bob Validator Pass
        logger.info("step_2_validator_pass", findings_raw_count=len(findings_raw))
        findings_validated = await self.bob.validator_pass(
            diff=diff,
            findings_raw=findings_raw
        )
        
        if not findings_validated:
            logger.info("all_findings_filtered_out")
            return EncounterResult(
                pr_number=pr_number,
                pr_title=pr_title,
                pr_author=pr_author,
                verdict="approved",
                total_damage=0,
                remaining_hp=100,
                findings=[],
                dialogues=[],
                analysis_timestamp=datetime.utcnow().isoformat()
            )
        
        # Step 3: Classify findings
        logger.info("step_3_classify_findings", findings_validated_count=len(findings_validated))
        classified_findings = self.classifier.classify_findings(findings_validated)
        
        # Step 4: Voice rewrite with Granite
        logger.info("step_4_voice_rewrite")
        voiced_findings = await self.voice_rewriter.rewrite_findings(classified_findings)
        
        # Step 5: Calculate damage and verdict
        total_damage = sum(f.damage for f in voiced_findings)
        remaining_hp = max(0, 100 - total_damage)
        verdict = self._calculate_verdict(total_damage)
        
        logger.info(
            "damage_calculated",
            total_damage=total_damage,
            remaining_hp=remaining_hp,
            verdict=verdict
        )
        
        # Step 6: Generate character dialogues
        logger.info("step_5_generate_dialogues")
        dialogues = self._generate_dialogues(voiced_findings)
        
        # Step 7: Build final result
        result = EncounterResult(
            pr_number=pr_number,
            pr_title=pr_title,
            pr_author=pr_author,
            verdict=verdict,
            total_damage=total_damage,
            remaining_hp=remaining_hp,
            findings=voiced_findings,
            dialogues=dialogues,
            analysis_timestamp=datetime.utcnow().isoformat()
        )
        
        logger.info(
            "pr_analysis_complete",
            pr_number=pr_number,
            verdict=verdict,
            findings_count=len(voiced_findings),
            total_damage=total_damage
        )

        return result

    async def _run_single_character_pipeline(
        self,
        prompt_file: str,
        id_prefix: str,
        category: str,
        character_id: str,
        diff: str,
        diff_index: DiffIndex,
    ) -> tuple[str, list[Finding], str | None]:
        """
        Run searcher + voice rewriter for ONE character end-to-end.

        Returns (character_id, finished_findings, error_message_or_None).
        Voice rewrites for that character's findings are awaited in parallel
        so the per-character pipeline finishes as fast as its slowest finding.
        Skips the LLM validator pass (which would force us to wait for ALL
        searchers before any character can finish, breaking the streaming UX)
        and replaces it with a deterministic grounding filter that drops any
        finding whose file/line/snippet does not exist in `diff_index`. That
        kills hallucinations like `frontend/UserDashboard.tsx:123` without
        adding a single extra LLM call.
        """
        try:
            _, raw_findings = await self.bob._run_character_searcher(
                prompt_file, diff, id_prefix, category
            )

            validated: list[FindingValidated] = []
            dropped: list[str] = []
            for raw in raw_findings:
                normalized = _normalize_raw_to_validated(raw, category)
                if normalized is None:
                    continue
                grounded, reason = is_grounded(
                    file_path=normalized.file_path,
                    line_start=normalized.line_start,
                    line_end=normalized.line_end,
                    code_snippet=normalized.code_snippet,
                    index=diff_index,
                )
                if not grounded:
                    dropped.append(reason)
                    continue

                # Correct line drift: the model frequently misreports
                # line_start by 1-3 lines. If we can find the snippet at a
                # specific line, snap line_start/line_end to it so the
                # finding actually navigates to the right place in the UI.
                real_line = find_snippet_line(
                    snippet=normalized.code_snippet,
                    file=normalized.file_path,
                    index=diff_index,
                    hint_line=normalized.line_start,
                )
                if real_line is not None and real_line != normalized.line_start:
                    width = max(0, normalized.line_end - normalized.line_start)
                    normalized = normalized.model_copy(
                        update={
                            "line_start": real_line,
                            "line_end": real_line + width,
                        }
                    )

                validated.append(normalized)

            if dropped:
                logger.info(
                    "character_grounding_filter",
                    character_id=character_id,
                    kept=len(validated),
                    dropped=len(dropped),
                    reasons=dropped[:10],
                )

            if not validated:
                logger.info(
                    "character_pipeline_no_findings",
                    character_id=character_id,
                )
                return character_id, [], None

            # Voice rewrite — fan out, each call is its own watsonx round-trip
            dialogue_results = await asyncio.gather(
                *(
                    self.voice_rewriter.rewrite_finding(character_id, fv)  # type: ignore[arg-type]
                    for fv in validated
                ),
                return_exceptions=True,
            )

            finished: list[Finding] = []
            for fv, dialogue in zip(validated, dialogue_results):
                voiced = (
                    dialogue
                    if isinstance(dialogue, str) and dialogue.strip()
                    else fv.description
                )
                finished.append(
                    Finding(
                        id=fv.id,
                        title=fv.title,
                        description=fv.description,
                        severity=fv.severity,
                        damage=fv.damage,
                        damage_type=fv.damage_type,
                        file_path=fv.file_path,
                        line_start=fv.line_start,
                        line_end=fv.line_end,
                        code_snippet=fv.code_snippet,
                        character_id=character_id,  # type: ignore[arg-type]
                        character_dialogue=voiced,
                    )
                )

            logger.info(
                "character_pipeline_complete",
                character_id=character_id,
                findings_count=len(finished),
            )
            return character_id, finished, None

        except Exception as exc:
            logger.error(
                "character_pipeline_failed",
                character_id=character_id,
                error=str(exc),
                error_type=type(exc).__name__,
            )
            return character_id, [], str(exc)

    async def analyze_pr_streaming(
        self,
        pr_number: int,
        pr_title: str,
        pr_author: str,
        diff: str,
        package_json: str,
        context_files: dict[str, str],
    ) -> AsyncGenerator[dict, None]:
        """
        Run the per-character pipeline and yield events as each character finishes.

        Event shape (each is a dict with `event` + `data`):
          - {"event": "started",            "data": {pr_number, pr_title, pr_author, characters: [...]}}
          - {"event": "character_started",  "data": {"character_id": id}}
          - {"event": "character_complete", "data": {"character_id": id, "findings": [...]}}
          - {"event": "character_error",    "data": {"character_id": id, "error": str}}
          - {"event": "complete",           "data": EncounterResult.model_dump()}

        Failures in one character do NOT abort the others — they emit
        `character_error` and the remaining characters continue.
        """
        logger.info(
            "stream_analysis_start",
            pr_number=pr_number,
            diff_length=len(diff),
        )

        # Parse the diff once. Every per-character pipeline reuses this index
        # to reject findings the model invented (file paths not in the diff,
        # line numbers outside added hunks, snippets that don't appear).
        diff_index = parse_diff(diff)
        logger.info(
            "diff_indexed",
            files=len(diff_index.files),
            added_lines=sum(len(v) for v in diff_index.added_lines.values()),
        )

        all_character_ids = [c[3] for c in CHARACTER_PIPELINE]

        yield {
            "event": "started",
            "data": {
                "pr_number": pr_number,
                "pr_title": pr_title,
                "pr_author": pr_author,
                "characters": all_character_ids,
            },
        }

        # Tell the client which characters are "working" up front so every
        # island can swap to its analyzing state immediately.
        for char_id in all_character_ids:
            yield {
                "event": "character_started",
                "data": {"character_id": char_id},
            }

        # Launch all six character pipelines. We await with as_completed so
        # findings stream out in the order each pipeline finishes, not in a
        # fixed character order — fastest character shows up first.
        tasks = [
            asyncio.create_task(
                self._run_single_character_pipeline(
                    prompt_file=prompt_file,
                    id_prefix=id_prefix,
                    category=category,
                    character_id=character_id,
                    diff=diff,
                    diff_index=diff_index,
                )
            )
            for (prompt_file, id_prefix, category, character_id) in CHARACTER_PIPELINE
        ]

        all_findings: list[Finding] = []

        try:
            for coro in asyncio.as_completed(tasks):
                character_id, findings, error = await coro
                if error is not None:
                    yield {
                        "event": "character_error",
                        "data": {
                            "character_id": character_id,
                            "error": error,
                        },
                    }
                    continue

                all_findings.extend(findings)
                yield {
                    "event": "character_complete",
                    "data": {
                        "character_id": character_id,
                        "findings": [f.model_dump() for f in findings],
                    },
                }
        except asyncio.CancelledError:
            # Client disconnected — cancel any in-flight tasks so we don't
            # keep burning watsonx tokens for a dead session.
            for t in tasks:
                t.cancel()
            raise

        total_damage = sum(f.damage for f in all_findings)
        remaining_hp = max(0, 100 - total_damage)
        verdict = self._calculate_verdict(total_damage)

        result = EncounterResult(
            pr_number=pr_number,
            pr_title=pr_title,
            pr_author=pr_author,
            verdict=verdict,
            total_damage=total_damage,
            remaining_hp=remaining_hp,
            findings=all_findings,
            dialogues=self._generate_dialogues(all_findings),
            analysis_timestamp=datetime.utcnow().isoformat(),
        )

        logger.info(
            "stream_analysis_complete",
            pr_number=pr_number,
            verdict=verdict,
            findings_count=len(all_findings),
            total_damage=total_damage,
        )

        yield {"event": "complete", "data": result.model_dump()}


# Global orchestrator instance
_orchestrator: PRAnalysisOrchestrator | None = None


def get_orchestrator() -> PRAnalysisOrchestrator:
    """Get or create global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PRAnalysisOrchestrator()
    return _orchestrator

# Made with Bob
