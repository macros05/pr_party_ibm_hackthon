# PR Fixture #1: Security Critical (Blocked)

## Overview
This fixture represents a PR that introduces a file upload endpoint with multiple critical security vulnerabilities. It should result in a **BLOCKED** status (≥80 damage).

## PR Metadata
- **Repo:** demo-app
- **PR Number:** #123
- **Title:** "Add avatar upload endpoint"
- **Author:** junior-dev
- **Files Changed:** 2
- **Lines Added:** 47
- **Lines Removed:** 0

## Vulnerabilities Present

### Critical (2)
1. **RCE via arbitrary file upload** (raw-001)
   - No file extension validation
   - Files saved to public directory
   - Original filename preserved
   - Expected damage: 90

2. **Path traversal** (raw-002)
   - Unsanitized filename from user input
   - Can write outside upload directory
   - Expected damage: 60

### High (1)
3. **Missing authentication** (raw-003)
   - No auth middleware
   - User ID from request body (attacker-controlled)
   - Expected damage: 55

### Medium (2)
4. **Missing transaction** (raw-004)
   - Two DB queries without transaction
   - Data inconsistency on failure
   - Expected damage: 25

5. **No test coverage** (raw-005)
   - Critical security endpoint untested
   - Expected damage: 20

### Low (2)
6. **Poor error handling** (raw-006)
   - No try-catch for DB operations
   - Expected damage: 7

7. **Missing documentation** (raw-007)
   - No JSDoc or OpenAPI spec
   - Expected damage: 7

## Expected Outcome

### Total Damage: 264 (before clamping)
After clamping to severity ranges:
- raw-001: 90 (critical: 80-100)
- raw-002: 60 (high: 40-70) → clamped to 70
- raw-003: 55 (high: 40-70)
- raw-004: 25 (medium: 15-35)
- raw-005: 20 (medium: 15-35)
- raw-006: 7 (low: 5-10)
- raw-007: 7 (low: 5-10)

**Total after clamping: 274**

### Status: BLOCKED (≥80 damage)

### Character Assignments
- **Aegis** (Security): raw-001, raw-002, raw-003
- **Schema** (Database): raw-004
- **Pixel** (UX): raw-006
- **Atlas** (Architecture): (none - no architecture issues)
- **Echo** (Tests): raw-005
- **Codex** (Docs): raw-007

### Expected Dialogues
1. **Aegis + Schema** on raw-001
   - Aegis: "This RCE vulnerability is critical!"
   - Schema: "And if they upload a .sql file, they could inject SQL via filename in the logs table"

2. **Aegis + Pixel** on raw-003
   - Aegis: "No authentication means anyone can upload"
   - Pixel: "Users will be confused when their avatars randomly change"

## Files

### diff.patch
The git diff showing the vulnerable code changes.

### package.json
Dependencies context (multer, express, pg).

### context/db.ts
The database module imported by the upload route (1-level deep import).

### expected_findings_raw.json
The expected output from Bob Searcher (Pasada 1).

### expected_findings_validated.json
The expected output from Bob Validator (Pasada 2).

## Usage

### Testing Bob Prompts
```bash
# Send to Bob Searcher
cat diff.patch package.json context/db.ts | bob-cli --prompt prompts/bob_searcher.md > actual_findings_raw.json

# Compare with expected
diff expected_findings_raw.json actual_findings_raw.json

# Send to Bob Validator
cat diff.patch expected_findings_raw.json | bob-cli --prompt prompts/bob_validator.md > actual_findings_validated.json

# Compare with expected
diff expected_findings_validated.json actual_findings_validated.json
```

### Testing Full Pipeline
```bash
# Run through FastAPI orchestrator
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d @fixture_request.json

# Should return SSE stream with all findings
```

## Notes
- This fixture is intentionally vulnerable for testing purposes
- All vulnerabilities are based on real-world CVEs and OWASP Top 10
- The damage calculation should result in BLOCKED status
- Frontend should display red "CRITICAL DAMAGE" animation