# Security Audit — PR Party

**Audit date:** 2026-05-17 (initial) · **re-audited:** 2026-05-17 after `bob_sessions/` push
**Audited by:** Pre-publish documentation pass
**Scope:** Hardcoded credentials, secrets in tracked files, secrets in git history, secrets in committed Bob session exports, secrets currently sitting in your local working tree.
**Reason:** Repo is **already public** at `github.com/macros05/pr_party_ibm_hackthon` for the IBM Bob Hackathon 2026 submission. Per the hackathon rules ([PR_PARTY_SPEC.md §10](PR_PARTY_SPEC.md)), credentials in the repo are **auto-disqualification**.

---

## TL;DR — what you must do *right now*

> 🚨 **CRITICAL — `WATSONX_API_KEY` IS ALREADY PUBLIC ON GITHUB.**
> Two committed `bob_sessions/*.md` files include the full 45-char IBM Cloud API key as part of pasted `.env` contents. The commit (`8a65880`) is already on `origin/main`. **Treat the key as compromised.**
>
> Four additional credentials live in your gitignored env files (`backend/.env` and `apps/web/.env.local`). None were committed, but all were visible to filesystem-access tools (including this audit). Rotate them as defense-in-depth — see §1.

Order matters — earlier steps close exposure, later steps clean evidence:

1. **NOW: Rotate `WATSONX_API_KEY`** in IBM Cloud → Manage → Access (IAM) → API keys → revoke the leaked key and create a new one. Paste into `backend/.env`.
2. **NEXT: Rotate `GEMINI_API_KEY`** at <https://console.cloud.google.com/apis/credentials>. Google's secret scanner is aggressive — `AIzaSy…` keys get auto-disabled if Google sees them anywhere public, so do this even though the key did not leak into commits. Paste new value into `apps/web/.env.local`.
3. **THEN: Scrub `bob_sessions/`** — see §"Scrubbing the leaked Bob sessions" below. Commit + push.
4. **THEN: Rotate `GITHUB_TOKEN`** at <https://github.com/settings/tokens> with minimum scopes (`public_repo` only).
5. **THEN: Rotate `PIXELLAB_API_TOKEN`** at the PixelLab dashboard.
6. **Do not** paste the new tokens into any chat, IDE assistant log, screen recording, or Bob session.
7. Confirm `git status` clean (`backend/.env` and `apps/web/.env.local` should not appear).
8. **Optional but recommended:** rewrite history with `git filter-repo` so the watsonx key string doesn't survive in old commits. After rotation the key is inert, but a leaked-key string in public history is embarrassing and triggers secret scanners on every clone.

> ⏱️ **Estimated effort:** all five rotations + scrub + force-push = ~20 min. History rewrite = ~15 min more.

---

## Findings

### 🔴 1. Live credentials present in untracked `backend/.env` and `apps/web/.env.local`

