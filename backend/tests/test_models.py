"""Test Pydantic models for data validation."""
import pytest
from app.models import (
    Finding,
    FindingRaw,
    FindingValidated,
    EncounterResult,
    CharacterDialogue,
    SSEEvent,
    AnalyzeRequest
)


def test_finding_raw_model():
    """Test FindingRaw model validation."""
    finding = FindingRaw(
        id="f1",
        type="security",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        suggestion="Use parameterized queries"
    )
    
    assert finding.id == "f1"
    assert finding.severity == "critical"
    assert finding.line_start == 42


def test_finding_validated_model():
    """Test FindingValidated model with noise_filtered."""
    finding = FindingValidated(
        id="f1",
        type="security",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        suggestion="Use parameterized queries",
        noise_filtered=False,
        validator_reasoning="Legitimate security issue"
    )
    
    assert finding.noise_filtered is False
    assert finding.validator_reasoning is not None


def test_finding_complete_model():
    """Test complete Finding model with character assignment."""
    finding = Finding(
        id="f1",
        type="security",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        suggestion="Use parameterized queries",
        noise_filtered=False,
        validator_reasoning="Legitimate security issue",
        character_id="aegis",
        character_name="Aegis",
        damage=85,
        damage_type="crit_hit",
        voiced_message="⚔️ CRITICAL BREACH DETECTED! This SQL injection..."
    )
    
    assert finding.character_id == "aegis"
    assert finding.damage == 85
    assert finding.damage_type == "crit_hit"


def test_character_dialogue_model():
    """Test CharacterDialogue model."""
    dialogue = CharacterDialogue(
        character_id="aegis",
        character_name="Aegis",
        target_character_id="schema",
        target_character_name="Schema",
        message="Schema, I found a SQL injection. Can you verify the query structure?",
        dialogue_type="question"
    )
    
    assert dialogue.character_id == "aegis"
    assert dialogue.target_character_id == "schema"
    assert dialogue.dialogue_type == "question"


def test_encounter_result_model():
    """Test complete EncounterResult model."""
    result = EncounterResult(
        pr_number=123,
        pr_title="Add user authentication",
        pr_author="developer",
        findings=[],
        dialogues=[],
        total_damage=85,
        hp_remaining=15,
        verdict="blocked",
        summary="Critical security issues found"
    )
    
    assert result.pr_number == 123
    assert result.total_damage == 85
    assert result.verdict == "blocked"


def test_sse_event_model():
    """Test SSEEvent model."""
    event = SSEEvent(
        event="finding",
        data={"id": "f1", "severity": "critical"}
    )
    
    assert event.event == "finding"
    assert event.data["id"] == "f1"


def test_analyze_request_model():
    """Test AnalyzeRequest model."""
    request = AnalyzeRequest(
        pr_number=123,
        repo_owner="test",
        repo_name="repo",
        use_fixture="pr1"
    )
    
    assert request.pr_number == 123
    assert request.use_fixture == "pr1"


def test_damage_type_validation():
    """Test damage_type enum validation."""
    valid_types = ["crit_hit", "hit", "graze", "whisper"]
    
    for damage_type in valid_types:
        finding = Finding(
            id="f1",
            type="security",
            severity="critical",
            title="Test",
            description="Test",
            file_path="test.ts",
            line_start=1,
            line_end=1,
            code_snippet="test",
            suggestion="test",
            noise_filtered=False,
            validator_reasoning="test",
            character_id="aegis",
            character_name="Aegis",
            damage=50,
            damage_type=damage_type,
            voiced_message="test"
        )
        assert finding.damage_type == damage_type


def test_verdict_validation():
    """Test verdict enum validation."""
    valid_verdicts = ["blocked", "changes_required", "approved"]
    
    for verdict in valid_verdicts:
        result = EncounterResult(
            pr_number=123,
            pr_title="Test",
            pr_author="test",
            findings=[],
            dialogues=[],
            total_damage=50,
            hp_remaining=50,
            verdict=verdict,
            summary="Test"
        )
        assert result.verdict == verdict


# Made with Bob