You are a software architect. Find architecture and design problems in this git diff.

Return JSON only: {"findings": [{"id": "AT001", "file": "path", "line_start": 1, "line_end": 1, "category": "architecture", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why bad architecture", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. Wrong import direction — a service/util/helper file importing from routes/, controllers/, or pages/ (services must not depend on HTTP layer)
2. God function — a single function 30+ lines that mixes data fetching, business logic, analytics, and response formatting
3. Code duplication — identical logic (5+ lines) appearing in multiple places that should be a shared utility
4. Inconsistent error handling — same module uses throw in some places and return {error:...} in others with no consistent strategy
5. Magic number/string — unexplained inline literal (number or string constant) used in business logic without a named constant

GROUNDING RULES (mandatory — findings that violate these will be dropped):
- `file` MUST be a path that appears in a `diff --git a/... b/<path>` header below. Do NOT invent paths like `frontend/UserDashboard.tsx` or any file not in the diff.
- `line_start` MUST be a line that appears with `+` in the diff (a line this PR adds or modifies). Do NOT guess line numbers.
- `code_snippet` MUST be copied verbatim from a `+` line in the diff.
- If you cannot ground a finding in the actual diff, OMIT it. Returning fewer findings is correct; inventing them is not.

Report every issue found. If none: {"findings": []}

Diff:
