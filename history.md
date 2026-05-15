# PR Party - Development History

## Project Goal
Build a multi-agent PR review system for IBM Bob Hackathon 2026 that uses:
- **Bob** (2-pass Mythos pattern): Searcher → Validator
- **Granite 3.3**: Voice rewriting for 6 specialist characters
- **FastAPI**: Orchestrator backend with SSE streaming
- **Next.js**: Frontend (separate repo/developer)

**Core Innovation**: Bob makes TWO passes (Buscador + Validador) to reduce false positives, then 6 RPG characters deliver findings with personality.

---

## What We Want to Achieve

### Phase 1: Foundation (Hours 0-4)
- [x] Project structure and documentation
- [x] Bob prompt design (searcher + validator)
- [x] PR fixtures for offline demo (3 complete)
- [x] Validate Bob prompts against fixtures
- [x] Refine prompts based on validation

### Phase 2: Backend Core (Hours 2-6)
- [ ] FastAPI scaffolding
- [ ] Bob integration (2-pass system)
- [ ] Findings classifier (assign to characters)
- [ ] Damage calculation engine
- [ ] watsonx.ai Granite client (IAM token refresh)

### Phase 3: Streaming & Integration (Hours 6-10)
- [ ] SSE implementation
- [ ] GitHub API client
- [ ] Character dialogue detector
- [ ] Frontend integration testing

### Phase 4: Polish & Submission (Hours 10-12)
- [x] 3 fixture PRs with pre-generated findings
- [ ] Demo video (3min with subtitles)
- [ ] Export bob_sessions/ with screenshots
- [ ] Final README and setup instructions

---

## What Has Been Done

### Session 1: Project Setup & Documentation
**Date**: 2026-05-15 (Hour 0-1)

#### Created Files:
1. **AGENTS.md** - Agent rules and architecture decisions
2. **DECISIONS.md** - Critical technical decisions log
3. **PR_PARTY_SPEC.md** - Complete system specification
4. **types/encounter.ts** - TypeScript type definitions for JSON contract
5. **prompts/bob_searcher.md** - Bob Pass 1 (Buscador) prompt
6. **prompts/bob_validator.md** - Bob Pass 2 (Validador) prompt

#### Key Decisions Made:
- **Mythos Pattern**: Bob makes 2 passes (not optional)
- **6 Characters**: Aegis, Schema, Pixel, Atlas, Echo, Codex
- **Damage System**: 100 HP, ≥80 dmg = blocked
- **JSON Contract**: Immutable after hour 2
- **Bobcoin Budget**: 40 total (use Claude Code for scaffolding)

### Session 2: PR Fixture #1 (Security Critical)
**Date**: 2026-05-15 (Hour 1-2)

#### Created Files:
1. **fixtures/pr1_security_critical/diff.patch**
   - Realistic diff with multiple vulnerabilities
   - RCE via file upload, path traversal, missing auth
   - DB operations without transaction
   - No tests or documentation

2. **fixtures/pr1_security_critical/package.json**
   - Context: multer, express, pg dependencies

3. **fixtures/pr1_security_critical/context/db.ts**
   - 1-level deep import for Bob context

4. **fixtures/pr1_security_critical/expected_findings_raw.json**
   - 7 findings from Bob Searcher
   - 2 critical, 1 high, 2 medium, 2 low

5. **fixtures/pr1_security_critical/expected_findings_validated.json**
   - All findings validated as true
   - Confidence scores 0.75-0.99
   - One improvement suggestion

6. **fixtures/pr1_security_critical/README.md**
   - Complete documentation
   - Vulnerability details
   - Expected damage: 274 total → BLOCKED
   - Character assignments
   - Expected dialogues

#### Fixture Characteristics:
- **Total Damage**: 274 (≥80 = BLOCKED)
- **Vulnerabilities**: 7 total
  - Critical: RCE (100 dmg), Path Traversal (90 dmg)
  - High: Auth Bypass (50 dmg)
  - Medium: Transaction (20 dmg), Tests (10 dmg)
  - Low: Error Handling (2 dmg), Docs (2 dmg)
