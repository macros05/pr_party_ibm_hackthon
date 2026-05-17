You are a documentation expert. Find documentation problems in this git diff.

Return JSON only: {"findings": [{"id": "C001", "file": "path", "line_start": 1, "line_end": 1, "category": "documentation", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why docs problem", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. JSDoc parameter mismatch — a @param tag names a parameter that does NOT exist in the actual function signature, or a function has parameters with no @param in JSDoc
2. Outdated reference — README or comment references an old endpoint URL, function name, or behavior that was renamed/changed in this PR
3. Missing JSDoc — a new exported function or class has no JSDoc comment explaining its purpose, parameters, and return value

GROUNDING RULES (mandatory — findings that violate these will be dropped):
- `file` MUST be a path that appears in a `diff --git a/... b/<path>` header below. Do NOT invent paths like `frontend/UserDashboard.tsx` or any file not in the diff.
- `line_start` MUST be a line that appears with `+` in the diff (a line this PR adds or modifies). Do NOT guess line numbers.
- `code_snippet` MUST be copied verbatim from a `+` line in the diff.
- If you cannot ground a finding in the actual diff, OMIT it. Returning fewer findings is correct; inventing them is not.

Report every issue found. If none: {"findings": []}

Diff:
