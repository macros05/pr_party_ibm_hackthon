"""Pytest configuration and shared fixtures."""
import os
import sys
from pathlib import Path

import pytest

# Add backend directory to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


@pytest.fixture
def mock_env_vars(monkeypatch):
    """Set mock environment variables for testing."""
    monkeypatch.setenv("WATSONX_API_KEY", "test_watsonx_key")
    monkeypatch.setenv("WATSONX_PROJECT_ID", "test_project_id")
    monkeypatch.setenv("WATSONX_URL", "https://test.watsonx.com")
    monkeypatch.setenv("BOB_API_KEY", "test_bob_key")
    monkeypatch.setenv("BOB_API_URL", "https://test.bob.com")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")


@pytest.fixture
def sample_diff():
    """Sample git diff for testing."""
    return """diff --git a/src/auth.ts b/src/auth.ts
index 1234567..abcdefg 100644
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -10,7 +10,7 @@ export async function login(username: string, password: string) {
-  const query = `SELECT * FROM users WHERE username = '${username}'`;
+  const query = `SELECT * FROM users WHERE username = ?`;
   const user = await db.query(query, [username]);
   
   if (!user) {
"""


@pytest.fixture
def sample_package_json():
    """Sample package.json for testing."""
    return """{
  "name": "test-app",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "pg": "^8.11.0"
  }
}"""


@pytest.fixture
def sample_context_files():
    """Sample context files for testing."""
    return {
        "src/db.ts": """import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function query(sql: string, params: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
}""",
        "src/types.ts": """export interface User {
  id: number;
  username: string;
  email: string;
}"""
    }


@pytest.fixture
def sample_finding_raw():
    """Sample raw finding from Bob searcher."""
    return {
        "id": "f1",
        "type": "security",
        "severity": "critical",
        "title": "SQL Injection vulnerability",
        "description": "User input is directly interpolated into SQL query",
        "file_path": "src/auth.ts",
        "line_start": 13,
        "line_end": 13,
        "code_snippet": "const query = `SELECT * FROM users WHERE username = '${username}'`;",
        "suggestion": "Use parameterized queries with placeholders"
    }


@pytest.fixture
def sample_finding_validated():
    """Sample validated finding from Bob validator."""
    return {
        "id": "f1",
        "type": "security",
        "severity": "critical",
        "title": "SQL Injection vulnerability",
        "description": "User input is directly interpolated into SQL query",
        "file_path": "src/auth.ts",
        "line_start": 13,
        "line_end": 13,
        "code_snippet": "const query = `SELECT * FROM users WHERE username = '${username}'`;",
        "suggestion": "Use parameterized queries with placeholders",
        "noise_filtered": False,
        "validator_reasoning": "This is a legitimate SQL injection vulnerability. User input should never be directly interpolated into SQL queries."
    }


@pytest.fixture
def sample_finding_complete():
    """Sample complete finding with character assignment and voice."""
    return {
        "id": "f1",
        "type": "security",
        "severity": "critical",
        "title": "SQL Injection vulnerability",
        "description": "User input is directly interpolated into SQL query",
        "file_path": "src/auth.ts",
        "line_start": 13,
        "line_end": 13,
        "code_snippet": "const query = `SELECT * FROM users WHERE username = '${username}'`;",
        "suggestion": "Use parameterized queries with placeholders",
        "noise_filtered": False,
        "validator_reasoning": "This is a legitimate SQL injection vulnerability.",
        "character_id": "aegis",
        "character_name": "Aegis",
        "damage": 85,
        "damage_type": "crit_hit",
        "voiced_message": "⚔️ CRITICAL BREACH DETECTED! This SQL injection is a gateway for attackers to steal your entire database. Use parameterized queries immediately!"
    }


# Made with Bob