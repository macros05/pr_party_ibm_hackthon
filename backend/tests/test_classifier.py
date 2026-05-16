"""Test character classifier service."""
import pytest
from app.services.classifier import FindingsClassifier
from app.models import FindingValidated


@pytest.fixture
def classifier():
    """Create classifier instance."""
    return FindingsClassifier()


def test_classify_security_finding(classifier):
    """Test classification of security finding to Aegis."""
    finding = FindingValidated(
        id="f1",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized in database query",
        damage=85,
        damage_type="crit_hit",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        validation_notes="Legitimate security issue - SQL injection confirmed"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "aegis"


def test_classify_database_finding(classifier):
    """Test classification of database finding to Schema."""
    finding = FindingValidated(
        id="f2",
        severity="high",
        title="N+1 query detected",
        description="Loop executes separate query for each item",
        damage=60,
        damage_type="hit",
        file_path="src/api.ts",
        line_start=10,
        line_end=15,
        code_snippet="for (const user of users) { await db.posts.find(user.id) }",
        validation_notes="Performance issue - N+1 query pattern confirmed"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "schema"


def test_classify_ux_finding(classifier):
    """Test classification of UX finding to Pixel."""
    finding = FindingValidated(
        id="f3",
        severity="medium",
        title="Missing alt text",
        description="Image lacks alternative text for screen readers",
        damage=25,
        damage_type="graze",
        file_path="src/components/Avatar.tsx",
        line_start=20,
        line_end=22,
        code_snippet="<img src={user.avatar} />",
        validation_notes="Accessibility issue - missing alt text confirmed"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "pixel"


def test_classify_architecture_finding(classifier):
    """Test classification of architecture finding to Atlas."""
    finding = FindingValidated(
        id="f4",
        severity="medium",
        title="Tight coupling detected",
        description="Component directly imports database layer",
        damage=30,
        damage_type="graze",
        file_path="src/components/UserList.tsx",
        line_start=5,
        line_end=5,
        code_snippet="import { db } from '../db'",
        validation_notes="Architecture violation - tight coupling confirmed"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "atlas"


def test_classify_test_finding(classifier):
    """Test classification of test finding to Echo."""
    finding = FindingValidated(
        id="f5",
        severity="medium",
        title="Missing test coverage",
        description="New function lacks unit tests",
        damage=20,
        damage_type="graze",
        file_path="src/utils/validation.ts",
        line_start=30,
        line_end=45,
        code_snippet="export function validateEmail(email: string) { ... }",
        validation_notes="Testing gap - no coverage for new function"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "echo"


def test_classify_docs_finding(classifier):
    """Test classification of docs finding to Codex."""
    finding = FindingValidated(
        id="f6",
        severity="low",
        title="Outdated documentation",
        description="README doesn't mention new API endpoint",
        damage=8,
        damage_type="whisper",
        file_path="README.md",
        line_start=50,
        line_end=50,
        code_snippet="## API Endpoints",
        validation_notes="Documentation gap - missing new endpoint"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "codex"


def test_classify_fallback_by_severity(classifier):
    """Test fallback classification based on severity."""
    # Critical severity should go to Aegis
    finding_critical = FindingValidated(
        id="f7",
        severity="critical",
        title="Unknown critical issue",
        description="Something very bad",
        damage=90,
        damage_type="crit_hit",
        file_path="src/app.ts",
        line_start=1,
        line_end=1,
        code_snippet="code",
        validation_notes="Critical issue confirmed"
    )
    
    character_id = classifier.classify_finding(finding_critical)
    assert character_id == "aegis"
    
    # Low severity should go to Codex
    finding_low = FindingValidated(
        id="f8",
        severity="low",
        title="Unknown low issue",
        description="Minor thing",
        damage=5,
        damage_type="whisper",
        file_path="src/app.ts",
        line_start=1,
        line_end=1,
        code_snippet="code",
        validation_notes="Minor issue confirmed"
    )
    
    character_id = classifier.classify_finding(finding_low)
    assert character_id == "codex"


def test_group_findings_by_character(classifier):
    """Test grouping findings by character."""
    findings = [
        FindingValidated(
            id="f1",
            severity="critical",
            title="SQL Injection",
            description="desc",
            damage=85,
            damage_type="crit_hit",
            file_path="db.ts",
            line_start=1,
            line_end=1,
            code_snippet="code",
            validation_notes="valid"
        ),
        FindingValidated(
            id="f2",
            severity="high",
            title="XSS vulnerability",
            description="desc",
            damage=65,
            damage_type="hit",
            file_path="ui.tsx",
            line_start=1,
            line_end=1,
            code_snippet="code",
            validation_notes="valid"
        ),
        FindingValidated(
            id="f3",
            severity="medium",
            title="Missing alt text",
            description="Image lacks accessibility attributes for screen readers",
            damage=25,
            damage_type="graze",
            file_path="img.tsx",
            line_start=1,
            line_end=1,
            code_snippet="code",
            validation_notes="valid"
        )
    ]
    
    grouped = classifier.classify_findings(findings)
    
    assert "aegis" in grouped
    assert len(grouped["aegis"]) == 2
    assert "pixel" in grouped
    assert len(grouped["pixel"]) == 1


# Made with Bob