- **Character Distribution**:
  - Aegis: 3 findings (security)
  - Schema: 1 finding (DB)
  - Echo: 1 finding (tests)
  - Codex: 1 finding (docs)
  - Atlas: 1 finding (error handling)

#### Fixture Characteristics (PR2):
- **Total Damage**: 162 (50-79 = CHANGES REQUIRED)
- **Issues**: 8 total
  - High: N+1 Query (50 dmg)
  - Medium: Missing Index (30 dmg), Accessibility (25 dmg), Error Handling (20 dmg), Tests (18 dmg)
  - Low: Docs (8 dmg), Magic Numbers (6 dmg), Naming (5 dmg)
- **Character Distribution**:
  - Schema: 2 findings (performance)
  - Pixel: 1 finding (accessibility)
  - Atlas: 3 findings (architecture/quality)
  - Echo: 1 finding (tests)
  - Codex: 1 finding (docs)

#### Fixture Characteristics (PR3):
- **Total Damage**: 44 (<50 = APPROVED)
- **Issues**: 3 minor findings
  - Medium: Rate Limiting (30 dmg)
  - Low: Docs (8 dmg), Test Gap (6 dmg)
- **Character Distribution**:
  - Aegis: 1 finding (security enhancement)
  - Echo: 1 finding (test coverage)
  - Codex: 1 finding (documentation)
- **Positive Aspects**: 10+ best practices documented

---

## Notes & Issues

### Design Decisions
1. **Why 2-pass Bob?**
   - Reduces false positives (Mythos pattern from Anthropic)
   - Searcher finds everything, Validator filters noise
   - Core differentiator for pitch

2. **Why 6 characters?**
   - Covers all PR review aspects
   - RPG theme makes findings memorable
   - Each has distinct voice via Granite

3. **Why damage system?**
   - Gamifies severity
   - Clear thresholds for PR status
   - Visual feedback for frontend

### Technical Constraints
1. **Bob Context Limit**: ~50k tokens
   - Only include: diff + package.json + 1-level imports
   - No full codebase analysis

2. **watsonx.ai IAM Tokens**: Expire after 60min
   - Must implement refresh logic
   - Critical for demo stability

3. **SSE Streaming**: Must handle disconnections
   - Client may refresh during analysis
   - Need reconnection logic

### Known Risks
1. **JSON Contract Changes**: After hour 2, any change requires frontend sync
2. **API Keys**: Auto-disqualification if committed
3. **Bob Budget**: Only 40 Bobcoins - use wisely
4. **Time Pressure**: 12 hours total, need working demo

### Next Steps
1. ~~**Validate Bob Prompts**: Test searcher + validator against PR1 fixture~~ ✅ Done
2. ~~**Iterate Prompts**: Refine based on actual Bob output~~ ✅ Done
3. ~~**Create PR2 & PR3**: Mixed issues and clean code fixtures~~ ✅ Done
4. **Test with Real Bob**: Switch to Advance mode and validate prompts (costs 2-4 Bobcoins)
5. **Start Backend**: FastAPI scaffolding once Bob testing is complete

---

## Session Log

### Session 1 (Hour 0-1): Foundation
- ✅ Created project documentation
- ✅ Designed Bob prompts (2-pass system)
- ✅ Defined 6 characters and damage system
- ✅ Established JSON contract

### Session 2 (Hour 1-2): First Fixture
- ✅ Created PR1 (Security Critical - Blocked)
- ✅ Realistic diff with 7 vulnerabilities
- ✅ Expected findings (raw + validated)
- ✅ Complete documentation
- ✅ Damage calculation: 274 → BLOCKED

### Session 3 (Hour 2): Prompt Validation & Refinement
- ✅ Created validation/pr1_prompt_analysis.md
- ✅ Analyzed Bob Searcher prompt against PR1 fixture
- ✅ Analyzed Bob Validator prompt against PR1 fixture
- ✅ Identified 3 medium-priority improvements needed
- ✅ Applied improvements to Bob Searcher prompt:
  - Added line number format clarification
  - Added security checklist with auth detection
  - Added "Detecting Missing Elements" section (auth, tests, docs, error handling, validation)
