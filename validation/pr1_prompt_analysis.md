# PR1 Fixture - Bob Prompt Validation Analysis

## Test Date
2026-05-15T22:33 UTC

## Objective
Validate that the Bob Searcher and Validator prompts can correctly identify the 7 expected findings in PR1 (Security Critical fixture).

---

## Expected Findings Summary

From `fixtures/pr1_security_critical/expected_findings_raw.json`:

1. **raw-001**: RCE via file upload (critical, security/rce)
2. **raw-002**: Path traversal (critical, security/path_traversal)
3. **raw-003**: Missing authentication (high, security/auth)
4. **raw-004**: Missing transaction (medium, db/transaction)
5. **raw-005**: Missing tests (medium, tests/coverage)
6. **raw-006**: Poor error handling (low, architecture/separation)
7. **raw-007**: Missing documentation (low, docs/missing)

**Expected Total Damage**: 274 → BLOCKED

---

## Prompt Analysis: Bob Searcher

### ✅ Strengths

1. **Clear Structure**: JSON format is well-defined with all required fields
2. **Category Coverage**: All 6 domains covered (security, db, ux, architecture, tests, docs)
3. **Severity Guidelines**: Clear criteria for critical/high/medium/low
4. **Specificity Requirements**: Demands exact line numbers and code snippets
5. **Analysis Strategy**: Logical order (security first, docs last)

### ⚠️ Potential Issues

1. **Line Number Ambiguity**: 
   - Diff shows line numbers in format `@@ -0,0 +1,45 @@`
   - Prompt says "exact line numbers from the diff"
   - Should clarify: use the NEW file line numbers (1-45 in this case)
   - **Fix needed**: Add example showing how to reference diff line numbers

2. **Context Window**:
   - Prompt says "1 level deep" for imports
   - PR1 imports `{ db }` from `../db` - this is provided
   - But what if db.ts imports other files? Should we stop at 1 level?
   - **Current approach is correct** - only db.ts is provided

3. **Missing Auth Detection**:
   - Finding raw-003 expects "Missing authentication check"
   - The diff shows no auth middleware on the route
   - Prompt doesn't explicitly say "check for auth middleware"
   - **Risk**: Bob might miss this if not looking for absence of auth
   - **Fix needed**: Add to security checklist: "Check for auth/authorization middleware"

4. **Transaction Detection**:
   - Finding raw-004 expects "Missing transaction for multi-step DB operations"
   - Two separate `db.query()` calls (lines 36-39, 42-45)
   - Prompt mentions "Missing transactions for multi-step operations" in db/transaction
   - **Should work** - this is explicit in the prompt

5. **Test Coverage**:
   - Finding raw-005 expects "No tests for new upload endpoint"
   - Diff shows new file, no test file
   - Prompt says "Missing test coverage for new code"
   - **Should work** - but Bob needs to infer no tests exist from absence

### 🔧 Recommended Prompt Improvements

#### 1. Clarify Line Number Format
Add to "Output Format" section:
```markdown
**Line Numbers**: Use the line numbers from the NEW file (after the `+++` marker in the diff).
For new files, these start at 1. For modified files, use the line numbers shown in the diff hunks.

Example: If the diff shows `@@ -0,0 +1,45 @@`, line numbers are 1-45.
```

#### 2. Enhance Security Checklist
Add to "Analysis Strategy" section:
```markdown
### Security Checklist
- [ ] File uploads: Check for extension validation, size limits, path sanitization
- [ ] Authentication: Verify auth middleware exists on protected routes
- [ ] Authorization: Check if user permissions are validated
- [ ] Input validation: Look for sanitization of user inputs
- [ ] SQL queries: Check for parameterized queries (not string concatenation)
```

#### 3. Add "Absence Detection" Guidance
Add new section:
```markdown
## Detecting Missing Elements

Some issues are about what's NOT in the code:
- **Missing auth**: No middleware like `authenticate()` or `requireAuth()` on route
- **Missing tests**: New file added, but no corresponding `.test.ts` or `.spec.ts` file
- **Missing docs**: New public API, but no JSDoc or README update
- **Missing error handling**: No try-catch or error middleware

When reporting these, cite the absence explicitly:
"No authentication middleware present on line 25 (route definition)"
```

---

## Prompt Analysis: Bob Validator

### ✅ Strengths

1. **Clear Validation Criteria**: validated true/false with confidence scores
2. **False Positive Examples**: Good examples of common mistakes
3. **Severity Adjustment**: Allows correcting overstated/understated severity
4. **Fix Improvement**: Can refine suggested fixes
5. **Confidence Thresholds**: Clear guidance (< 0.7 → mark false positive)

### ⚠️ Potential Issues

1. **Line Number Verification**:
   - Prompt says "If line numbers are off by more than 2 lines, mark as false positive"
   - This is good, but what if the Searcher used wrong line numbering system?
   - **Should work** - Validator will catch this

2. **Context Analysis**:
   - Prompt says "Look at surrounding code (10 lines before/after)"
   - For PR1, the entire file is only 45 lines
   - **Should work** - Validator has full context

3. **Pattern Recognition**:
   - Prompt says "Is this pattern used consistently elsewhere in the repo?"
   - But we only provide 1-level imports, not full repo
   - **Risk**: Validator might be too lenient if it can't see other files
   - **Mitigation**: We're only providing minimal context, so this is expected

4. **Success Metrics**:
   - Prompt says "Filter out 20-40% of findings as false positives"
   - For PR1, we expect 0% false positives (all 7 findings are real)
   - **This is OK** - the metric is a guideline, not a requirement

