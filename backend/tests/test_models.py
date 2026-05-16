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
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        damage=85,
        damage_type="crit_hit",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`"
    )
    
    assert finding.id == "f1"
    assert finding.severity == "critical"
    assert finding.line_start == 42
    assert finding.damage == 85
    assert finding.damage_type == "crit_hit"


def test_finding_validated_model():
    """Test FindingValidated model with validation_notes."""
    finding = FindingValidated(
        id="f1",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        damage=85,
        damage_type="crit_hit",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        validation_notes="Legitimate security issue - confirmed SQL injection risk"
    )
    
    assert finding.validation_notes is not None
    assert "Legitimate security issue" in finding.validation_notes


def test_finding_complete_model():
    """Test complete Finding model with character assignment."""
    finding = Finding(
        id="f1",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized",
        damage=85,
        damage_type="crit_hit",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        character_id="aegis",
        character_dialogue="⚔️ CRITICAL BREACH DETECTED! This SQL injection leaves your database wide open to attackers!"
    )
    
    assert finding.character_id == "aegis"
    assert finding.damage == 85
    assert finding.damage_type == "crit_hit"
    assert "CRITICAL BREACH" in finding.character_dialogue


def test_character_dialogue_model():
    """Test CharacterDialogue model."""
    dialogue = CharacterDialogue(
        finding_id="f1",
        character_1="aegis",
        dialogue_1="Schema, I found a SQL injection. Can you verify the query structure?",
        character_2="schema",
        dialogue_2="Indeed, Aegis. This query bypasses all parameterization. The database layer is compromised."
    )
    
    assert dialogue.finding_id == "f1"
    assert dialogue.character_1 == "aegis"
    assert dialogue.character_2 == "schema"
    assert "SQL injection" in dialogue.dialogue_1


def test_encounter_result_model():
    """Test complete EncounterResult model."""
    result = EncounterResult(
        pr_number=123,
        pr_title="Add user authentication",
        pr_author="developer",
        findings=[],
        dialogues=[],
        total_damage=85,
        remaining_hp=15,
        verdict="blocked",
        analysis_timestamp="2026-05-15T23:54:00Z"
    )
    
    assert result.pr_number == 123
    assert result.total_damage == 85
    assert result.remaining_hp == 15
    assert result.verdict == "blocked"
    assert result.analysis_timestamp is not None


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
            severity="critical",
            title="Test",
            description="Test",
            damage=50,
            damage_type=damage_type,
            file_path="test.ts",
            line_start=1,
            line_end=1,
            code_snippet="test",
            character_id="aegis",
            character_dialogue="test message"
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
            remaining_hp=50,
            verdict=verdict,
            analysis_timestamp="2026-05-15T23:54:00Z"
        )
        assert result.verdict == verdict


# Made with Bob