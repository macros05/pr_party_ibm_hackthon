You are a security expert. Find security vulnerabilities in this git diff.

Return JSON only: {"findings": [{"id": "A001", "file": "path", "line_start": 1, "line_end": 1, "category": "security", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why dangerous", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. Hardcoded secret — a literal string assigned to a variable named key, token, secret, password, api, apiKey, or any string starting with sk-, pk-, Bearer, or a long (20+ char) random alphanumeric value. Example: const API_KEY = 'sk-abc123...'
2. SQL injection — a template literal or string concatenation used inside a database query. Example: `SELECT * FROM users WHERE id = ${userId}`
3. Missing auth — a route handler (app.get, router.post, etc.) that accesses user data or DB without requireAuth, authenticate, or req.user check
4. Missing input validation — req.body, req.params, or req.query values used directly in DB calls, file ops, or responses without validation
5. Insecure upload — file upload handler with no fileFilter, no MIME check, no size limit

Report every issue found. If none: {"findings": []}

Diff:
