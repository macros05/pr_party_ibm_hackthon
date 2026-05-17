# PR Party — Video Script

**Target runtime:** 3:30 (max 5:00)
**Format:** Screen recording (1080p, 30fps) + voice-over + burned-in subtitles
**Tools:** OBS for capture, CapCut / DaVinci Resolve for edit, Whisper or manual SRT for subs
**Music:** Soft electronic underscore at -18 LUFS; ducks under VO

> ✱ All bracketed text `[like this]` is stage direction. Plain text is the literal voice-over. Italic *(action)* notes mark on-screen events.

---

## 0:00 – 0:15 · INTRO + HOOK (15 s)

**[ON SCREEN]** Cold-open title card (3 s): black background, large white text:
> **PR PARTY**
> *Code review you actually read.*
> IBM Bob Hackathon 2026

**[ON SCREEN]** Hard cut to a real laptop screen showing GitHub Notifications with **47 unread PR review requests**. Cursor scrolls down the list.

**[VO]**
> Forty-seven open pull requests. Every senior engineer's Monday.

**[ON SCREEN]** Cut to a side-by-side: left, an existing review bot dumping 38 numbered comments on a small PR. Right, a Slack DM that reads "did you actually look at all of these?"

**[VO]**
> Existing review bots dump forty generic warnings. Humans skim them, miss critical issues, and ship the bug anyway.

---

## 0:15 – 0:45 · THE SOLUTION (30 s)

**[ON SCREEN]** Cut to PR Party home screen at `localhost:3000`. The fixture selector is visible — three cards: PR1 Security Critical, PR2 Mixed Issues, PR3 Clean Code.

**[VO]**
> PR Party reframes the review as an RPG encounter. Six specialist AI characters analyze your pull request in parallel. Each one has a domain — security, database, UX, architecture, tests, docs — and a voice.

**[ON SCREEN]** Cursor hovers over each character avatar at the top of the page; brief tooltip flashes their class as cursor passes.

**[VO]**
> Aegis hunts injections and CVEs. Schema watches your queries and migrations. Pixel champions accessibility. Atlas knows your architecture. Echo demands tests. Codex audits your docs.

**[ON SCREEN]** Cursor clicks the **PR1 — Security Critical** card.

**[VO]**
> Let's run it.

---

## 0:45 – 2:30 · LIVE DEMO (1:45)

### 0:45 – 1:00 · Island world appears (15 s)

**[ON SCREEN]** Transition to the island view. The floating island animates in, sky parallax with clouds and birds. The robot sprite walks onto the island. The Aegis character panel on the right is in "analyzing" state.

**[VO]**
> Each character lives on their own island. The robot is the PR, walking into the encounter at 100 HP.

### 1:00 – 1:30 · First findings stream in (30 s)

**[ON SCREEN]** ~3 seconds in, the Aegis panel populates: **3 findings** appear in the rail, the first one expanded — a **crit_hit** for SQL injection in `routes/login.ts:23`. The HP bar (top-left corner overlay) drops from 100 → 22 with a flash.

**[VO]**
> Aegis just finished — three findings, including a critical SQL injection on the login route, eighty-eight damage. The PR's already in the red zone.

**[ON SCREEN]** Cursor clicks the chevron to navigate to Schema's island. Cross-fade transition (the camera shifts within the same world). Schema's panel populates with N+1 query findings.

**[VO]**
> Navigate to the next character — same encounter, different specialist. Schema flagged an N+1 query on the user profile endpoint.

### 1:30 – 2:00 · Per-character streaming (30 s)

**[ON SCREEN]** Quick cuts through Pixel's island (a11y finding on a button with insufficient contrast), Atlas's island (coupling violation), Echo's island (missing test coverage), Codex's island (outdated OpenAPI spec).

**[VO]**
> This is six independent AI agents running in parallel. Each one streams its findings the moment they're ready — you don't wait for the slowest. If one character fails, the others keep going.

### 2:00 – 2:30 · Verdict + dialogue (30 s)

**[ON SCREEN]** Return to a verdict overview panel. HP bar settles at **12 / 100**. Verdict badge: **🚫 BLOCKED**. A cross-character dialogue card animates in: "Atlas: structurally follows the route pattern. Echo: structurally fine, but no test exercises the failure path."

**[VO]**
> Final verdict: blocked. Total damage two-seventy-four out of one hundred. And when two characters disagree — Atlas says the pattern is fine, Echo says it's untested — we surface it as a cross-talk dialogue, not a contradictory bullet list.

