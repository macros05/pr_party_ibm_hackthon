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
from datetime import datetime
from typing import Any

from app.clients.bob_client import get_bob_client
from app.logging_config import get_logger
from app.models import (
    CharacterDialogue,
    EncounterResult,
    Finding,
    Verdict,
)
from app.services.classifier import get_classifier
from app.services.voice_rewriter import get_voice_rewriter

logger = get_logger(__name__)


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


# Global orchestrator instance
_orchestrator: PRAnalysisOrchestrator | None = None


def get_orchestrator() -> PRAnalysisOrchestrator:
    """Get or create global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = PRAnalysisOrchestrator()
    return _orchestrator

# Made with Bob