### 🔧 Recommended Prompt Improvements

#### 1. Add Line Number Format Clarification
Add to "Line Number Verification" section:
```markdown
**Note**: Line numbers should reference the NEW file (after `+++` in diff).
If the Searcher used old file line numbers or diff hunk numbers, this is an error.
Cross-reference the code_snippet against the actual diff to verify.
```

#### 2. Clarify Limited Context
Add to "Context Analysis" section:
```markdown
**Limited Context**: You only have access to the diff and 1-level imports.
If you need to see other files to validate a finding, and they're not provided:
- Set confidence < 0.7
- Mark as false positive (err on side of caution)
- Note the missing context in validation_notes
```

---

## Expected Validation Results

Based on the prompts, here's what we expect Bob Validator to produce:

### Finding raw-001 (RCE via file upload)
```json
{
  "id": "raw-001",
  "validated": true,
  "confidence": 0.99,
  "validation_notes": "Confirmed: multer config on line 15-20 has no fileFilter. Filename uses file.originalname (line 18) without sanitization. Upload directory is public/uploads (line 16). Legitimate RCE risk.",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ✅ Should work perfectly

### Finding raw-002 (Path traversal)
```json
{
  "id": "raw-002",
  "validated": true,
  "confidence": 0.95,
  "validation_notes": "Confirmed: file.originalname used directly on line 18 without path.basename() or sanitization. Attacker can use '../../../etc/passwd' as filename.",
  "severity_adjustment": null,
  "suggested_fix_improvement": "Add path sanitization: filename: (req, file, cb) => { const safe = path.basename(file.originalname); cb(null, `${Date.now()}-${safe}`); }"
}
```
**Status**: ✅ Should work, might improve the fix

### Finding raw-003 (Missing authentication)
```json
{
  "id": "raw-003",
  "validated": true,
  "confidence": 0.85,
  "validation_notes": "Confirmed: No authentication middleware on route definition (line 25). Endpoint is publicly accessible. However, confidence reduced because we don't see the full app.ts to verify if there's global auth middleware.",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ⚠️ Might lower confidence due to limited context

### Finding raw-004 (Missing transaction)
```json
{
  "id": "raw-004",
  "validated": true,
  "confidence": 0.90,
  "validation_notes": "Confirmed: Two separate db.query() calls (lines 36-39, 42-45) without transaction wrapper. If first succeeds and second fails, data inconsistency occurs.",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ✅ Should work perfectly

### Finding raw-005 (Missing tests)
```json
{
  "id": "raw-005",
  "validated": true,
  "confidence": 0.80,
  "validation_notes": "Confirmed: New file src/routes/upload.ts added, but no corresponding test file in diff. Cannot verify if tests exist elsewhere in repo with provided context.",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ⚠️ Might lower confidence due to limited context

### Finding raw-006 (Poor error handling)
```json
{
  "id": "raw-006",
  "validated": true,
  "confidence": 0.75,
  "validation_notes": "Confirmed: No try-catch around async operations (lines 36-45). If db.query() throws, unhandled promise rejection occurs. However, Express might have global error handler (not visible in context).",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ⚠️ Might lower confidence or mark false positive if uncertain

### Finding raw-007 (Missing documentation)
```json
{
  "id": "raw-007",
  "validated": true,
  "confidence": 0.85,
  "validation_notes": "Confirmed: New public API endpoint added (line 25) with no JSDoc comments. No README update visible in diff.",
  "severity_adjustment": null,
  "suggested_fix_improvement": null
}
```
**Status**: ✅ Should work

---

## Overall Assessment

### Prompt Readiness: 85%

**What Works**:
- ✅ Core structure and format are solid
- ✅ Severity guidelines are clear
- ✅ Validation criteria are well-defined
- ✅ Most findings should be detected correctly

**What Needs Improvement**:
- ⚠️ Line number format clarification (minor)
- ⚠️ Security checklist for auth detection (medium)
- ⚠️ Guidance on detecting missing elements (medium)
- ⚠️ Limited context handling in Validator (minor)

### Risk Assessment

**Low Risk** (will likely work):
- raw-001 (RCE): Explicit in code
- raw-002 (Path traversal): Explicit in code
- raw-004 (Transaction): Explicit in prompt
- raw-007 (Docs): Easy to detect absence

**Medium Risk** (might miss or underconfidence):
- raw-003 (Auth): Requires detecting absence of middleware
- raw-005 (Tests): Requires detecting absence of test file
- raw-006 (Error handling): Might be marked false positive if uncertain

### Recommended Actions

1. **Immediate** (before Bob testing):
   - Add line number format clarification to both prompts
   - Add security checklist with auth detection to Searcher
   - Add "Detecting Missing Elements" section to Searcher

2. **After First Bob Run** (iterate based on results):
   - If auth is missed: Strengthen security checklist
   - If tests are missed: Add explicit "check for test files" guidance
   - If error handling is false positive: Clarify when to be lenient

3. **Before Backend Implementation**:
   - Run actual Bob test with these prompts
   - Document any deviations from expected output
   - Refine prompts based on real Bob behavior

---

## Next Steps

1. ✅ Document prompt analysis (this file)
2. 🔄 Apply recommended improvements to prompts
3. 🔄 Test with actual Bob (requires switching to Advance mode)
4. 🔄 Iterate based on Bob's actual output
5. 🔄 Create PR2 and PR3 fixtures
6. 🔄 Begin backend implementation

---

*Analysis completed: 2026-05-15T22:33 UTC*