Five credentials currently live in two gitignored env files on your machine. Both files are correctly excluded from git, but the secrets have all been visible to anything with filesystem-read access (including AI assistants — me, while running this audit). Treat all five as compromised-by-exposure even though none were committed (except #2, see §8).

| # | Item | Where | Format | Status |
|---|---|---|---|---|
| 1 | `WATSONX_API_KEY` | `backend/.env` | `<REDACTED>` *(45-char IBM Cloud API key)* | **Also leaked into commit `8a65880`, see §8.** Rotate first. |
| 2 | `WATSONX_PROJECT_ID` | `backend/.env` | `<REDACTED UUID>` | UUID, not auth-bearing. Safe alone, but also leaked into bob_sessions (§8). |
| 3 | `GITHUB_TOKEN` | `backend/.env` | `<REDACTED>` *(40-char classic PAT, `ghp_…`)* | **Never tracked, never leaked into bob_sessions.** Rotate as defense-in-depth. |
| 4 | `PIXELLAB_API_TOKEN` | `apps/web/.env.local` | `<REDACTED>` *(UUID-format API token)* | **Never tracked, never leaked into bob_sessions.** Used only by `scripts/pixellab/`. Rotate as defense-in-depth. |
| 5 | `GEMINI_API_KEY` | `apps/web/.env.local` | `<REDACTED>` *(39-char Google Cloud API key, `AIzaSy…`)* | **Never tracked, never leaked into bob_sessions.** Used only by `scripts/gemini/`. **Rotate — Google's secret scanner is aggressive and `AIzaSy…` keys get auto-disabled the moment they're spotted on a public surface.** |

**Evidence:**
- `cat backend/.env` and `cat apps/web/.env.local` returned the live values during the audit (files present on disk).
- `git check-ignore -v backend/.env` → `backend/.gitignore:29:.env`. `git check-ignore -v apps/web/.env.local` → `apps/web/.gitignore:35:.env.local`. Both correctly ignored.
- `git ls-files | xargs grep -nE '(<watsonx-prefix>|<gh-prefix>|<pixellab-prefix>|AIzaSy[A-Za-z0-9_-]{20,})'` returned **zero matches** for items 3, 4, 5. Item 1 leaked into `bob_sessions/` (§8). Item 2's UUID also appears in `bob_sessions/` URLs (low-severity).
- `git log --all -- backend/.env apps/web/.env.local` returned **zero history** — neither env file was ever committed.

**Conclusion:** rotate **all five** in this order:
  1. Item #1 (`WATSONX_API_KEY`) — *urgent, publicly leaked*
  2. Item #5 (`GEMINI_API_KEY`) — *urgent-ish, Google may auto-disable; minimal cost to rotate*
  3. Items #3, #4 (`GITHUB_TOKEN`, `PIXELLAB_API_TOKEN`) — *defense-in-depth, do today*
  4. Item #2 (`WATSONX_PROJECT_ID`) — *no rotation needed, just stop pasting it into chat exports*

> 💡 If you have not enabled 2FA on the GitHub account associated with the revoked token, do that now: <https://github.com/settings/security>.

### 🟢 2. No hardcoded credentials in tracked source files

Scanned tracked files (`git ls-files`) for the patterns:

- `ghp_[A-Za-z0-9]{20,}` *(GitHub classic PAT)*
- `gho_[A-Za-z0-9]{20,}` *(GitHub OAuth)*
- `sk-[A-Za-z0-9]{20,}` *(OpenAI / Anthropic style)*
- `(api[_-]?key|token|secret|password|bearer)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}`

**Result:** zero matches outside of:
- `.env.example` files — placeholders only (`your_watsonx_api_key_here`)
- `config.py` — defaults `"test_key"` / `"test_project"` for unit testing

All credential reads go through `pydantic-settings` ([`backend/app/config.py`](backend/app/config.py)). No code path embeds a literal secret.

### 🟢 3. `.gitignore` coverage is correct

Both [`.gitignore`](.gitignore) (repo root) and [`backend/.gitignore`](backend/.gitignore) ignore:

```
.env
.env.local
.env.*.local
```

Verified `backend/.env` resolves to `backend/.gitignore:29` via `git check-ignore -v`.

### 🟢 4. Setup walkthrough deleted; no example PAT in tracked content

The standalone `SETUP_GITHUB_TOKEN.md` (which previously embedded a fake `ghp_…` placeholder that pattern-matched GitHub's secret scanner) has been removed. The minimal instructions live in [`README.md`](README.md#2-configure-environment) and [`.env.example`](.env.example) without a scanner-shaped token literal.

### 🟡 5. `backend/.env.example` and root `.env.example` should stay in sync

The repo now has two example files:
- `backend/.env.example` (the original, scoped to backend)
- `.env.example` (root, created by this documentation pass, consolidated)

They should agree on key names. Confirm before publishing that both point users to the same variable set, or remove one. Recommend keeping the root `.env.example` and deleting `backend/.env.example` to have a single source of truth.

### 🟢 6. No credentials in CI / GitHub Actions

No `.github/workflows/` directory exists. Nothing to audit there yet. If you add CI later, store secrets via GitHub Actions encrypted secrets — never inline.

### 🟢 7. No credentials in fixtures

`fixtures/pr1_security_critical/`, `pr2_mixed_issues/`, `pr3_clean_code/` were spot-checked. The "hardcoded secret" findings in PR1 are **synthetic strings in the test diff** designed to be flagged by Aegis, not real credentials. No real keys leaked into test data.

### 🔴 8. `bob_sessions/` exports leaked the watsonx API key into public commits

**This finding flipped from green to red after commit `8a65880 chore: add bob_sessions task logs and screenshots` (subsequently merged via `c5b0f82`). Both are on `origin/main` and therefore public.**

Two committed session-export markdown files contain the full `WATSONX_API_KEY` value as part of a pasted `.env` block that Bob ingested during a session:

| File | Line | What leaked |
|---|---|---|
| `bob_sessions/bob_task_may-16-2026_11-18-48-pm.md` | 5160 | `WATSONX_API_KEY=<REDACTED — full 45-char IBM Cloud key>` |
| `bob_sessions/bob_task_may-16-2026_11-18-48-pm.md` | 5161 | `WATSONX_PROJECT_ID=<REDACTED UUID>` |
| `bob_sessions/bob_task_may-16-2026_9-01-36-pm.md`  | 1012 | `WATSONX_API_KEY=<REDACTED — same key>` |
| `bob_sessions/bob_task_may-16-2026_9-01-36-pm.md`  | 1013 | `WATSONX_PROJECT_ID=<REDACTED UUID>` |

Additionally, the `WATSONX_PROJECT_ID` appears in pasted watsonx API URLs (`?project_id=…`) across several other session files: `1-17-22-am.md`, `12-55-44-am.md`, `9-05-36-pm.md`, and others. The project ID alone is not a secret (it's a UUID with no auth power), but it tells an attacker which project to target if they have or guess the key.

**What did NOT leak:**
- ✅ No `GITHUB_TOKEN` (`ghp_…`) in any `bob_sessions/` file — checked with `grep -rE 'ghp_[A-Za-z0-9]{30,}'`.
- ✅ No OpenAI / Anthropic style keys (`sk-…`).
- ✅ No IAM bearer tokens or JWTs (`*.eyJ*.*`).
- ✅ No bearer-format access tokens or refresh tokens — the only `iam_token*` matches were the harmless variable name `iam_token_refresh_margin_seconds` in pasted source code.

#### Scrubbing the leaked Bob sessions

Run these commands **after** rotating the watsonx key (TL;DR step 1):

```bash
# 1. Scrub both files in place. Replace <OLD_KEY> with the exact 45-char string.
#    Quoting matters: use single quotes so the shell doesn't interpret '_'.
OLD_KEY='<paste-the-leaked-watsonx-key-here-then-clear-your-terminal>'
sed -i '' "s|${OLD_KEY}|<REDACTED_ROTATED>|g" \
  bob_sessions/bob_task_may-16-2026_11-18-48-pm.md \
  bob_sessions/bob_task_may-16-2026_9-01-36-pm.md

# 2. Verify nothing real is left
grep -rE "<paste-first-8-chars-of-old-key>" bob_sessions/ && echo "❌ STILL LEAKING" || echo "✅ clean"

# 3. Stage, commit, push
git add bob_sessions/bob_task_may-16-2026_11-18-48-pm.md bob_sessions/bob_task_may-16-2026_9-01-36-pm.md
git commit -m "security: scrub leaked watsonx api key from bob_sessions exports

The committed session-export markdowns at lines 5160 and 1012 contained
the full WATSONX_API_KEY pasted from .env. The key has been rotated in
IBM Cloud; this commit redacts the value from the working tree.

Note: the old key still appears in git history at commit 8a65880. It is
revoked and therefore inert, but a follow-up history rewrite (git
filter-repo) is recommended if downstream secret scanners flag it."
git push origin main
```

**Important:** after this, the key string is gone from the **current tree** but still lives in the git **history** (commit `8a65880`'s blob). Since the key is rotated, it is inert — but secret scanners (GitHub's, gitleaks, trufflehog) will continue to flag the repo on every fresh clone. To eliminate the string from history entirely:

```bash
# Requires `git-filter-repo` (pip install git-filter-repo). DESTRUCTIVE: rewrites SHAs.
# Coordinate with your collaborator before doing this; their local clones will need
# `git fetch && git reset --hard origin/main` afterwards.

echo "<old-watsonx-key>==><REDACTED_ROTATED>" > /tmp/replacements.txt
git filter-repo --replace-text /tmp/replacements.txt
git push origin main --force
shred -u /tmp/replacements.txt
```

Skip the history rewrite if you don't have collaborators, time, or stomach for it — the rotation alone closes the security hole. The rewrite is purely cosmetic + alert-suppression.

---

## Post-rotation checklist

In strict order — earlier steps close exposure, later steps clean the evidence:

- [ ] **Step 1 — Close the public exposure.** Revoke old `WATSONX_API_KEY` in IBM Cloud → IAM → API keys. Confirm the old key returns `401` on a curl against `https://us-south.ml.cloud.ibm.com/`.
- [ ] **Step 2 — Issue replacement.** Create new `WATSONX_API_KEY` with the same project access. Paste into `backend/.env`.
- [ ] **Step 3 — Rotate `GEMINI_API_KEY`** at <https://console.cloud.google.com/apis/credentials>. Paste new value into `apps/web/.env.local`.
- [ ] **Step 4 — Scrub the leaked exports.** Run the `sed -i ''` commands in [§8](#-8-bob_sessions-exports-leaked-the-watsonx-api-key-into-public-commits) below. Verify `grep -r "<old-key-prefix>" bob_sessions/` returns nothing.
- [ ] **Step 5 — Commit + push the scrub.** `git push origin main`.
- [ ] **Step 6 — Rotate the GitHub PAT.** Revoke at <https://github.com/settings/tokens>. Re-issue with **only** `public_repo` scope unless you need private-repo access. Paste into `backend/.env`.
- [ ] **Step 7 — Rotate `PIXELLAB_API_TOKEN`** at the PixelLab dashboard. Paste into `apps/web/.env.local`.
- [ ] **Step 8 — Smoke-test the backend.** Re-run `uvicorn app.main:app --reload`. Hit `curl -X POST http://localhost:8000/analyze/sync -H 'Content-Type: application/json' -d '{"use_fixture":"pr1","pr_number":1,"repo_owner":"d","repo_name":"d"}'`. Confirm 200 + verdict.
- [ ] **Step 9 — Smoke-test the regen scripts** (only if you plan to re-run them before the demo). `python scripts/pixellab/client.py --help`, `python scripts/gemini/generate_island.py --help` should not raise `RuntimeError: ... missing`.
- [ ] **Step 10 — (Optional) Rewrite history.** `git filter-repo` per §8 to strip the watsonx key string from commit `8a65880`. Skip unless secret scanners are bothering you.
- [ ] **Step 11 — Tidy.** Confirm `git status` clean. Confirm `git log --all -- backend/.env apps/web/.env.local` empty (it is — neither env file was ever tracked, only Bob's pasted copy of `backend/.env` inside session markdowns).
- [ ] **Step 12 — Final review of this file.** Decide whether to keep `SECURITY_AUDIT.md` in the repo (currently safe — all real secrets are `<REDACTED>` in the visible text) or delete it once the cleanup is done. Either is fine.

> ⚠️ **You can delete this file entirely after rotation.** It exists to drive the rotation, not as permanent documentation. Once the old tokens are dead, the only thing left of value here is the methodology, which is duplicated in [PR_PARTY_SPEC.md §10](PR_PARTY_SPEC.md).

## Going forward

- Pre-commit hook recommendation: install [`gitleaks`](https://github.com/gitleaks/gitleaks) or [`trufflehog`](https://github.com/trufflesecurity/trufflehog) as a pre-commit hook so any future credential never reaches a commit.
- For team work: store `.env` values in **1Password / Bitwarden / IBM Cloud Secrets Manager** and `cp` them locally, never share via Slack/email.
- For deployment: never bake secrets into Docker images; mount via runtime env vars or a secrets manager.
