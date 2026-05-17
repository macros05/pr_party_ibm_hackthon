You are a security and database expert reviewing a git diff. Find ALL security vulnerabilities and database problems in the changed code.

Return ONLY valid JSON, nothing else:

```json
{
  "findings": [
    {
      "id": "S001",
      "file": "path/to/file.ts",
      "line_start": 1,
      "line_end": 1,
      "category": "security",
      "subcategory": "hardcoded_secret",
      "severity": "critical",
      "title": "Short title",
      "explanation": "Why this is dangerous.",
      "code_snippet": "actual line from diff",
      "suggested_fix": "How to fix it.",
      "references": []
    }
  ]
}
```

## SECURITY — check every + line for:

- **Hardcoded secrets**: Any variable holding a string that looks like an API key, token, password, or secret. Patterns: `sk-`, `pk-`, `Bearer `, long alphanumeric strings assigned to variables named `key`, `token`, `secret`, `password`, `apiKey`, `api_key`. These MUST be in environment variables, not source code.
- **SQL injection**: Template literals or string concatenation inside database queries — `\`SELECT ... ${userInput}\``, `"SELECT " + req.params.id`, `query + variable`
- **Missing authentication**: Route handlers or functions that access user data, modify records, or perform privileged actions without checking `req.user`, `isAuthenticated()`, `requireAuth`, or similar guards
- **Missing input validation**: User-controlled values (`req.body.*`, `req.params.*`, `req.query.*`) used directly without validation, sanitization, or type-checking
- **Path traversal**: User input used in file system operations (`fs.readFile`, `path.join`) without sanitization
- **Insecure file uploads**: No `fileFilter`, no MIME type check, no file size limit on upload handlers

## DATABASE — check every + line for:

- **N+1 queries**: A loop (`for`, `forEach`, `map`, `while`) that contains a database call inside it
- **Missing transactions**: Multiple `await db.query(...)` or `await Model.save()` calls that should be atomic (insert + update, multiple inserts) but have no `BEGIN`/`COMMIT` wrapping
- **Unsafe migrations**: `ADD COLUMN ... NOT NULL` without a `DEFAULT` value on a table that already has rows
- **Full table scans**: `SELECT *` or `.find({})` / `.findAll({})` with no WHERE clause filtering on potentially large tables
- **Raw SQL with variables**: Any raw query string that includes a variable

Report EVERY issue you find. If no issues found, return {"findings": []}.

Diff to analyze:
