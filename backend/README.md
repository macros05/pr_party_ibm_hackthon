# PR Party Backend

FastAPI backend for PR Party - Multi-agent PR review system with IBM Bob and watsonx.ai.

## Architecture

### Mythos Two-Pass Pattern
1. **Bob Searcher**: Analyzes diff → produces `findings_raw.json`
2. **Bob Validator**: Receives diff + findings_raw → filters noise → `findings_validated.json`
3. **Classifier**: Assigns findings to specialist characters
4. **Voice Rewriter**: Uses Granite to add character personality
5. **SSE Stream**: Streams results to frontend in real-time

### Six Specialist Characters
- **Aegis** (Security Paladin): SQL injection, XSS, auth vulnerabilities
- **Schema** (DB Mage): N+1 queries, missing indexes, performance
- **Pixel** (UX Bard): Accessibility, contrast, user experience
- **Atlas** (Architecture Explorer): Design patterns, coupling, consistency
- **Echo** (Test Priest): Test coverage, edge cases, validation
- **Codex** (Docs Scribe): Documentation, comments, clarity

## Setup

### Prerequisites
- Python 3.11+
- IBM watsonx.ai API key
- IBM Bob API key

### Installation

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
```

2. **Activate virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
- `WATSONX_API_KEY`: IBM watsonx.ai API key
- `WATSONX_PROJECT_ID`: watsonx.ai project ID
- `BOB_API_KEY`: IBM Bob API key
- `BOB_API_URL`: IBM Bob API endpoint

### Run Development Server

```bash
# From backend directory
uvicorn app.main:app --reload --port 8000
```

API will be available at: http://localhost:8000

Interactive docs: http://localhost:8000/docs

## API Endpoints

### `GET /`
Health check endpoint.

### `GET /fixtures`
List available PR fixtures for offline testing.

Returns: `["pr1", "pr2", "pr3"]`

### `POST /analyze`
Analyze a PR with SSE streaming.

**Request Body:**
```json
{
  "pr_number": 123,
  "repo_owner": "owner",
  "repo_name": "repo",
  "use_fixture": "pr1"  // Optional: use fixture for offline testing
}
```

**Response:** Server-Sent Events stream

Event types:
- `finding`: Individual finding discovered
- `dialogue`: Character dialogue
- `complete`: Analysis complete with full result
- `error`: Error occurred

### `POST /analyze/sync`
Analyze a PR and return complete result (non-streaming).

Same request body as `/analyze`, returns full `EncounterResult` JSON.

## Testing with Fixtures

Three PR fixtures are available for offline testing:

### PR1: Security Critical (Blocked)
```bash
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 1, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr1"}'
```

Expected: 274 damage, BLOCKED verdict, 7 critical security findings

### PR2: Mixed Issues (Changes Required)
```bash
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 2, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr2"}'
```

Expected: 162 damage, CHANGES REQUIRED verdict, 8 mixed severity findings

### PR3: Clean Code (Approved)
```bash
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 3, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr3"}'
```

Expected: 44 damage, APPROVED verdict, 3 minor findings

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings & environment
│   ├── models.py            # Pydantic models (JSON contract)
│   ├── logging_config.py    # Structured logging
│   ├── clients/
│   │   ├── bob_client.py    # IBM Bob API client
│   │   └── watsonx_client.py # watsonx.ai client (IAM refresh)
│   └── services/
│       ├── orchestrator.py   # Main analysis pipeline
│       ├── classifier.py     # Character assignment
│       ├── voice_rewriter.py # Granite voice rewriting
│       └── fixture_loader.py # Fixture loading
├── requirements.txt
├── .env.example
└── README.md
```

## Key Implementation Details

### IAM Token Refresh
watsonx.ai IAM tokens expire after 60 minutes. The `WatsonxClient` automatically refreshes tokens 5 minutes before expiry to prevent mid-request failures.

### Damage System
- **Critical** (80-100 dmg): RCE, data loss → `crit_hit` animation
- **High** (40-70 dmg): Serious bugs → `hit` animation
- **Medium** (15-35 dmg): Code smells → `graze` animation
- **Low** (5-10 dmg): Nits → `whisper` animation

PR starts at 100 HP:
- ≥80 damage: BLOCKED
- 50-79 damage: CHANGES REQUIRED
- <50 damage: APPROVED

### Structured Logging
All Bob/Granite API calls are logged in JSON format with:
- Request/response lengths
- Elapsed time
- Error details
- Token usage (when available)

Logs are written to stdout for container compatibility.

## Development

### Run Tests
```bash
pytest
```

### Type Checking
```bash
mypy app/
```

### Code Formatting
```bash
black app/
isort app/
```

## Troubleshooting

### Import Errors
Make sure virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```

### API Key Errors
Verify `.env` file exists and contains valid API keys:
```bash
cat .env
```

### Token Expiry
If you see authentication errors after 60 minutes, the IAM token refresh may have failed. Check logs for `watsonx_token_refreshed` events.

### Fixture Not Found
Ensure you're running from the project root directory where `fixtures/` exists:
```bash
# Should show fixtures directory
ls fixtures/
```

## Production Deployment

1. Set `LOG_LEVEL=INFO` in production
2. Use proper CORS origins (not `*`)
3. Enable HTTPS
4. Set up monitoring for token refresh failures
5. Configure rate limiting for API endpoints

## License

IBM Bob Hackathon 2026 Project