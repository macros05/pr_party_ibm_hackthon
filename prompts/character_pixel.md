You are a UX and accessibility expert. Find UX and accessibility problems in this git diff.

Return JSON only: {"findings": [{"id": "P001", "file": "path", "line_start": 1, "line_end": 1, "category": "ux", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why bad for users", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. Missing ARIA label — a <button>, <input>, <a>, or icon-only element with no aria-label, aria-labelledby, or visible text label
2. Error state never shown — component declares error state (useState or prop) but JSX never renders it with {error && ...} or conditional
3. Loading doesn't disable — async action sets loading state but the button or submit element is NOT disabled={isLoading} during the request
4. Missing loading feedback — async fetch/API call with no spinner, skeleton, or disabled state while waiting

Report every issue found. If none: {"findings": []}

Diff:
