"""Test fixture loader service."""
import pytest
from app.services.fixture_loader import FixtureLoader


@pytest.fixture
def loader():
    """Create fixture loader instance."""
    return FixtureLoader()


def test_list_fixtures(loader):
    """Test listing available fixtures."""
    fixtures = loader.list_fixtures()
    
    assert len(fixtures) == 3
    assert "pr1" in fixtures
    assert "pr2" in fixtures
    assert "pr3" in fixtures


def test_load_pr1_fixture(loader):
    """Test loading PR1 (security critical) fixture."""
    data = loader.load_fixture("pr1")
    
    assert data["pr_number"] == 1
    assert data["pr_title"] == "Add user authentication system"
    assert data["pr_author"] == "junior-dev"
    assert "diff" in data
    assert "package_json" in data
    assert "context_files" in data
    assert len(data["context_files"]) > 0


def test_load_pr2_fixture(loader):
    """Test loading PR2 (mixed issues) fixture."""
    data = loader.load_fixture("pr2")
    
    assert data["pr_number"] == 2
    assert data["pr_title"] == "Implement user profile page"
    assert data["pr_author"] == "mid-level-dev"
    assert "diff" in data
    assert "package_json" in data
    assert "context_files" in data


def test_load_pr3_fixture(loader):
    """Test loading PR3 (clean code) fixture."""
    data = loader.load_fixture("pr3")
    
    assert data["pr_number"] == 3
    assert data["pr_title"] == "Refactor authentication middleware"
    assert data["pr_author"] == "senior-dev"
    assert "diff" in data
    assert "package_json" in data
    assert "context_files" in data


def test_load_nonexistent_fixture(loader):
    """Test loading non-existent fixture raises error."""
    with pytest.raises(ValueError, match="Unknown fixture: nonexistent"):
        loader.load_fixture("nonexistent")


def test_fixture_has_diff_content(loader):
    """Test that loaded fixture has actual diff content."""
    data = loader.load_fixture("pr1")
    
    assert len(data["diff"]) > 100  # Should have substantial content
    assert "@@" in data["diff"]  # Should have diff markers


def test_fixture_has_package_json(loader):
    """Test that loaded fixture has package.json content."""
    data = loader.load_fixture("pr1")
    
    assert len(data["package_json"]) > 50
    assert "dependencies" in data["package_json"] or "name" in data["package_json"]


def test_fixture_context_files_structure(loader):
    """Test that context files have correct structure."""
    data = loader.load_fixture("pr1")
    
    assert isinstance(data["context_files"], dict)
    
    for file_path, content in data["context_files"].items():
        assert isinstance(file_path, str)
        assert isinstance(content, str)
        assert len(content) > 0


def test_all_fixtures_loadable(loader):
    """Test that all fixtures can be loaded without errors."""
    fixtures = loader.list_fixtures()
    
    for fixture_name in fixtures:
        data = loader.load_fixture(fixture_name)
        
        # Verify required fields
        assert "pr_number" in data
        assert "pr_title" in data
        assert "pr_author" in data
        assert "diff" in data
        assert "package_json" in data
        assert "context_files" in data


# Made with Bob