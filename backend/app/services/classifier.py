"""
Findings classifier - assigns character_id to validated findings.
Uses rule-based logic to match findings to specialist characters.
"""
from app.logging_config import get_logger
from app.models import CharacterId, FindingValidated, Severity

logger = get_logger(__name__)


class FindingsClassifier:
    """
    Assigns findings to specialist characters based on content analysis.
    
    Characters:
    - Aegis (Security Paladin): injections, XSS, auth, CVEs
    - Schema (DB Mage): N+1, indexes, migrations, locks
    - Pixel (UX Bard): a11y, contrast, copy, states
    - Atlas (Architecture Explorer): patterns, coupling, consistency
    - Echo (Test Priest): coverage, edge cases, mocks
    - Codex (Docs Scribe): outdated docs, comments
    """
    
    # Keywords for each character
    AEGIS_KEYWORDS = [
        "sql injection", "xss", "csrf", "authentication", "authorization",
        "security", "vulnerability", "cve", "sanitize", "escape", "token",
        "password", "secret", "credential", "encryption", "hash"
    ]
    
    SCHEMA_KEYWORDS = [
        "n+1", "query", "database", "index", "migration", "transaction",
        "lock", "deadlock", "orm", "sql", "select", "join", "performance",
        "db", "table", "column", "foreign key", "constraint"
    ]
    
    PIXEL_KEYWORDS = [
        "accessibility", "a11y", "aria", "contrast", "color", "font",
        "ui", "ux", "user experience", "usability", "screen reader",
        "keyboard", "focus", "semantic", "alt text", "label", "wcag"
    ]
    
    ATLAS_KEYWORDS = [
        "architecture", "pattern", "design", "coupling", "cohesion",
        "dependency", "solid", "dry", "separation", "abstraction",
        "interface", "class", "module", "component", "structure",
        "organization", "consistency", "naming"
    ]
    
    ECHO_KEYWORDS = [
        "test", "coverage", "edge case", "mock", "stub", "assertion",
        "unit test", "integration", "e2e", "spec", "expect", "describe",
        "it should", "test case", "scenario", "validation"
    ]
    
    CODEX_KEYWORDS = [
        "documentation", "comment", "jsdoc", "readme", "docs",
        "outdated", "missing docs", "undocumented", "docstring",
        "api docs", "inline comment", "todo", "fixme", "explain"
    ]
    
    def _calculate_keyword_score(self, text: str, keywords: list[str]) -> int:
        """Calculate how many keywords match in the text."""
        text_lower = text.lower()
        return sum(1 for keyword in keywords if keyword in text_lower)
    
    def classify_finding(self, finding: FindingValidated) -> CharacterId:
        """
        Assign a character to a finding based on content analysis.
        
        Args:
            finding: Validated finding to classify
        
        Returns:
            Character ID that best matches the finding
        """
        # Combine title and description for analysis
        text = f"{finding.title} {finding.description}".lower()
        
        # Calculate scores for each character
        scores = {
            "aegis": self._calculate_keyword_score(text, self.AEGIS_KEYWORDS),
            "schema": self._calculate_keyword_score(text, self.SCHEMA_KEYWORDS),
            "pixel": self._calculate_keyword_score(text, self.PIXEL_KEYWORDS),
            "atlas": self._calculate_keyword_score(text, self.ATLAS_KEYWORDS),
            "echo": self._calculate_keyword_score(text, self.ECHO_KEYWORDS),
            "codex": self._calculate_keyword_score(text, self.CODEX_KEYWORDS),
        }
        
        # Get character with highest score
        character_id = max(scores.items(), key=lambda x: x[1])[0]
        
        # Fallback logic if no keywords matched
        if scores[character_id] == 0:
            # Use severity-based fallback
            if finding.severity == "critical":
                character_id = "aegis"  # Security issues are often critical
            elif finding.severity == "high":
                character_id = "atlas"  # Architecture issues
            elif finding.severity == "medium":
                character_id = "schema"  # DB/performance issues
            else:
                character_id = "codex"  # Documentation issues
        
        logger.info(
            "finding_classified",
            finding_id=finding.id,
            character_id=character_id,
            scores=scores
        )
        
        return character_id  # type: ignore
    
    def classify_findings(
        self,
        findings: list[FindingValidated]
    ) -> dict[CharacterId, list[FindingValidated]]:
        """
        Classify multiple findings and group by character.
        
        Args:
            findings: List of validated findings
        
        Returns:
            Dict mapping character_id to their assigned findings
        """
        classified: dict[CharacterId, list[FindingValidated]] = {
            "aegis": [],
            "schema": [],
            "pixel": [],
            "atlas": [],
            "echo": [],
            "codex": [],
        }
        
        for finding in findings:
            character_id = self.classify_finding(finding)
            classified[character_id].append(finding)
        
        logger.info(
            "findings_classified",
            total_findings=len(findings),
            aegis=len(classified["aegis"]),
            schema=len(classified["schema"]),
            pixel=len(classified["pixel"]),
            atlas=len(classified["atlas"]),
            echo=len(classified["echo"]),
            codex=len(classified["codex"])
        )
        
        return classified


# Global classifier instance
_classifier: FindingsClassifier | None = None


def get_classifier() -> FindingsClassifier:
    """Get or create global classifier instance."""
    global _classifier
    if _classifier is None:
        _classifier = FindingsClassifier()
    return _classifier

# Made with Bob