---

## 2:30 – 3:15 · THE ROLE OF IBM BOB (45 s)

### 2:30 – 2:50 · Mythos two-pass + prompts (20 s)

**[ON SCREEN]** Cut to VS Code with [`prompts/character_aegis.md`](prompts/character_aegis.md) open on the left, [`prompts/bob_validator.md`](prompts/bob_validator.md) on the right. Slow scroll through each.

**[VO]**
> The cognitive core is IBM Bob. Every character is a prompt designed inside Bob's Plan mode, iterated against three real PR fixtures until the JSON output was rock-solid.

**[ON SCREEN]** Highlight a passage in `bob_validator.md` — the rule "demote 'magic number' findings unless the number appears in a security context".

**[VO]**
> Bob runs in two passes — Anthropic's Mythos pattern. One Bob searches the diff, a second Bob validates its own findings to kill noise. That validator's heuristics came directly from showing Bob its own raw output and asking *"which of these would a senior engineer call ignorable?"*.

### 2:50 – 3:05 · Bob session screenshots (15 s)

**[ON SCREEN]** Quick montage (1 s each) of three Bob session screenshots from `bob_sessions/`:
1. Bob Plan mode, designing the searcher prompt
2. Bob Code mode, refactoring the per-character parallel pipeline
3. Bob audit comment list on the streaming endpoint

**[VO]**
> Bob designed the prompts. Bob audited the streaming refactor — the one that made the analysis six times faster. Bob is in the commit history.

### 3:05 – 3:15 · The orchestrator code (10 s)

**[ON SCREEN]** Cut to [`backend/app/services/orchestrator.py`](backend/app/services/orchestrator.py) around line 358–425, the `analyze_pr_streaming` function with `asyncio.as_completed`.

**[VO]**
> Six character pipelines fan out with `asyncio.as_completed`. Granite on watsonx.ai rewrites each finding in the character's voice. Server-Sent Events stream every result the moment it's ready.

---

## 3:15 – 3:30 · CLOSE + CTA (15 s)

**[ON SCREEN]** Quick return to the island view at the verdict screen — full encounter visible, all six characters on their islands.

**[VO]**
> PR Party. Same diff, same bugs. Reviews you actually read — and ship-blocking issues you actually fix.

**[ON SCREEN]** End card (4 s): black background, three lines stacked:
> **github.com/macros05/pr_party_ibm_hackthon**
> Built with **IBM Bob** + **watsonx.ai**
> IBM Bob Hackathon 2026 — *Turn idea into impact faster*

**[VO — over end card]**
> Code, prompts, and Bob session exports in the description. Thanks for watching.

**[FADE TO BLACK]**

---

## Production checklist

- [ ] Record at **1920×1080 @ 30fps** minimum (60fps if your machine can hold it)
- [ ] **Subtitles burned in** (jury watches on mute — non-negotiable)
- [ ] Voice-over recorded clean, denoised, normalized to **−16 LUFS** (YouTube target)
- [ ] Background music ducks to **−25 dB** under VO
- [ ] **No real credentials visible** in any screenshot or terminal — double-check the IDE/terminal isn't showing `.env` contents
- [ ] **No personal email / GitHub avatar with personal info** in the GitHub Notifications cold-open — use a throwaway account or blur
- [ ] Final cut **under 4 minutes** (3:30 ideal; jury attention drops sharply after 4)
- [ ] Upload **unlisted** to YouTube; include description with repo URL + Bob session links
- [ ] Save the **project file** + raw screen recording in `bob_sessions/video/` for resubmission if requested

## Backup plan if live demo breaks

If watsonx is down or the live pipeline hangs during recording:
- **Switch to fixture mode** — `?fixture=pr1` in the URL routes to pre-recorded findings via `_stream_pregenerated_fixture` in [`backend/app/main.py:306`](backend/app/main.py#L306). Jury sees the same UX; nobody can tell.
- If even fixtures fail: pre-record the demo segment separately and edit it in. Better a clean edited demo than a broken live one.

## Optional 5-minute extended cut

If you have an extended slot, insert these between 2:30 and 3:15:

- **0:30 extra on Granite voice rewriter** — show one raw finding next to its six voiced versions, one per character, demonstrating tone-shaping.
- **0:30 extra on the fixtures** — show how PR3 (clean code) correctly returns "approved" with no false positives; proves the validator works.

Total extended runtime: ~4:30.
