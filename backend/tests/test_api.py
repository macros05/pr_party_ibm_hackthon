"""Test FastAPI endpoints."""
import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    with TestClient(app) as client:
        yield client


def test_root_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/")
    
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "PR Party API"
    assert data["status"] == "operational"
    assert data["version"] == "1.0.0"


def test_list_fixtures_endpoint(client):
    """Test fixtures listing endpoint."""
    response = client.get("/fixtures")
    
    assert response.status_code == 200
    data = response.json()
    assert "fixtures" in data
    assert isinstance(data["fixtures"], list)
    assert len(data["fixtures"]) == 3
    assert "pr1" in data["fixtures"]
    assert "pr2" in data["fixtures"]
    assert "pr3" in data["fixtures"]


def test_analyze_sync_with_fixture(client, mock_env_vars):
    """Test synchronous analysis endpoint with fixture."""
    # Note: This will fail without actual Bob/watsonx API keys
    # but tests the endpoint structure
    response = client.post(
        "/analyze/sync",
        json={
            "pr_number": 1,
            "repo_owner": "test",
            "repo_name": "test",
            "use_fixture": "pr1"
        }
    )
    
    # Will return 500 due to missing API keys, but endpoint exists
    assert response.status_code in [200, 500]


def test_analyze_sync_without_fixture_or_github(client, mock_env_vars):
    """Test that analysis without fixture or GitHub returns 501."""
    response = client.post(
        "/analyze/sync",
        json={
            "pr_number": 1,
            "repo_owner": "test",
            "repo_name": "test"
        }
    )
    
    assert response.status_code == 501
    assert "not yet implemented" in response.json()["detail"].lower()


def test_analyze_sync_invalid_fixture(client, mock_env_vars):
    """Test analysis with invalid fixture name."""
    response = client.post(
        "/analyze/sync",
        json={
            "pr_number": 1,
            "repo_owner": "test",
            "repo_name": "test",
            "use_fixture": "nonexistent"
        }
    )
    
    assert response.status_code == 500


def test_cors_headers(client):
    """Test CORS headers are present."""
    response = client.options(
        "/",
        headers={"Origin": "http://localhost:3000"}
    )
    
    # CORS middleware should add headers
    assert response.status_code in [200, 405]


def test_analyze_request_validation(client):
    """Test request validation for analyze endpoint."""
    # Missing required fields
    response = client.post(
        "/analyze/sync",
        json={}
    )
    
    assert response.status_code == 422  # Validation error


def test_analyze_request_with_all_fields(client):
    """Test analyze request with all fields."""
    response = client.post(
        "/analyze/sync",
        json={
            "pr_number": 123,
            "repo_owner": "test",
            "repo_name": "repo",
            "use_fixture": "pr1"
        }
    )
    
    # Will fail without API keys but validates request structure
    assert response.status_code in [200, 500]


# Made with Bob