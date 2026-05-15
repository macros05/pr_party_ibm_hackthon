# PR Fixture #3: Clean Code (Approved)

## Overview
This fixture represents a well-written PR that adds a password reset feature with proper security, testing, and documentation. It should result in an **APPROVED** status (<50 damage).

## PR Metadata
- **Repo:** demo-app
- **PR Number:** #789
- **Title:** "Add secure password reset with email verification"
- **Author:** senior-dev
- **Files Changed:** 4
- **Lines Added:** 156
- **Lines Removed:** 2

## Issues Present

### Medium (1)
1. **Rate Limiting Not Implemented** (raw-001)
   - Password reset endpoint lacks rate limiting
   - Could be abused for email enumeration
   - Expected damage: 30

### Low (2)
2. **Minor Documentation Gap** (raw-002)
   - Email template path not documented in README
   - Expected damage: 8

3. **Test Coverage Could Be Higher** (raw-003)
   - Missing test for token expiration edge case (59min vs 61min)
   - Expected damage: 6

## Expected Outcome

### Total Damage: 44 (before clamping)
After clamping to severity ranges:
- raw-001: 30 (medium: 15-35)
- raw-002: 8 (low: 5-10)
- raw-003: 6 (low: 5-10)

**Total after clamping: 44**

### Status: APPROVED (<50 damage)

### Character Assignments
- **Aegis** (Security): raw-001
- **Schema** (Database): (none - proper transactions used)
- **Pixel** (UX): (none - good UX practices)
- **Atlas** (Architecture): (none - clean architecture)
- **Echo** (Tests): raw-003
- **Codex** (Docs): raw-002

### Expected Dialogues
1. **Aegis + Codex** on raw-001
   - Aegis: "Rate limiting would prevent email enumeration attacks"
   - Codex: "And we should document the rate limit policy in the API docs"

2. **Echo + Codex** on raw-003
   - Echo: "The 60-minute boundary test would catch off-by-one errors"
   - Codex: "Good point - let's add that to the test documentation"

## Positive Aspects (What Bob Should Notice)

### Security Best Practices
- ✅ Cryptographically secure token generation (crypto.randomBytes)
- ✅ Token hashing before storage (bcrypt)
- ✅ Token expiration (60 minutes)
- ✅ One-time use tokens (deleted after use)
- ✅ Password strength validation
- ✅ Proper error messages (no user enumeration)

### Database Best Practices
- ✅ Transaction used for token creation + email sending
- ✅ Proper indexes on token column
- ✅ Foreign key constraints
- ✅ Timestamp columns for audit trail

### Testing Best Practices
- ✅ Unit tests for token generation
- ✅ Integration tests for full flow
- ✅ Error case testing
- ✅ Mock email service
- ✅ 85% code coverage

### Code Quality
- ✅ TypeScript with strict types
- ✅ Proper error handling with custom error classes
- ✅ Async/await used correctly
- ✅ No magic numbers (constants defined)
- ✅ Clean separation of concerns

### Documentation
- ✅ JSDoc comments on all public functions
- ✅ README updated with new endpoint
- ✅ API examples provided
- ✅ Environment variables documented

## Files

### diff.patch
The git diff showing the password reset implementation.

### package.json
Dependencies context (express, pg, bcrypt, nodemailer).

### context/db.ts
The database module with transaction support.

### context/auth.ts
Existing authentication utilities (password hashing).

### expected_findings_raw.json
The expected output from Bob Searcher (Pasada 1) - only 3 minor findings.

### expected_findings_validated.json
The expected output from Bob Validator (Pasada 2) - all 3 confirmed.

## Usage

### Testing Bob Prompts
```bash
# Send to Bob Searcher
cat diff.patch package.json context/db.ts context/auth.ts | bob-cli --prompt prompts/bob_searcher.md > actual_findings_raw.json

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

# Should return SSE stream with minimal findings
```

## Notes
- This fixture demonstrates a high-quality PR with best practices
- Only minor issues that don't block approval
- Damage calculation should result in APPROVED status
- Frontend should display green "APPROVED" animation with minimal damage
- Tests the system's ability to recognize good code and not over-flag
- Characters should have positive dialogue acknowledging good practices