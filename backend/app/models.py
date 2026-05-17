"""
Pydantic models for PR Party API.
These models match the JSON contract defined in PR_PARTY_SPEC.md section 4.
IMMUTABLE after hour 2 - any changes require frontend sync.
"""
from typing import Literal, Optional
from pydantic import BaseModel, Field


# Character IDs (must match frontend)
CharacterId = Literal["aegis", "schema", "pixel", "atlas", "echo", "codex"]

# Severity levels
Severity = Literal["critical", "high", "medium", "low"]

# Damage types for animations
DamageType = Literal["crit_hit", "hit", "graze", "whisper"]

# PR verdict
Verdict = Literal["blocked", "changes_required", "approved"]


class Finding(BaseModel):
    """Single code review finding from Bob analysis."""
    id: str = Field(..., description="Unique finding ID (e.g., 'F001')")
    title: str = Field(..., description="Short finding title")
    description: str = Field(..., description="Technical explanation")
    severity: Severity = Field(..., description="Issue severity level")
    damage: int = Field(..., ge=0, le=100, description="HP damage (0-100)")
    damage_type: DamageType = Field(..., description="Animation type")
    file_path: str = Field(..., description="Affected file path")
    line_start: int = Field(..., ge=1, description="Start line number")
    line_end: int = Field(..., ge=1, description="End line number")
    code_snippet: str = Field(..., description="Relevant code excerpt")
    character_id: CharacterId = Field(..., description="Assigned character")
    character_dialogue: str = Field(..., description="Character's voiced comment")


class CharacterDialogue(BaseModel):
    """Dialogue between two characters about a finding."""
    finding_id: str = Field(..., description="Related finding ID")
    character_1: CharacterId = Field(..., description="First character speaking")
    dialogue_1: str = Field(..., description="First character's line")
    character_2: CharacterId = Field(..., description="Second character responding")
    dialogue_2: str = Field(..., description="Second character's line")


class EncounterResult(BaseModel):
    """Complete PR review encounter result."""
    pr_number: int = Field(..., description="GitHub PR number")
    pr_title: str = Field(..., description="PR title")
    pr_author: str = Field(..., description="PR author username")
    verdict: Verdict = Field(..., description="Final review verdict")
    total_damage: int = Field(..., ge=0, description="Total HP damage dealt")
    remaining_hp: int = Field(..., ge=0, le=100, description="PR's remaining HP")
    findings: list[Finding] = Field(..., description="All validated findings")
    dialogues: list[CharacterDialogue] = Field(default_factory=list, description="Character interactions")
    analysis_timestamp: str = Field(..., description="ISO 8601 timestamp")


class FindingRaw(BaseModel):
    """Raw finding from Bob searcher pass (no character assignment)."""
    id: str
    title: str
    description: str
    severity: Severity
    damage: int = Field(ge=0, le=100)
    damage_type: DamageType
    file_path: str
    line_start: int = Field(ge=1)
    line_end: int = Field(ge=1)
    code_snippet: str
    category: str = Field(default="general", description="Category from model (security, database, ux, architecture, tests, documentation)")


class FindingValidated(FindingRaw):
    """Validated finding from Bob validator pass (still no character)."""
    validation_notes: Optional[str] = Field(None, description="Why this finding was kept/modified")


class SSEEvent(BaseModel):
    """Server-Sent Event structure for streaming."""
    event: Literal["finding", "dialogue", "complete", "error"]
    data: dict = Field(..., description="Event payload")


class AnalyzeRequest(BaseModel):
    """Request to analyze a PR."""
    pr_number: Optional[int] = Field(None, description="GitHub PR number")
    repo_owner: Optional[str] = Field(None, description="Repository owner")
    repo_name: Optional[str] = Field(None, description="Repository name")
    github_url: Optional[str] = Field(None, description="Full GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)")
    use_fixture: Optional[str] = Field(None, description="Fixture name for offline testing (pr1, pr2, pr3)")

# Made with Bob
