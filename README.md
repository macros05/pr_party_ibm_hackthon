# PR Party 🎉

**Multi-Agent PR Review System with IBM Bob & watsonx.ai**

IBM Bob Hackathon 2026 Project - Transform code reviews into epic RPG encounters where six specialist characters battle bugs and vulnerabilities!

## 🎮 Concept

Your PR is a hero with 100 HP. Six specialist characters analyze your code and deal damage based on issues found:

- **Aegis** 🛡️ (Security Paladin): Hunts SQL injections, XSS, auth vulnerabilities
- **Schema** 🔮 (Database Mage): Detects N+1 queries, missing indexes, performance issues
- **Pixel** 🎨 (UX Bard): Champions accessibility, contrast, user experience
- **Atlas** 🗺️ (Architecture Explorer): Maps design patterns, coupling, consistency
- **Echo** ⚗️ (Test Priest): Validates coverage, edge cases, test quality
- **Codex** 📜 (Docs Scribe): Ensures documentation, comments, clarity

### Damage System
- **Critical** (80-100 dmg): RCE, data loss → ⚔️ CRIT HIT
- **High** (40-70 dmg): Serious bugs → 🗡️ HIT
- **Medium** (15-35 dmg): Code smells → 🏹 GRAZE
- **Low** (5-10 dmg): Nits → 💬 WHISPER

### Verdicts
- **≥80 damage**: 🚫 BLOCKED - Critical issues must be fixed
- **50-79 damage**: ⚠️ CHANGES REQUIRED - Significant improvements needed
- **<50 damage**: ✅ APPROVED - Good to merge!

## 🏗️ Architecture

### The Mythos Two-Pass Pattern

Inspired by Anthropic's Mythos framework, we use Bob in a dual-role analysis:

1. **Buscador (Searcher)**: Bob analyzes the diff and produces raw findings
2. **Validador (Validator)**: Bob receives diff + raw findings, filters false positives

This two-pass approach dramatically reduces noise while maintaining high accuracy.

### Pipeline Flow

```
PR Diff + Context
    ↓
Bob Pass 1: Searcher → findings_raw.json
    ↓
Bob Pass 2: Validator → findings_validated.json
    ↓
Classifier → Assign to Characters
    ↓
Granite Voice Rewriter → Add Character Personality
    ↓
SSE Stream → Frontend (Real-time animations)
```

## 📁 Project Structure

```
pr_party_ibm_hackthon/
├── README.md                    # This file
├── PR_PARTY_SPEC.md            # Complete technical specification
├── AGENTS.md                   # Agent rules and guidelines
├── DECISIONS.md                # Architecture decision log
├── history.md                  # Development session history
│
├── fixtures/                   # 3 PR fixtures for offline testing
│   ├── pr1_security_critical/  # 274 dmg → BLOCKED
│   ├── pr2_mixed_issues/       # 162 dmg → CHANGES REQUIRED
│   └── pr3_clean_code/         # 44 dmg → APPROVED
│
├── prompts/                    # Bob prompt templates
│   ├── bob_searcher.md         # Searcher pass prompt
│   └── bob_validator.md        # Validator pass prompt
│
├── types/                      # TypeScript type definitions
│   └── encounter.ts            # Shared types for frontend
│
├── validation/                 # Prompt validation & analysis
│   └── pr1_prompt_analysis.md
│
└── backend/                    # FastAPI backend
    ├── README.md               # Backend setup instructions
    ├── requirements.txt
    ├── .env.example
    └── app/
        ├── main.py             # FastAPI app with SSE
        ├── models.py           # Pydantic models (JSON contract)
        ├── config.py           # Settings
        ├── clients/
        │   ├── bob_client.py   # IBM Bob API client
        │   └── watsonx_client.py # watsonx.ai with IAM refresh
        └── services/
            ├── orchestrator.py  # Main pipeline
            ├── classifier.py    # Character assignment
            ├── voice_rewriter.py # Granite personality
            └── fixture_loader.py # Offline testing
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- IBM watsonx.ai API key
- IBM Bob API key
- Node.js 18+ (for frontend, separate repo)

### Backend Setup

1. **Clone and navigate:**
```bash
git clone <repo-url>
cd pr_party_ibm_hackthon/backend
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows
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

5. **Run server:**
```bash
uvicorn app.main:app --reload --port 8000
```

API available at: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### Test with Fixtures

```bash
# PR1: Security Critical (BLOCKED)
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 1, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr1"}'

# PR2: Mixed Issues (CHANGES REQUIRED)
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 2, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr2"}'

# PR3: Clean Code (APPROVED)
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"pr_number": 3, "repo_owner": "test", "repo_name": "test", "use_fixture": "pr3"}'
```