- ✅ Applied improvements to Bob Validator prompt:
  - Added line number format clarification
  - Added limited context handling guidance
- 🔄 Next: Test with actual Bob (requires Advance mode + Bobcoins)

### Session 4 (Hour 2-3): PR Fixture #2 (Mixed Issues)
- ✅ Created PR2 (Mixed Issues - Changes Required)
- ✅ Designed scenario: User search feature with N+1 query, missing index, accessibility issues
- ✅ Created fixtures/pr2_mixed_issues/diff.patch
  - 89 lines added across 3 files
  - N+1 query problem (high severity)
  - Missing database index (medium)
  - Poor accessibility (medium)
  - Inconsistent error handling (medium)
  - Missing edge case tests (medium)
  - Documentation gaps (low)
  - Magic numbers (low)
  - Inconsistent naming (low)
- ✅ Created context files:
  - package.json (express, pg, react dependencies)
  - context/db.ts (database module with transaction support)
  - context/UserProfile.tsx (existing component with good accessibility)
- ✅ Created expected_findings_raw.json (8 findings from Bob Searcher)
- ✅ Created expected_findings_validated.json (all 8 validated)
- ✅ Created README.md with complete documentation
- ✅ Total Damage: 162 → CHANGES REQUIRED (50-79 range)
- ✅ Character Distribution:
  - Schema: 2 findings (N+1, missing index)
  - Pixel: 1 finding (accessibility)
  - Atlas: 3 findings (error handling, magic numbers, naming)
  - Echo: 1 finding (tests)
  - Codex: 1 finding (docs)
- ✅ Expected Dialogues: 3 character interactions defined

### Session 5 (Hour 3-4): PR Fixture #3 (Clean Code)
- ✅ Created PR3 (Clean Code - Approved)
- ✅ Designed scenario: Password reset feature with security best practices
- ✅ Created fixtures/pr3_clean_code/diff.patch
  - 156 lines added across 5 files
  - Cryptographically secure token generation
  - Token hashing before storage
  - Proper transaction usage
  - Comprehensive test coverage
  - Good documentation (JSDoc)
  - Password strength validation
  - No user enumeration
- ✅ Created context files:
  - package.json (bcrypt, nodemailer, jest with coverage)
  - context/db.ts (well-documented with transaction support)
  - context/auth.ts (existing auth utilities)
- ✅ Created expected_findings_raw.json (only 3 minor findings)
  - Missing rate limiting (medium)
  - Email template not documented (low)
  - Missing edge case test (low)
- ✅ Created expected_findings_validated.json (all 3 validated)
- ✅ Created README.md with positive aspects section
- ✅ Total Damage: 44 → APPROVED (<50 range)
- ✅ Character Distribution:
  - Aegis: 1 finding (rate limiting)
  - Echo: 1 finding (test gap)
  - Codex: 1 finding (docs)
- ✅ Expected Dialogues: 2 character interactions defined
- ✅ Documented 10+ positive aspects Bob should notice

---

## Lessons Learned

### What Worked Well
1. **Fixture-First Approach**: Creating expected output before implementation helps validate design
2. **Detailed Documentation**: AGENTS.md and DECISIONS.md keep everyone aligned
3. **Realistic Diff**: PR1 has multiple real-world vulnerabilities, not toy examples

### What to Improve
1. ~~**Prompt Testing**: Need to validate Bob prompts ASAP before building backend~~ ✅ Analysis done
2. **Actual Bob Testing**: Need to run real Bob test with improved prompts
3. **Character Voices**: Need to define distinct personalities for Granite rewriting
4. **Dialogue System**: Need examples of character interactions

### Open Questions
1. How many findings trigger character dialogues?
2. Should dialogues be pre-scripted or Granite-generated?
3. What's the minimum viable demo for 3min video?
4. Should we test Bob prompts now (costs Bobcoins) or wait until backend is ready?

---

*Last Updated: 2026-05-15T22:30 UTC*