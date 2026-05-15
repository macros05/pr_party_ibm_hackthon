# Critical Design Decisions - PR Party

This document resolves ambiguities from PR_PARTY_SPEC.md before implementation begins.

## 1. Prompt Sistema Maestro - JSON Formats

### Pasada 1: Buscador (Searcher)
**Input:** diff + repo context
**Output:** `findings_raw.json`

```json
{
  "findings": [
    {
      "id": "raw-001",
      "file": "src/routes/avatar.ts",
      "line_start": 23,
      "line_end": 31,
      "category": "security",
      "subcategory": "rce",
      "severity": "critical",
      "title": "Multer accepts arbitrary file extensions",
      "explanation": "Technical explanation without voice...",
      "code_snippet": "...",
      "suggested_fix": "..."
    }
  ]
}
```

### Pasada 2: Validador (Validator)
**Input:** diff + findings_raw.json (both provided to Bob)
**Output:** `findings_validated.json`

```json
{
  "findings": [
    {
      "id": "raw-001",
      "validated": true,
      "confidence": 0.95,
      "validation_notes": "Confirmed: no file extension validation present"
    },
    {
      "id": "raw-002",
      "validated": false,
      "confidence": 0.3,
      "validation_notes": "False positive: pattern exists in parent class"
    }
  ]
}
```

**Decision:** Validator receives BOTH diff and findings_raw to cross-check claims against actual code.

## 2. Clasificador a Personajes - Matriz de Asignación

### Category → Character Mapping (overlaps allowed)

| Category | Primary | Secondary | Rationale |
|----------|---------|-----------|-----------|
| security/injection | Aegis | Schema (if DB) | SQL injection touches both |
| security/xss | Aegis | Pixel (if UI) | XSS affects security + UX |
| security/auth | Aegis | - | Pure security |
| db/n+1 | Schema | - | Pure DB |
| db/migration | Schema | Atlas (if breaks pattern) | Migration + architecture |
| ux/a11y | Pixel | - | Pure UX |
| ux/copy | Pixel | Codex (if docs) | Copy + documentation |
| architecture/coupling | Atlas | - | Pure architecture |
| architecture/pattern | Atlas | Echo (if affects testability) | Pattern + tests |
| tests/coverage | Echo | - | Pure tests |
| tests/flaky | Echo | Atlas (if architectural) | Flaky tests + design |
| docs/outdated | Codex | - | Pure docs |
| docs/missing | Codex | Echo (if test docs) | Docs + tests |

**Decision:** A finding can have 1-2 character assignments. If 2, both speak about it (creates natural dialogue).

## 3. Contexto del Repo para Bob

### Token Budget: 50k max
**Breakdown:**
- Diff: ~10-20k tokens (typical PR)
- package.json: ~1-2k tokens
- Imported files (1 level): ~20-30k tokens
- System prompt: ~5k tokens

### Files to Include:
1. **Always:** Full diff
2. **Always:** package.json (or equivalent: requirements.txt, go.mod, etc.)
3. **Conditional:** Files directly imported by changed files (1 level only)
4. **Never:** node_modules, dist, build artifacts

### Implementation:
```python
def get_repo_context(diff, repo_path):
    context = {
        "diff": diff,
        "package_json": read_file("package.json"),
        "imports": []
    }
    
    changed_files = extract_files_from_diff(diff)
    for file in changed_files:
        imports = extract_imports(file)  # 1 level only
        for imp in imports[:5]:  # Max 5 imports per file
            context["imports"].append(read_file(imp))
    
    # Truncate if > 50k tokens
    return truncate_to_token_limit(context, 50000)
```

**Decision:** Diff + package.json + 1-level imports, max 50k tokens total.

## 4. Detector de Diálogos - Simplified Logic

### Original Problem:
"Polaridad opuesta" is too vague and requires semantic analysis.

### Simplified Solution:
Generate dialogue when 2+ characters have findings on the **same file + overlapping line range**.

```python
def detect_dialogues(findings_by_character):
    dialogues = []
    
    # Group findings by file + line range
    location_map = defaultdict(list)
    for char_id, findings in findings_by_character.items():
        for finding in findings:
            key = (finding.file, finding.line_start, finding.line_end)
            location_map[key].append((char_id, finding))
    
    # If 2+ characters touch same location, create dialogue
    for location, char_findings in location_map.items():
        if len(char_findings) >= 2:
            dialogues.append({
                "between": [cf[0] for cf in char_findings],
                "topic": f"{location[0]}:{location[1]}",
                "exchanges": [
                    {"from": cf[0], "text": cf[1].explanation_voiced}
                    for cf in char_findings
                ]
            })
    
    return dialogues
```

**Decision:** Co-occurrence on same file/line triggers dialogue. No semantic "polaridad" detection needed.

## 5. Motor de Daño - Deterministic Formula

### Base Damage by Severity:
```python
BASE_DAMAGE = {
    "critical": 90,
    "high": 55,
    "medium": 25,
    "low": 7
}
```

