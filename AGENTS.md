# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project: PR Party - Multi-Agent PR Review System

IBM Bob Hackathon 2026 project. Backend developer working on FastAPI orchestrator + Bob-powered analysis engine.

## Stack
- **Backend**: Python 3.11+, FastAPI, uvicorn
- **AI Core**: IBM Bob (analysis), watsonx.ai Granite 3.3 (voice rewriting)
- **Streaming**: Server-Sent Events (SSE)
- **Frontend**: Next.js 14, React, TypeScript, Tailwind, Framer Motion (separate repo/developer)

## Critical Architecture Decisions

### Bob Usage Pattern (Mythos-Style)
Bob makes TWO passes on every PR analysis:
1. **Buscador (Searcher)**: Analyzes diff → produces findings_raw.json (technical, no voice)
2. **Validador (Validator)**: Receives diff + findings_raw → filters noise → findings_validated.json

This is NOT optional - it's the core differentiator. Mention "Mythos pattern from Anthropic" in pitch.

### Findings Flow
```
diff → Bob Pass 1 (searcher) → findings_raw.json
     → Bob Pass 2 (validator) → findings_validated.json
     → Classifier → findings_assigned.json (with character_ids)
     → Granite (per character) → findings_voiced.json
     → SSE stream → Frontend
```

### JSON Contract (IMMUTABLE after hour 2)
See PR_PARTY_SPEC.md section 4. Frontend consumes this exact structure. Any change requires sync with frontend dev.

### Six Characters (Specialists)
1. **Aegis** (Security Paladin): injections, XSS, auth, CVEs
2. **Schema** (DB Mage): N+1, indexes, migrations, locks
3. **Pixel** (UX Bard): a11y, contrast, copy, states
4. **Atlas** (Architecture Explorer): patterns, coupling, consistency
5. **Echo** (Test Priest): coverage, edge cases, mocks
6. **Codex** (Docs Scribe): outdated docs, comments

### Damage System
- Critical (RCE, data loss): 80-100 dmg → "crit_hit"
- High (serious bug): 40-70 dmg → "hit"
- Medium (smell): 15-35 dmg → "graze"
- Low (nit): 5-10 dmg → "whisper"
- PR starts at 100 HP. ≥80 dmg = blocked, 50-79 = changes required, <50 = approved

## Bobcoin Budget: 40 total
Use Bob ONLY for:
- Master prompt design (searcher + validator)
- Findings classifier logic
- Damage calculation engine
- Dialogue detector between characters

Use Claude Code for:
- FastAPI scaffolding
- watsonx.ai client (IAM token refresh every 60min)
- SSE implementation
- GitHub API client
- Fixtures and test data

## Commands
(Will be populated as project structure is built)

## Code Style
- Python: Type hints mandatory, Pydantic models for all JSON schemas
- Async/await for all I/O operations
- Structured logging (JSON format) for all Bob/Granite calls
- No API keys in code - use .env from first commit

## Testing Strategy
- 3 fixture PRs with pre-generated findings for offline demo
- PR1: Security critical (blocked)
- PR2: Mixed issues (changes required)
- PR3: Clean code (approved)

## Critical Gotchas
- watsonx.ai IAM tokens expire after 60min - implement refresh logic
- Bob context limit: ~50k tokens (diff + package.json + 1-level imports only)
- SSE must handle client disconnection gracefully
- Export bob_sessions/ directory with screenshots for submission (MANDATORY)

## Submission Requirements
- Folder `bob_sessions/` with task session exports (screenshots + markdown)
- NO API keys in repo (auto-disqualification)
- README with setup instructions
- 3min demo video with subtitles