## 🎯 Key Features

### 1. Mythos Two-Pass Analysis
- **Searcher**: Comprehensive initial scan
- **Validator**: Intelligent noise filtering
- Result: High accuracy, low false positives

### 2. Character Specialization
Each character has:
- Unique expertise domain
- Distinct personality voice (via Granite)
- Custom damage calculations
- Character-to-character dialogues

### 3. Real-Time Streaming
- Server-Sent Events (SSE) for live updates
- Findings appear one-by-one with animations
- Character dialogues triggered by patterns
- Smooth UX even for large PRs

### 4. Offline Demo Mode
- 3 pre-analyzed PR fixtures
- No GitHub API required for demo
- Perfect for hackathon presentations
- Reproducible results

### 5. IAM Token Management
- Automatic token refresh (60min expiry)
- 5-minute safety margin
- No mid-request failures
- Production-ready

## 📊 Fixture Coverage

| Fixture | Verdict | Damage | Findings | Key Issues |
|---------|---------|--------|----------|------------|
| PR1 | 🚫 BLOCKED | 274 | 7 | SQL injection, XSS, hardcoded secrets |
| PR2 | ⚠️ CHANGES REQUIRED | 162 | 8 | N+1 queries, missing indexes, a11y |
| PR3 | ✅ APPROVED | 44 | 3 | Minor docs, small improvements |

## 🔧 Technology Stack

### Backend
- **FastAPI**: Modern async Python web framework
- **IBM Bob**: Two-pass code analysis (Mythos pattern)
- **watsonx.ai Granite 3.3**: Character voice rewriting
- **Pydantic**: Type-safe data validation
- **structlog**: JSON structured logging
- **SSE**: Real-time streaming to frontend

### Frontend (Separate Repo)
- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **SSE Client**: Real-time updates

## 📝 JSON Contract

The backend and frontend communicate via a strict JSON contract defined in `PR_PARTY_SPEC.md` section 4. This contract is **IMMUTABLE** after hour 2 of development to prevent integration issues.

Key models:
- `Finding`: Individual code issue with character assignment
- `CharacterDialogue`: Interactions between characters
- `EncounterResult`: Complete PR analysis result
- `SSEEvent`: Streaming event structure

## 🎓 Development Philosophy

### Bob Usage (Bobcoin Budget: 40)
- ✅ Master prompt design (searcher + validator)
- ✅ Findings classifier logic
- ✅ Damage calculation engine
- ✅ Dialogue detector
- ❌ NOT for scaffolding or boilerplate

### Code Quality
- Type hints mandatory
- Async/await for all I/O
- Structured logging for all AI calls
- No API keys in code (auto-disqualification)

## 📦 Submission Requirements

- [x] 3 PR fixtures with expected outputs
- [x] Bob prompts (searcher + validator)
- [x] FastAPI backend with SSE
- [x] Pydantic models matching JSON contract
- [x] watsonx.ai client with IAM refresh
- [x] Character classifier
- [x] Voice rewriter (Granite)
- [ ] `bob_sessions/` directory with screenshots
- [ ] 3-minute demo video with subtitles
- [x] README with setup instructions
- [x] No API keys in repo

## 🏆 Hackathon Pitch Points

1. **Mythos Pattern**: Two-pass Bob analysis (unique approach)
2. **Character System**: 6 specialists with distinct voices
3. **Real-Time UX**: SSE streaming with animations
4. **Production Ready**: IAM token refresh, structured logging
5. **Offline Demo**: 3 fixtures for reliable presentations
6. **Type Safety**: Immutable JSON contract, Pydantic validation

## 📚 Documentation

- `PR_PARTY_SPEC.md`: Complete technical specification
- `AGENTS.md`: Agent rules and Bobcoin budget
- `DECISIONS.md`: Architecture decisions and rationale
- `backend/README.md`: Backend setup and API docs
- `prompts/*.md`: Bob prompt templates with examples

## 🐛 Troubleshooting

### "Import could not be resolved"
Install dependencies: `pip install -r requirements.txt`

### "Fixture not found"
Run from project root where `fixtures/` directory exists

### "Token expired"
Check logs for `watsonx_token_refreshed` events. Tokens auto-refresh every 55 minutes.

### "Bob API error"
Verify `BOB_API_KEY` and `BOB_API_URL` in `.env`

## 🤝 Team

Backend Developer - IBM Bob Hackathon 2026

## 📄 License

IBM Bob Hackathon 2026 Project

---

**Built with ❤️ using IBM Bob and watsonx.ai**