### Modifiers:
```python
CATEGORY_MODIFIER = {
    "security/rce": +10,
    "security/injection": +8,
    "db/data_loss": +10,
    "db/migration": +5,
    # ... etc
}

def calculate_damage(finding):
    base = BASE_DAMAGE[finding.severity]
    category_mod = CATEGORY_MODIFIER.get(finding.category, 0)
    line_mod = min((finding.line_end - finding.line_start) // 10, 5)
    
    damage = base + category_mod + line_mod
    
    # Clamp to severity ranges
    ranges = {
        "critical": (80, 100),
        "high": (40, 70),
        "medium": (15, 35),
        "low": (5, 10)
    }
    min_dmg, max_dmg = ranges[finding.severity]
    return max(min_dmg, min(damage, max_dmg))
```

**Decision:** Deterministic formula: base + category_modifier + line_count_modifier, clamped to severity range.

## 6. SSE Streaming - Fixed Order

### Character Order (Sequential):
1. Aegis (Security)
2. Schema (Database)
3. Pixel (UX)
4. Atlas (Architecture)
5. Echo (Tests)
6. Codex (Docs)

### Streaming Protocol:
```
event: character_start
data: {"character_id": "aegis", "name": "Aegis"}

event: finding
data: {"character_id": "aegis", "finding": {...}}

event: finding
data: {"character_id": "aegis", "finding": {...}}

event: character_complete
data: {"character_id": "aegis", "total_damage": 88}

event: character_start
data: {"character_id": "schema", "name": "Schema"}
...
```

### Timeout Handling:
- Each character has 30s timeout
- If timeout, send `character_timeout` event and move to next
- Frontend shows "Character is still thinking..." state

**Decision:** Fixed sequential order. Each character completes before next starts. 30s timeout per character.

## 7. Fixtures Demo - Specific PRs

### PR1: Security Critical (Blocked)
**File:** `src/routes/upload.ts`
**Changes:**
- Add file upload endpoint with multer
- No file extension validation
- No file size limit
- Stores in public directory

**Expected Findings:**
- Aegis: RCE via arbitrary file upload (critical, 88 dmg)
- Schema: No transaction for file metadata insert (medium, 25 dmg)
- Echo: No test for upload failure cases (low, 8 dmg)
- **Total:** 121 dmg → BLOCKED

### PR2: Mixed Issues (Changes Required)
**File:** `src/services/user.ts`
**Changes:**
- Add getUserPosts() method
- N+1 query (fetches user, then loops posts)
- Missing error handling
- No tests

**Expected Findings:**
- Schema: N+1 query detected (high, 55 dmg)
- Echo: No test coverage for new method (medium, 20 dmg)
- **Total:** 75 dmg → CHANGES REQUIRED

### PR3: Clean Code (Approved)
**File:** `src/utils/format.ts`
**Changes:**
- Add date formatting utility
- Proper error handling
- Full test coverage
- JSDoc comments

**Expected Findings:**
- (None - all characters report "miss" or "standing by")
- **Total:** 0 dmg → APPROVED

**Decision:** Create these 3 PRs in demo repo with pre-generated findings for offline demo.

## 8. Granite Voice Rewriting - Prompt Templates

### Template Structure:
```
You are {CHARACTER_NAME}, a {CHARACTER_CLASS} in a code review council.

Your voice: {VOICE_DESCRIPTION}

Rewrite this technical finding in your voice:

Technical finding:
{FINDING_EXPLANATION}

Requirements:
- Keep technical accuracy
- Use your characteristic tone
- 2-3 sentences max
- Include specific line numbers
- End with actionable advice

Your rewritten finding:
```

### Character Voice Descriptions:
- **Aegis:** "Formal and paranoid. Cite CVEs and OWASP. Use military metaphors. Always assume the worst case."
- **Schema:** "Dry and technical. Go straight to the point. Use database terminology. No fluff."
- **Pixel:** "Empathetic and playful. Talk about the end user. Use accessibility terms. Make it relatable."
- **Atlas:** "Wise and contextual. Reference other parts of the codebase. Use architectural patterns. Think long-term."
- **Echo:** "Insistent and persuasive. Ask 'what if' questions. Use testing terminology. Push for edge cases."
- **Codex:** "Pedantic but elegant. Quote exact line numbers. Use documentation standards. Cite style guides."

**Decision:** Use Granite with character-specific prompts. Each finding gets rewritten in the assigned character's voice.

## 9. Orchestrate - Clarification

**Decision:** Orchestrate is **nice-to-have only**. Do NOT implement unless:
- Core system (Bob + Granite + SSE) is 100% working
- All 3 fixture PRs are ready
- Frontend integration is complete
- At least 6 hours remain before submission

If implemented, it's a thin wrapper that delegates to existing Bob prompts.

## 10. Character Levels - Clarification

**Decision:** Levels are **purely cosmetic**. They do NOT affect:
- Damage calculation
- Finding weight
- Dialogue priority

Levels are fixed per character:
- Aegis: 8
- Schema: 7
- Pixel: 6
- Atlas: 9
- Echo: 5
- Codex: 7

Used only for visual flavor in frontend.

---

## Implementation Priority

1. ✅ **Hour 0-1:** Resolve these decisions (this document)
2. **Hour 1-3:** Design Bob master prompts (searcher + validator)
3. **Hour 3-5:** Implement FastAPI + Bob integration
4. **Hour 5-7:** Classifier + Granite voice rewriting
5. **Hour 7-9:** SSE streaming + damage calculation
6. **Hour 9-11:** Create 3 fixture PRs
7. **Hour 11-12:** Integration testing + polish

---

*Last updated: 2026-05-15 - Before implementation begins*