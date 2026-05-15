# PR Fixture #2: Mixed Issues (Changes Required)

## Overview
This fixture represents a PR that adds a user search feature with several issues across different categories, but no critical vulnerabilities. It should result in a **CHANGES REQUIRED** status (50-79 damage).

## PR Metadata
- **Repo:** demo-app
- **PR Number:** #456
- **Title:** "Add user search with filters"
- **Author:** mid-level-dev
- **Files Changed:** 3
- **Lines Added:** 89
- **Lines Removed:** 5

## Issues Present

### High (1)
1. **N+1 Query Problem** (raw-001)
   - Fetches users, then loops to fetch profiles individually
   - Will cause performance issues at scale
   - Expected damage: 50

### Medium (4)
2. **Missing Index** (raw-002)
   - Search query on unindexed email column
   - Expected damage: 30

3. **Poor Accessibility** (raw-003)
   - Search input missing aria-label
   - No keyboard navigation for results
   - Expected damage: 25

4. **Inconsistent Error Handling** (raw-004)
   - Some errors return 500, others 400 for same conditions
   - No error logging
   - Expected damage: 20

5. **Missing Edge Case Tests** (raw-005)
   - No tests for empty results, special characters, pagination edge cases
   - Expected damage: 18

### Low (3)
6. **Outdated Documentation** (raw-006)
   - API docs don't mention new filter parameters
   - Expected damage: 8

7. **Magic Numbers** (raw-007)
   - Hardcoded page size (20) without constant
   - Expected damage: 6

8. **Inconsistent Naming** (raw-008)
   - Uses both camelCase and snake_case in same file
   - Expected damage: 5

## Expected Outcome

### Total Damage: 162 (before clamping)
After clamping to severity ranges:
- raw-001: 50 (high: 40-70)
- raw-002: 30 (medium: 15-35)
- raw-003: 25 (medium: 15-35)
- raw-004: 20 (medium: 15-35)
- raw-005: 18 (medium: 15-35)
- raw-006: 8 (low: 5-10)
- raw-007: 6 (low: 5-10)
- raw-008: 5 (low: 5-10)

**Total after clamping: 162**

### Status: CHANGES REQUIRED (50-79 damage)

### Character Assignments
- **Aegis** (Security): (none - no security issues)
- **Schema** (Database): raw-001, raw-002
- **Pixel** (UX): raw-003
- **Atlas** (Architecture): raw-004, raw-007, raw-008
- **Echo** (Tests): raw-005
- **Codex** (Docs): raw-006

### Expected Dialogues
1. **Schema + Atlas** on raw-001
   - Schema: "This N+1 query will kill performance with 1000+ users"
   - Atlas: "The architecture should use a JOIN or batch loading pattern"

2. **Pixel + Echo** on raw-003
   - Pixel: "Screen reader users can't identify this search input"
   - Echo: "And there are no accessibility tests to catch this"

3. **Atlas + Codex** on raw-007
   - Atlas: "Magic number 20 should be a named constant"
   - Codex: "And it's not documented what the default page size is"

## Files

### diff.patch
The git diff showing the search feature implementation.

### package.json
Dependencies context (express, pg, react).

### context/db.ts
The database module with query helpers.

### context/UserProfile.tsx
Existing user profile component (referenced in new code).

### expected_findings_raw.json
The expected output from Bob Searcher (Pasada 1).

### expected_findings_validated.json
The expected output from Bob Validator (Pasada 2).

## Usage

### Testing Bob Prompts
```bash
# Send to Bob Searcher
cat diff.patch package.json context/db.ts context/UserProfile.tsx | bob-cli --prompt prompts/bob_searcher.md > actual_findings_raw.json

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
- This fixture demonstrates a realistic PR with mixed severity issues
- No critical security vulnerabilities, but significant technical debt
- Damage calculation should result in CHANGES REQUIRED status
- Frontend should display yellow "NEEDS WORK" animation
- Tests multiple character interactions and dialogue generation