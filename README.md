# PR Party 🎉

[![Built with IBM Bob](https://img.shields.io/badge/Built%20with-IBM%20Bob-052FAD?style=for-the-badge&labelColor=000)](https://research.ibm.com/)
[![Powered by watsonx.ai](https://img.shields.io/badge/Powered%20by-watsonx.ai-0F62FE?style=for-the-badge&labelColor=000)](https://www.ibm.com/watsonx)
[![IBM Bob Hackathon 2026](https://img.shields.io/badge/IBM%20Bob%20Hackathon-2026-FFD43B?style=for-the-badge&labelColor=000)](#)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)

> **Code review you actually want to read.**
> Six specialist AI characters analyze your Pull Request in parallel — security, database, UX, architecture, tests, docs — and report findings as an RPG encounter with damage, verdicts, and cross-character dialogue. Built end-to-end with **IBM Bob** (cognitive core), **watsonx.ai** (per-character voice), and Anthropic's **Mythos two-pass pattern** for noise filtering.

📺 **[Demo video](VIDEO_SCRIPT.md)** · 📋 **[Presentation deck](PRESENTATION.md)** · 🔐 **[Security notes](SECURITY_AUDIT.md)** · 🧠 **[Bob session exports](bob_sessions/)** *(submission artifact)*

---

## Why this exists

Existing PR-review bots dump 40 equal-weight bullets, devs stop reading them, and critical issues ship to production. PR Party reframes the review as a turn-based encounter: severity becomes visual hierarchy, each finding has an author with a voice, and disagreements between agents surface as dialogue instead of contradictory verdicts. The metaphor is information design in disguise.

See [PRESENTATION.md](PRESENTATION.md) for the full problem framing, architecture, and impact metrics.

## The six characters

| Character | Class | Domain |
|---|---|---|
| **Aegis** 🛡️ | Security Paladin | Injections, XSS, auth bypass, hardcoded secrets, CVE-tagged deps |
| **Schema** 🔮 | Database Mage | N+1 queries, missing indexes, dangerous migrations, deadlocks |
| **Pixel** 🎨 | UX Bard | Accessibility, contrast, copy, loading/error/empty states |
| **Atlas** 🗺️ | Architecture Explorer | Patterns, coupling, layers, consistency with the repo |
| **Echo** ⚗️ | Test Priest | Coverage, edge cases, asserts, flakiness |
| **Codex** 📜 | Docs Scribe | Outdated docs, OpenAPI drift, mentirous comments |

### Damage system

| Severity | Action | Damage |
|---|---|---|
| Critical (RCE, data loss, auth bypass) | `crit_hit` | 80–100 |
| High (serious bug, likely regression) | `hit` | 40–70 |
| Medium (smell, clear tech debt) | `graze` | 15–35 |
| Low (nit, opinion) | `whisper` | 5–10 |

PR starts at **100 HP**. **≥80 damage → blocked**. **50–79 → changes required**. **<50 → approved**.

## Tech stack

- **Backend**: Python 3.11+, FastAPI, uvicorn, Pydantic v2, structlog
- **AI core**: IBM Bob (Plan + Code modes for prompt design and architecture review), watsonx.ai Granite / Llama-4 Maverick for voice rewriting
- **Streaming**: Server-Sent Events (sse-starlette + raw StreamingResponse) — six character pipelines fan out with `asyncio.as_completed`, fastest character ships first, one failure doesn't abort the others
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion, sprite-based world with parallax islands
- **Testing**: pytest + pytest-asyncio over classifier, models, API, fixture loader
- **Demo safety net**: three pre-recorded fixture PRs in `fixtures/` — offline demo works even if watsonx is unreachable

## Quick start

### Prerequisites
- Python **3.11+**
- Node.js **20+** (or **18 LTS**)
- An **IBM watsonx.ai** account + API key + project ID ([get one](https://cloud.ibm.com/catalog/services/watsonx-ai))
- *(Optional)* A **GitHub personal access token** for analyzing live PRs ([create one](https://github.com/settings/tokens))

### 1. Clone

```bash
git clone https://github.com/macros05/pr_party_ibm_hackthon.git
cd pr_party_ibm_hackthon
```

### 2. Configure environment

```bash
# Backend env (required) — watsonx + GitHub
cp .env.example backend/.env
# Edit backend/.env with your watsonx + GitHub credentials
```

The frontend defaults to `http://localhost:8000` for the API and needs **no** env file for normal use. Only create `apps/web/.env.local` if you need to override the API URL or run the optional sprite/island regeneration scripts:

```bash
# Frontend env (optional)
# - NEXT_PUBLIC_API_URL — only if backend is not on localhost:8000
# - PIXELLAB_API_TOKEN  — only for scripts/pixellab/ (sprite regen)
# - GEMINI_API_KEY      — only for scripts/gemini/  (island art regen)
# See the bottom of .env.example for the full template.
```

> ⚠️ **Never commit `.env` or `.env.local`.** Both are gitignored. See [SECURITY_AUDIT.md](SECURITY_AUDIT.md) for credential hygiene and rotation guidance.

### 3. Run the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- API docs: <http://localhost:8000/docs>
- Health: <http://localhost:8000/>
- Available fixtures: <http://localhost:8000/fixtures>

### 4. Run the frontend

```bash
cd apps/web
npm install                       # or pnpm install
npm run dev
```

Open <http://localhost:3000> and pick a fixture.

### 5. Try the API directly

```bash
# Streaming (preferred — per-character results land as each agent finishes)
curl -N -X POST http://localhost:8000/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"use_fixture":"pr1","pr_number":1,"repo_owner":"demo","repo_name":"demo"}'

# Synchronous (returns the full EncounterResult once everything is done)
curl -X POST http://localhost:8000/analyze/sync \
  -H "Content-Type: application/json" \
  -d '{"use_fixture":"pr2","pr_number":2,"repo_owner":"demo","repo_name":"demo"}'

# Live GitHub PR (requires GITHUB_TOKEN in .env for private repos / higher rate limits)
curl -N -X POST http://localhost:8000/analyze/stream \
  -H "Content-Type: application/json" \
  -d '{"github_url":"https://github.com/owner/repo/pull/123"}'
```

## Project structure

```
pr_party_ibm_hackthon/
├── PRESENTATION.md           ← hackathon pitch (problem, solution, Bob narrative)
├── VIDEO_SCRIPT.md           ← 3:30 demo video script with timing
├── README.md                 ← you are here
├── SECURITY_AUDIT.md         ← credential rotation log (rotate before publishing!)
├── .env.example              ← canonical env var template
│
├── apps/web/                 ← Next.js 16 / React 19 frontend
│   ├── app/                  ← App Router (page.tsx home, island/, preview/)
│   ├── components/           ← character-panel/, sprite/, world/, islands/, battle/
│   ├── lib/api/              ← SSE client, use-island-analysis-remote hook
│   ├── tokens/               ← per-character design tokens (color palettes)
│   └── package.json
│
├── backend/                  ← FastAPI orchestrator
│   ├── app/main.py           ← /analyze, /analyze/stream, /analyze/sync, /fixtures
│   ├── app/config.py         ← pydantic-settings, .env loader
│   ├── app/models.py         ← Pydantic models (the JSON contract)
│   ├── app/services/
│   │   ├── orchestrator.py   ← Mythos pipeline + per-character streaming
│   │   ├── classifier.py     ← finding → character assignment
│   │   ├── voice_rewriter.py ← Granite tone-shaping
│   │   └── fixture_loader.py ← offline demo fallback
│   ├── app/clients/
│   │   ├── bob_client.py     ← Searcher + Validator passes
│   │   ├── watsonx_client.py ← IAM token refresh (5 min margin)
│   │   └── github_client.py  ← PR diff + context fetching
│   ├── tests/                ← pytest + pytest-asyncio
│   └── requirements.txt
│
├── prompts/                  ← Bob master prompts (the IP)
│   ├── bob_searcher*.md      ← global + variant searchers
│   ├── bob_validator.md      ← Mythos validator pass
│   └── character_*.md        ← six specialist prompts
│
├── fixtures/                 ← pre-recorded PRs for offline demo
│   ├── pr1_security_critical/  → 274 dmg, BLOCKED, 7 findings
│   ├── pr2_mixed_issues/       → 162 dmg, CHANGES REQUIRED, 8 findings
│   └── pr3_clean_code/         → 44 dmg, APPROVED, 3 findings
│
├── scripts/                  ← auxiliary scripts (pixellab, gemini exporters)
├── validation/               ← prompt validation analyses
├── DECISIONS.md              ← architecture decision log
├── PR_PARTY_SPEC.md          ← original technical spec
└── AGENTS.md                 ← rules for agents working in this repo
```

## How IBM Bob was used

Bob is **not a sprinkle of AI** on this project; it is the cognitive engine. Concretely:

1. **Prompt design (Bob Plan mode)** — the six per-character searcher prompts in `prompts/character_*.md` and the validator in `prompts/bob_validator.md` were designed by iterating with Bob against real PR fixtures until JSON output was rock-solid.
2. **Mythos two-pass pattern** — borrowed from Anthropic's Mythos preview. One Bob *searches* the diff; a second Bob *validates* its own raw findings to kill false positives. This is the key noise-reduction differentiator.
3. **Architecture audits (Bob Code mode)** — the per-character `asyncio.as_completed` streaming refactor ([`orchestrator.py:358`](backend/app/services/orchestrator.py#L358)) was driven by Bob identifying the validator as the bottleneck in the original sequential pipeline. Resulting speedup: **~6×**.
4. **Classifier + damage tables** — the mapping from raw finding → character ownership → damage value was designed inside Bob.

The full Bob session exports (screenshots + markdown) live in `bob_sessions/` per the hackathon submission rules.

Bob budget: **40 Bobcoins backend + 40 frontend** (audit / accessibility passes).

## Testing

```bash
cd backend
pytest                            # all tests
pytest --cov=app --cov-report=term # with coverage
pytest tests/test_classifier.py   # one suite
```

See [`backend/TEST_PLAN.md`](backend/TEST_PLAN.md) for the full testing strategy.

## Contributing

This is a hackathon submission, but contributions are welcome after judging closes.

1. Fork & branch from `main`
2. **Run the analyzer on your own PR first** — eat your own dog food
3. Add or update fixtures in `fixtures/` for any new pattern your character should catch
4. Open a PR with a description of which character it affects and why

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `pydantic_settings.ValidationError` on startup | `.env` missing | `cp .env.example backend/.env` and fill it in |
| `401 Unauthorized` from watsonx | API key wrong or IAM token expired | Verify `WATSONX_API_KEY`; the client auto-refreshes every 55 min |
| `403 rate limit exceeded` from GitHub | Anonymous GitHub calls capped at 60/h | Add `GITHUB_TOKEN` to `.env` |
| SSE connection drops after a few seconds | Proxy buffering | The server already sends `X-Accel-Buffering: no`; check your reverse proxy / dev tunnel |
| Frontend shows "analyzing" forever | Backend not running or CORS blocked | Check `CORS_ORIGINS` in `.env` includes `http://localhost:3000` |
| `Fixture not found` | Running from wrong directory | Run uvicorn from repo root or `cd backend` |

## License

This project is released under the **MIT License** for the IBM Bob Hackathon 2026 submission. See `LICENSE` *(to be added before public release)*.

The "Built with IBM Bob" badge and any IBM marks are used under hackathon-participation guidance.

---

**Team:** Marcos Morales (Backend & Agents) + Frontend collaborator
**Hackathon:** IBM Bob Hackathon 2026 — *Turn idea into impact faster*
**Built with:** ❤️, IBM Bob, watsonx.ai, FastAPI, Next.js
