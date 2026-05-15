# PR Party Backend Test Plan

## Overview

Comprehensive testing strategy for PR Party backend before Bob API integration.

## Test Structure

```
backend/tests/
├── conftest.py          # Shared fixtures and configuration
├── test_models.py       # Pydantic model validation (15 tests)
├── test_classifier.py   # Character classification logic (9 tests)
├── test_fixture_loader.py # Fixture loading (9 tests)
└── test_api.py          # FastAPI endpoints (9 tests)
```

## Test Categories

### 1. Unit Tests (Fast, No External Dependencies)

**Models (`test_models.py`)**
- ✅ FindingRaw validation
- ✅ FindingValidated with noise_filtered
- ✅ Complete Finding with character assignment
- ✅ CharacterDialogue structure
- ✅ EncounterResult structure
- ✅ SSEEvent structure
- ✅ AnalyzeRequest validation
- ✅ Damage type enum validation
- ✅ Verdict enum validation

**Classifier (`test_classifier.py`)**
- ✅ Security findings → Aegis
- ✅ Database findings → Schema
- ✅ UX findings → Pixel
- ✅ Architecture findings → Atlas
- ✅ Test findings → Echo
- ✅ Documentation findings → Codex
- ✅ Fallback by severity (critical → Aegis, low → Codex)
- ✅ Group findings by character

**Fixture Loader (`test_fixture_loader.py`)**
- ✅ List available fixtures (pr1, pr2, pr3)
- ✅ Load PR1 (security critical)
- ✅ Load PR2 (mixed issues)
- ✅ Load PR3 (clean code)
- ✅ Error on non-existent fixture
- ✅ Validate diff content
- ✅ Validate package.json content
- ✅ Validate context files structure
- ✅ All fixtures loadable

**API Endpoints (`test_api.py`)**
- ✅ Health check endpoint
- ✅ List fixtures endpoint
- ✅ Analyze sync with fixture
- ✅ Analyze without fixture returns 501
- ✅ Invalid fixture returns 500
- ✅ CORS headers present
- ✅ Request validation (422 on missing fields)
- ✅ Request with all fields

### 2. Integration Tests (Require API Keys)

**Bob Client Integration**
- 🔄 Searcher pass with PR1 fixture
- 🔄 Validator pass with PR1 findings
- 🔄 JSON parsing with markdown code blocks
- 🔄 Error handling for invalid responses

**watsonx.ai Client Integration**
- 🔄 IAM token acquisition
- 🔄 Token refresh after 55min
- 🔄 Granite text generation
- 🔄 Error handling for API failures

**Full Pipeline Integration**
- 🔄 Complete PR1 analysis (blocked verdict)
- 🔄 Complete PR2 analysis (changes required)
- 🔄 Complete PR3 analysis (approved)
- 🔄 SSE streaming with all events
- 🔄 Character dialogue generation

## Running Tests

### Install Test Dependencies

```bash
cd backend
pip install pytest pytest-asyncio pytest-cov httpx
```

### Run Unit Tests (No API Keys Required)

```bash
# Run all unit tests
pytest tests/ -v

# Run specific test file
pytest tests/test_models.py -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

### Run Integration Tests (Requires API Keys)

```bash
# Set up environment
cp .env.example .env
# Edit .env with actual API keys

# Run integration tests (marked as @pytest.mark.integration)
pytest tests/ -v -m integration

