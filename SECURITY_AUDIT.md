# Security Audit — PR Party

**Audit date:** 2026-05-17
**Audited by:** Pre-publish documentation pass
**Scope:** Hardcoded credentials, secrets in tracked files, secrets in git history, secrets currently sitting in your local working tree.
**Reason:** Repo is about to be made public for the IBM Bob Hackathon 2026 submission. Per the hackathon rules ([PR_PARTY_SPEC.md §10](PR_PARTY_SPEC.md)), credentials in the repo are **auto-disqualification**.

---

## TL;DR — what you must do *before publishing*

> 🚨 **CRITICAL — ROTATE THESE TWO CREDENTIALS NOW.**
> They live in your local `backend/.env`. The file itself is gitignored and **was not committed**, but you should still rotate because:
> 1. Local files leak (stolen laptops, screen-shares, cloud backups, IDE plugins that send context to third parties — including this very documentation session, where I read your `.env` in plain text).
> 2. Hackathon repos get cloned widely; reviewers will pull your code. If anything ever did slip into a commit, you want the keys already dead.

1. **Rotate `WATSONX_API_KEY`** in IBM Cloud → IAM → API keys → revoke and re-issue.
2. **Rotate `GITHUB_TOKEN`** at <https://github.com/settings/tokens> → revoke the `ghp_…` token currently in your `backend/.env`.
3. Replace both in `backend/.env` after rotation.
4. **Do not** paste the new tokens into any chat, IDE assistant log, or screen recording.
5. Confirm with `git status` that `backend/.env` does **not** appear (it should be ignored).

After steps 1–5, the repo is safe to publish.

---

## Findings

### 🔴 1. Live credentials present in untracked `backend/.env`

| Item | Value (REDACT before sharing this file widely) | Status |
|---|---|---|
| `WATSONX_API_KEY` | `<REDACTED>` *(45-char IBM Cloud API key, valid format)* | **In your local `.env`. Not tracked.** Rotate. |
| `WATSONX_PROJECT_ID` | `<REDACTED>` | UUID, not a secret on its own — safe to share. |
| `GITHUB_TOKEN` | `<REDACTED>` *(40-char classic PAT)* | **In your local `.env`. Not tracked.** Revoke. |

**Evidence:**
- `cat backend/.env` returned these values during the audit (file present on disk).
- `git check-ignore -v backend/.env` resolved to `backend/.gitignore:29:.env` — file is correctly ignored.
- `git ls-files | xargs grep -nE '(<your-gh-prefix>|<your-watsonx-prefix>)'` returned **zero matches** — neither secret has ever been tracked.
- `git log --all -- backend/.env` returned **zero history** — the file was never committed.

**Conclusion:** the credentials are not in the public repo, but they exist on this machine. Both have been visible to anything with filesystem read access (including the documentation-generation assistant that produced this very audit). **Rotate both.**

> 💡 If you have not enabled 2FA on the GitHub account associated with the revoked token, do that now: <https://github.com/settings/security>.

### 🟢 2. No hardcoded credentials in tracked source files

Scanned tracked files (`git ls-files`) for the patterns:

- `ghp_[A-Za-z0-9]{20,}` *(GitHub classic PAT)*
- `gho_[A-Za-z0-9]{20,}` *(GitHub OAuth)*
- `sk-[A-Za-z0-9]{20,}` *(OpenAI / Anthropic style)*
- `(api[_-]?key|token|secret|password|bearer)\s*[:=]\s*['"][A-Za-z0-9_\-\.]{16,}`

**Result:** zero matches outside of:
- `.env.example` files — placeholders only (`your_watsonx_api_key_here`)
- `SETUP_GITHUB_TOKEN.md` — example token (`ghp_1234567890abcdefghijklmnopqrstuvwxyz`) clearly labeled as illustration
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

### 🟡 4. Example token in `SETUP_GITHUB_TOKEN.md` could trigger secret scanners

`SETUP_GITHUB_TOKEN.md:71` contains:

```
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz
```

This is **clearly a fake** (sequential `0123…wxyz`), but GitHub's own secret scanner pattern-matches `ghp_[A-Za-z0-9]{36}` and may flag it. It will not be revokable (it's not real), but it can clutter your security alerts.

**Recommended fix:** change it to `ghp_REPLACE_WITH_YOUR_TOKEN` or `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (already used on line 48 of the same file).

### 🟡 5. `backend/.env.example` and root `.env.example` should stay in sync

The repo now has two example files:
- `backend/.env.example` (the original, scoped to backend)
- `.env.example` (root, created by this documentation pass, consolidated)

They should agree on key names. Confirm before publishing that both point users to the same variable set, or remove one. Recommend keeping the root `.env.example` and deleting `backend/.env.example` to have a single source of truth.

### 🟢 6. No credentials in CI / GitHub Actions

No `.github/workflows/` directory exists. Nothing to audit there yet. If you add CI later, store secrets via GitHub Actions encrypted secrets — never inline.

### 🟢 7. No credentials in fixtures

`fixtures/pr1_security_critical/`, `pr2_mixed_issues/`, `pr3_clean_code/` were spot-checked. The "hardcoded secret" findings in PR1 are **synthetic strings in the test diff** designed to be flagged by Aegis, not real credentials. No real keys leaked into test data.

### 🟢 8. No credentials in `bob_sessions/` exports

The `bob_sessions/` directory either does not yet exist or contains only screenshots. Confirm before submission that no exported session markdown shows a real API key (Bob session exports sometimes include the `.env` contents if the user pasted them into the chat). Quick check before publishing:

```bash
grep -rE "ghp_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9]{20,}" bob_sessions/ 2>/dev/null
```

Should return zero lines.

---

## Post-rotation checklist

After you rotate the keys:

- [ ] New `WATSONX_API_KEY` issued and pasted into `backend/.env`
- [ ] New `GITHUB_TOKEN` issued (minimal scopes: `public_repo` only, unless you specifically need private repo access) and pasted into `backend/.env`
- [ ] Old `WATSONX_API_KEY` deleted from IBM Cloud
- [ ] Old `GITHUB_TOKEN` revoked at <https://github.com/settings/tokens>
- [ ] Re-ran `uvicorn app.main:app --reload` to confirm backend still starts cleanly
- [ ] Re-ran one fixture (`curl … "use_fixture":"pr1"`) to confirm watsonx still answers
- [ ] If new GitHub token was needed for live-PR demos: re-ran one live PR analysis
- [ ] Confirmed `git status` is clean (no `.env` accidentally staged)
- [ ] Confirmed `git log --all -- backend/.env` still empty
- [ ] Deleted or fixed the example token in `SETUP_GITHUB_TOKEN.md:71` (recommended, see §4 above)
- [ ] Deleted this `SECURITY_AUDIT.md` **or** redacted §1 before making the repo public (it currently names the leaked tokens by prefix — informative for you, embarrassing for the public repo)

> ⚠️ **You can delete this file entirely after rotation.** It exists to drive the rotation, not as permanent documentation. Once the old tokens are dead, the only thing left of value here is the methodology, which is duplicated in [PR_PARTY_SPEC.md §10](PR_PARTY_SPEC.md).

## Going forward

- Pre-commit hook recommendation: install [`gitleaks`](https://github.com/gitleaks/gitleaks) or [`trufflehog`](https://github.com/trufflesecurity/trufflehog) as a pre-commit hook so any future credential never reaches a commit.
- For team work: store `.env` values in **1Password / Bitwarden / IBM Cloud Secrets Manager** and `cp` them locally, never share via Slack/email.
- For deployment: never bake secrets into Docker images; mount via runtime env vars or a secrets manager.
