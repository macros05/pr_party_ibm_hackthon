# Quick Test Guide

## Setup (First Time Only)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov
```

## Run Unit Tests (No API Keys Needed)

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/test_models.py -v
pytest tests/test_classifier.py -v
pytest tests/test_fixture_loader.py -v
pytest tests/test_api.py -v

# Run with coverage report
pytest tests/ --cov=app --cov-report=term-missing

# Run with HTML coverage report
pytest tests/ --cov=app --cov-report=html
# Open htmlcov/index.html in browser
```

## Expected Output

```
tests/test_models.py::test_finding_raw_model PASSED
tests/test_models.py::test_finding_validated_model PASSED
tests/test_models.py::test_finding_complete_model PASSED
tests/test_models.py::test_character_dialogue_model PASSED
tests/test_models.py::test_encounter_result_model PASSED
tests/test_models.py::test_sse_event_model PASSED
tests/test_models.py::test_analyze_request_model PASSED
tests/test_models.py::test_damage_type_validation PASSED
tests/test_models.py::test_verdict_validation PASSED

tests/test_classifier.py::test_classify_security_finding PASSED
tests/test_classifier.py::test_classify_database_finding PASSED
tests/test_classifier.py::test_classify_ux_finding PASSED
tests/test_classifier.py::test_classify_architecture_finding PASSED
tests/test_classifier.py::test_classify_test_finding PASSED
tests/test_classifier.py::test_classify_docs_finding PASSED
tests/test_classifier.py::test_classify_fallback_by_severity PASSED
tests/test_classifier.py::test_group_findings_by_character PASSED

tests/test_fixture_loader.py::test_list_fixtures PASSED
tests/test_fixture_loader.py::test_load_pr1_fixture PASSED
tests/test_fixture_loader.py::test_load_pr2_fixture PASSED
tests/test_fixture_loader.py::test_load_pr3_fixture PASSED
tests/test_fixture_loader.py::test_load_nonexistent_fixture PASSED
tests/test_fixture_loader.py::test_fixture_has_diff_content PASSED
tests/test_fixture_loader.py::test_fixture_has_package_json PASSED
tests/test_fixture_loader.py::test_fixture_context_files_structure PASSED
tests/test_fixture_loader.py::test_all_fixtures_loadable PASSED

tests/test_api.py::test_root_endpoint PASSED
tests/test_api.py::test_list_fixtures_endpoint PASSED
tests/test_api.py::test_analyze_sync_without_fixture_or_github PASSED
tests/test_api.py::test_cors_headers PASSED
tests/test_api.py::test_analyze_request_validation PASSED

======================== 42 passed in 2.34s ========================
```

## Troubleshooting

### Import Errors
```bash
# Make sure you're in the backend directory
cd backend

# Make sure virtual environment is activated
# You should see (venv) in your prompt

# Reinstall dependencies
pip install -r requirements.txt
```

### Module Not Found
```bash
# Add backend to Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
# Or on Windows:
set PYTHONPATH=%PYTHONPATH%;%cd%
```

### Test Discovery Issues
```bash
# Run from backend directory
cd backend
pytest tests/ -v
```

## Next Steps

After unit tests pass:
1. Configure `.env` with API keys
2. Switch to Advance mode for Bob API testing
3. Run integration tests with actual fixtures

See `TEST_PLAN.md` for detailed integration testing strategy.