# Run specific integration test
pytest tests/test_bob_integration.py -v
```

## Expected Test Results

### Unit Tests (Should Pass Without API Keys)
- **42 tests total**
- All should pass with mock data
- No external API calls
- Fast execution (<5 seconds)

### Integration Tests (Require API Keys)
- **~10 tests total**
- Require valid Bob and watsonx.ai credentials
- Will consume Bobcoins (6-12 total for 3 fixtures)
- Slower execution (30-60 seconds per fixture)

## Bobcoin Budget Tracking

| Test | Bobcoins | Purpose |
|------|----------|---------|
| PR1 Searcher Pass | 2-3 | Find security issues |
| PR1 Validator Pass | 2-3 | Filter noise |
| PR2 Searcher Pass | 1-2 | Find mixed issues |
| PR2 Validator Pass | 1-2 | Filter noise |
| PR3 Searcher Pass | 0.5-1 | Find minimal issues |
| PR3 Validator Pass | 0.5-1 | Filter noise |
| **Total Estimated** | **7-12** | **3 complete analyses** |

## Test Fixtures

### PR1: Security Critical (Expected: BLOCKED)
- SQL injection vulnerability
- Hardcoded credentials
- Missing input validation
- Expected damage: 274 (>80 = blocked)
- Expected findings: 8-10 critical/high

### PR2: Mixed Issues (Expected: CHANGES REQUIRED)
- N+1 query problem
- Missing accessibility
- Outdated documentation
- Expected damage: 162 (50-79 = changes required)
- Expected findings: 5-7 medium/high

### PR3: Clean Code (Expected: APPROVED)
- Well-structured refactor
- Good test coverage
- Minor documentation gaps
- Expected damage: 44 (<50 = approved)
- Expected findings: 2-3 low/medium

## Pre-Integration Checklist

Before testing with Bob API:

- [x] All unit tests passing
- [x] Fixtures load correctly
- [x] Models validate properly
- [x] Classifier assigns characters correctly
- [x] API endpoints respond correctly
- [ ] .env file configured with API keys
- [ ] Bob prompts reviewed and finalized
- [ ] Granite voice prompts ready
- [ ] Logging configured for debugging

## Integration Test Execution Plan

### Phase 1: Bob Client Only (2-4 Bobcoins)
1. Test searcher pass with PR1
2. Test validator pass with PR1 findings
3. Verify JSON parsing
4. Check error handling

### Phase 2: watsonx.ai Client Only (No Bobcoins)
1. Test IAM token acquisition
2. Test Granite text generation
3. Verify token refresh logic
4. Check error handling

### Phase 3: Full Pipeline (6-12 Bobcoins)
1. Run complete PR1 analysis
2. Run complete PR2 analysis
3. Run complete PR3 analysis
4. Verify SSE streaming
5. Check character dialogues

## Success Criteria

### Unit Tests
- ✅ 100% pass rate
- ✅ No external dependencies
- ✅ Fast execution (<5s)

### Integration Tests
- 🎯 PR1 verdict = "blocked" (damage ≥80)
- 🎯 PR2 verdict = "changes_required" (damage 50-79)
- 🎯 PR3 verdict = "approved" (damage <50)
- 🎯 All findings have character assignments
- 🎯 All findings have voiced messages
- 🎯 Character dialogues generated
- 🎯 SSE events stream correctly

## Debugging Tips

### If Tests Fail

**Model Validation Errors**
- Check Pydantic model definitions in `app/models.py`
- Verify required fields are present
- Check enum values match specification

**Classifier Errors**
- Review keyword matching in `app/services/classifier.py`
- Check severity fallback logic
- Verify character IDs match specification

**Fixture Loading Errors**
- Ensure fixture directories exist
- Check file paths are correct
- Verify README.md metadata format

**API Endpoint Errors**
- Check FastAPI route definitions
- Verify request/response models
- Review CORS configuration

### If Integration Tests Fail

**Bob API Errors**
- Verify API key is valid
- Check API URL is correct
- Review prompt formatting
- Check JSON parsing logic

**watsonx.ai Errors**
- Verify API key and project ID
- Check IAM token acquisition
- Review model ID (granite-3-3-8b-instruct)
- Check token refresh timing

**Pipeline Errors**
- Review orchestrator flow
- Check async/await usage
- Verify error propagation
- Review logging output

## Next Steps After Testing

1. **Document Results**: Export Bob session screenshots
2. **Update README**: Add test results and coverage
3. **Prepare Demo**: Create 3min video with subtitles
4. **Frontend Integration**: Share API contract with frontend dev
5. **Submission**: Package for IBM Bob Hackathon 2026

## Notes

- Unit tests can run without API keys (use mock_env_vars fixture)
- Integration tests require actual Bob and watsonx.ai credentials
- Keep Bobcoin budget under 40 total (currently using 7-12 for testing)
- Export all Bob sessions to `bob_sessions/` directory for submission
- No API keys in repository (auto-disqualification)

---

**Made with Bob** 🤖