"""
Fixture loader for offline PR testing.
Loads pre-created PR fixtures (pr1, pr2, pr3) for demo without GitHub API.
"""
import json
from pathlib import Path
from typing import Any

from app.logging_config import get_logger

logger = get_logger(__name__)


class FixtureLoader:
    """Loads PR fixtures from the fixtures/ directory."""
    
    def __init__(self, fixtures_dir: str = "fixtures"):
        self.fixtures_dir = Path(fixtures_dir)
        
        # If fixtures_dir doesn't exist, try parent directory (for tests run from backend/)
        if not self.fixtures_dir.exists():
            parent_fixtures = Path("..") / fixtures_dir
            if parent_fixtures.exists():
                self.fixtures_dir = parent_fixtures
        
        logger.info("fixture_loader_initialized", fixtures_dir=str(self.fixtures_dir.resolve()))
    
    def load_fixture(self, fixture_name: str) -> dict[str, Any]:
        """
        Load a PR fixture by name.
        
        Args:
            fixture_name: Fixture identifier (pr1, pr2, pr3)
        
        Returns:
            Dict containing:
            - pr_number: int
            - pr_title: str
            - pr_author: str
            - diff: str
            - package_json: str
            - context_files: dict[str, str]
            - expected_findings_raw: list (optional, for validation)
            - expected_findings_validated: list (optional, for validation)
        
        Raises:
            ValueError: If fixture not found
        """
        # Map fixture names to directories
        fixture_map = {
            "pr1": "pr1_security_critical",
            "pr2": "pr2_mixed_issues",
            "pr3": "pr3_clean_code"
        }
        
        if fixture_name not in fixture_map:
            raise ValueError(
                f"Unknown fixture: {fixture_name}. "
                f"Available: {', '.join(fixture_map.keys())}"
            )
        
        fixture_dir = self.fixtures_dir / fixture_map[fixture_name]
        
        if not fixture_dir.exists():
            raise ValueError(f"Fixture directory not found: {fixture_dir}")
        
        logger.info("loading_fixture", fixture_name=fixture_name, path=str(fixture_dir))
        
        # Load README for metadata
        readme_path = fixture_dir / "README.md"
        pr_number = 0
        pr_title = "Unknown"
        pr_author = "unknown"
        
        if readme_path.exists():
            readme_content = readme_path.read_text(encoding="utf-8")
            # Parse metadata from README
            for line in readme_content.split("\n"):
                if line.startswith("**PR Number:**"):
                    pr_number = int(line.split(":")[-1].strip())
                elif line.startswith("**Title:**"):
                    pr_title = line.split(":", 1)[-1].strip()
                elif line.startswith("**Author:**"):
                    pr_author = line.split(":")[-1].strip()
        
        # Load diff
        diff_path = fixture_dir / "diff.patch"
        diff = diff_path.read_text(encoding="utf-8")
        
        # Load package.json
        package_json_path = fixture_dir / "package.json"
        package_json = package_json_path.read_text(encoding="utf-8")
        
        # Load context files
        context_dir = fixture_dir / "context"
        context_files: dict[str, str] = {}
        
        if context_dir.exists():
            for context_file in context_dir.glob("*"):
                if context_file.is_file():
                    context_files[context_file.name] = context_file.read_text(encoding="utf-8")
        
        # Load expected findings (optional, for validation)
        expected_raw = None
        expected_validated = None
        
        raw_path = fixture_dir / "expected_findings_raw.json"
        if raw_path.exists():
            with open(raw_path, "r", encoding="utf-8") as f:
                expected_raw = json.load(f)
        
        validated_path = fixture_dir / "expected_findings_validated.json"
        if validated_path.exists():
            with open(validated_path, "r", encoding="utf-8") as f:
                expected_validated = json.load(f)
        
        logger.info(
            "fixture_loaded",
            fixture_name=fixture_name,
            pr_number=pr_number,
            diff_length=len(diff),
            context_files_count=len(context_files),
            has_expected_raw=expected_raw is not None,
            has_expected_validated=expected_validated is not None
        )
        
        return {
            "pr_number": pr_number,
            "pr_title": pr_title,
            "pr_author": pr_author,
            "diff": diff,
            "package_json": package_json,
            "context_files": context_files,
            "expected_findings_raw": expected_raw,
            "expected_findings_validated": expected_validated
        }
    
    def list_fixtures(self) -> list[str]:
        """List available fixture names."""
        return ["pr1", "pr2", "pr3"]


# Global loader instance
_fixture_loader: FixtureLoader | None = None


def get_fixture_loader() -> FixtureLoader:
    """Get or create global fixture loader instance."""
    global _fixture_loader
    if _fixture_loader is None:
        _fixture_loader = FixtureLoader()
    return _fixture_loader

# Made with Bob
