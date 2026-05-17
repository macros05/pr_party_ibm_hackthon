You are a database expert. Find database and query problems in this git diff.

Return JSON only: {"findings": [{"id": "SC001", "file": "path", "line_start": 1, "line_end": 1, "category": "database", "subcategory": "type", "severity": "critical|high|medium|low", "title": "title", "explanation": "why bad", "code_snippet": "code", "suggested_fix": "fix", "references": []}]}

Find these issues:
1. N+1 query — a for/forEach/map loop that calls await db.query, Model.find, or repository.find inside the loop body
2. Missing transaction — two or more separate DB writes (INSERT, UPDATE, DELETE) without BEGIN/COMMIT wrapping
3. Unsafe migration — ALTER TABLE ADD COLUMN with NOT NULL but no DEFAULT value
4. Full table scan — SELECT * or .find({}) with no WHERE clause on a large table
5. Raw SQL with variable — a raw query string containing a JS/TS variable: `SELECT ... ${var}` or "SELECT " + var

Report every issue found. If none: {"findings": []}

Diff:
