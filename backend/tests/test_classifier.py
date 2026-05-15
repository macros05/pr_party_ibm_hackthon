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
        type="security",
        severity="critical",
        title="SQL Injection vulnerability",
        description="User input not sanitized in database query",
        file_path="src/db.ts",
        line_start=42,
        line_end=45,
        code_snippet="const query = `SELECT * FROM users WHERE id = ${userId}`",
        suggestion="Use parameterized queries",
        noise_filtered=False,
        validator_reasoning="Legitimate security issue"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "aegis"


def test_classify_database_finding(classifier):
    """Test classification of database finding to Schema."""
    finding = FindingValidated(
        id="f2",
        type="performance",
        severity="high",
        title="N+1 query detected",
        description="Loop executes separate query for each item",
        file_path="src/api.ts",
        line_start=10,
        line_end=15,
        code_snippet="for (const user of users) { await db.posts.find(user.id) }",
        suggestion="Use JOIN or batch query",
        noise_filtered=False,
        validator_reasoning="Performance issue"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "schema"


def test_classify_ux_finding(classifier):
    """Test classification of UX finding to Pixel."""
    finding = FindingValidated(
        id="f3",
        type="accessibility",
        severity="medium",
        title="Missing alt text",
        description="Image lacks alternative text for screen readers",
        file_path="src/components/Avatar.tsx",
        line_start=20,
        line_end=22,
        code_snippet="<img src={user.avatar} />",
        suggestion="Add alt attribute",
        noise_filtered=False,
        validator_reasoning="Accessibility issue"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "pixel"


def test_classify_architecture_finding(classifier):
    """Test classification of architecture finding to Atlas."""
    finding = FindingValidated(
        id="f4",
        type="architecture",
        severity="medium",
        title="Tight coupling detected",
        description="Component directly imports database layer",
        file_path="src/components/UserList.tsx",
        line_start=5,
        line_end=5,
        code_snippet="import { db } from '../db'",
        suggestion="Use service layer abstraction",
        noise_filtered=False,
        validator_reasoning="Architecture violation"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "atlas"


def test_classify_test_finding(classifier):
    """Test classification of test finding to Echo."""
    finding = FindingValidated(
        id="f5",
        type="testing",
        severity="medium",
        title="Missing test coverage",
        description="New function lacks unit tests",
        file_path="src/utils/validation.ts",
        line_start=30,
        line_end=45,
        code_snippet="export function validateEmail(email: string) { ... }",
        suggestion="Add test cases for edge cases",
        noise_filtered=False,
        validator_reasoning="Testing gap"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "echo"


def test_classify_docs_finding(classifier):
    """Test classification of docs finding to Codex."""
    finding = FindingValidated(
        id="f6",
        type="documentation",
        severity="low",
        title="Outdated documentation",
        description="README doesn't mention new API endpoint",
        file_path="README.md",
        line_start=50,
        line_end=50,
        code_snippet="## API Endpoints",
        suggestion="Document new /analyze endpoint",
        noise_filtered=False,
        validator_reasoning="Documentation gap"
    )
    
    character_id = classifier.classify_finding(finding)
    assert character_id == "codex"


def test_classify_fallback_by_severity(classifier):
    """Test fallback classification based on severity."""
    # Critical severity should go to Aegis
    finding_critical = FindingValidated(
        id="f7",
        type="unknown",
        severity="critical",
        title="Unknown critical issue",
        description="Something very bad",
        file_path="src/app.ts",
        line_start=1,
        line_end=1,
        code_snippet="code",
        suggestion="fix it",
        noise_filtered=False,
        validator_reasoning="Critical"
    )
    
    character_id = classifier.classify_finding(finding_critical)
    assert character_id == "aegis"
    
    # Low severity should go to Codex
    finding_low = FindingValidated(
        id="f8",
        type="unknown",
        severity="low",
        title="Unknown low issue",
        description="Minor thing",
        file_path="src/app.ts",
        line_start=1,
        line_end=1,
        code_snippet="code",
        suggestion="fix it",
        noise_filtered=False,
        validator_reasoning="Minor"
    )
    
    character_id = classifier.classify_finding(finding_low)
    assert character_id == "codex"


def test_group_findings_by_character(classifier):
    """Test grouping findings by character."""
    findings = [
        FindingValidated(
            id="f1",
            type="security",
            severity="critical",
            title="SQL Injection",
            description="desc",
            file_path="db.ts",
            line_start=1,
            line_end=1,
            code_snippet="code",
            suggestion="fix",
            noise_filtered=False,
            validator_reasoning="valid"
        ),
        FindingValidated(
            id="f2",
            type="security",
            severity="high",
            title="XSS vulnerability",
            description="desc",
            file_path="ui.tsx",
            line_start=1,
            line_end=1,
            code_snippet="code",
            suggestion="fix",
            noise_filtered=False,
            validator_reasoning="valid"
        ),
        FindingValidated(
            id="f3",
            type="accessibility",
            severity="medium",
            title="Missing alt",
            description="desc",
            file_path="img.tsx",
            line_start=1,
            line_end=1,
            code_snippet="code",
            suggestion="fix",
            noise_filtered=False,
            validator_reasoning="valid"
        )
    ]
    
    grouped = classifier.classify_findings(findings)
    
    assert "aegis" in grouped
    assert len(grouped["aegis"]) == 2
    assert "pixel" in grouped
    assert len(grouped["pixel"]) == 1


# Made with Bob