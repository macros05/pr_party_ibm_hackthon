You are a testing expert. Find test quality problems in this git diff.

Return JSON only: {"findings": [{"id": "E001", "file": "path", "line_start": 1, "line_end": 1, "category": "tests", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why bad test", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. Always-passing assertion — expect(true).toBe(true), expect(1).toBe(1), or any assertion where both sides are hardcoded constants that can never fail
2. Mock never returns edge case — a mock always returns success/data but there is no test where it returns undefined, null, or throws an Error
3. Missing test for new code — a new exported function or API route was added but no test covers it
4. Meaningless assertion — test calls a function and only asserts toBeDefined() or not.toThrow() without checking actual return values

GROUNDING RULES (mandatory — findings that violate these will be dropped):
- `file` MUST be a path that appears in a `diff --git a/... b/<path>` header below. Do NOT invent paths like `frontend/UserDashboard.tsx` or any file not in the diff.
- `line_start` MUST be a line that appears with `+` in the diff (a line this PR adds or modifies). Do NOT guess line numbers.
- `code_snippet` MUST be copied verbatim from a `+` line in the diff.
- If you cannot ground a finding in the actual diff, OMIT it. Returning fewer findings is correct; inventing them is not.

Report every issue found. If none: {"findings": []}

Diff:
