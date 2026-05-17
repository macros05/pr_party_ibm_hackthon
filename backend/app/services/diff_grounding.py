"""Reject findings that don't land on code the diff actually changed.

The character searchers ask Granite for `file_path` / `line_start` / `code_snippet`,
but the model routinely fabricates plausible-looking values (e.g.
`frontend/UserDashboard.tsx:123`) when it can't find real issues. This module
parses the unified diff once and exposes a fast deterministic check so the
orchestrator can drop hallucinated findings before they reach the voice
rewriter or the client.
"""
import re
from dataclasses import dataclass, field


_FILE_HEADER_RE = re.compile(r"^diff --git a/(?P<old>.+?) b/(?P<new>.+)$")
_HUNK_RE = re.compile(r"^@@ -\d+(?:,\d+)? \+(?P<start>\d+)(?:,\d+)? @@")


@dataclass
class DiffIndex:
    """Per-file map of post-image lines the diff added, plus their text."""
    added_lines: dict[str, set[int]] = field(default_factory=dict)
    added_text: dict[str, str] = field(default_factory=dict)
    # Per-file map: post-image line number -> exact text of that added line.
    # Used to pinpoint the real line where a model-reported snippet lives,
    # since the model frequently reports a line number that's off by 1-3.
    line_content: dict[str, dict[int, str]] = field(default_factory=dict)

    @property
    def files(self) -> set[str]:
        return set(self.added_lines.keys())


def parse_diff(diff: str) -> DiffIndex:
    """Parse a unified diff and record which (file, line) pairs were added."""
    index = DiffIndex()
    current_file: str | None = None
    new_line_no: int | None = None

    for raw in diff.split("\n"):
        m_file = _FILE_HEADER_RE.match(raw)
        if m_file:
            current_file = m_file.group("new")
            index.added_lines.setdefault(current_file, set())
            index.added_text.setdefault(current_file, "")
            index.line_content.setdefault(current_file, {})
            new_line_no = None
            continue

        if raw.startswith("+++") or raw.startswith("---"):
            continue

        m_hunk = _HUNK_RE.match(raw)
        if m_hunk:
            new_line_no = int(m_hunk.group("start"))
            continue

        if current_file is None or new_line_no is None:
            continue

        if raw.startswith("+"):
            content = raw[1:]
            index.added_lines[current_file].add(new_line_no)
            index.added_text[current_file] += content + "\n"
            index.line_content[current_file][new_line_no] = content
            new_line_no += 1
        elif raw.startswith("-"):
            # Removed line — does not advance the post-image counter.
            continue
        else:
            # Context line (including blank context lines, which appear as "").
            new_line_no += 1

    return index


def _normalize_path(p: str) -> str:
    return p.strip().lstrip("./").lstrip("/")


def _paths_match(claimed: str, actual: str) -> bool:
    """Tolerate models that drop or add a leading directory prefix."""
    claimed = _normalize_path(claimed)
    actual = _normalize_path(actual)
    if claimed == actual:
        return True
    return claimed.endswith("/" + actual) or actual.endswith("/" + claimed)


def resolve_file(index: DiffIndex, claimed_path: str) -> str | None:
    """Return the diff's canonical path that the model's path refers to."""
    if not claimed_path:
        return None
    for actual in index.files:
        if _paths_match(claimed_path, actual):
            return actual
    return None


def _snippet_matches(snippet: str, added_text: str) -> bool:
    """At least one non-trivial snippet line must appear in the added text."""
    if not snippet.strip():
        return True
    needle_lines = [
        line.strip() for line in snippet.splitlines() if len(line.strip()) >= 8
    ]
    if not needle_lines:
        return True
    return any(line in added_text for line in needle_lines)


def find_snippet_line(
    snippet: str,
    file: str,
    index: DiffIndex,
    hint_line: int | None = None,
) -> int | None:
    """Return the post-image line number where `snippet`'s strongest needle lives.

    Used to correct the model's frequent ±1-3 line drift on `line_start`: pick
    the longest line of the snippet, scan `line_content[file]` for an exact
    contains-match, and return the closest match to `hint_line` (the model's
    original guess) so we don't jump if the snippet repeats in the file.
    """
    if not snippet.strip():
        return None
    file_lines = index.line_content.get(file)
    if not file_lines:
        return None

    needles = sorted(
        (s for s in (line.strip() for line in snippet.splitlines()) if len(s) >= 8),
        key=len,
        reverse=True,
    )
    if not needles:
        return None

    for needle in needles:
        matches = [n for n, content in file_lines.items() if needle in content]
        if not matches:
            continue
        if hint_line is not None:
            return min(matches, key=lambda n: abs(n - hint_line))
        return min(matches)
    return None


def is_grounded(
    *,
    file_path: str,
    line_start: int,
    line_end: int,
    code_snippet: str,
    index: DiffIndex,
    line_slack: int = 3,
) -> tuple[bool, str]:
    """Decide whether a finding lands on code this diff actually touched.

    Returns (grounded, reason). When False, `reason` describes the rejection
    so we can log how the model hallucinated.
    """
    actual = resolve_file(index, file_path)
    if actual is None:
        return False, f"file_not_in_diff:{file_path}"

    added = index.added_lines.get(actual, set())
    if not added:
        return False, f"file_has_no_added_lines:{actual}"

    span_low = max(1, line_start - line_slack)
    span_high = max(line_end, line_start) + line_slack
    if not any(span_low <= n <= span_high for n in added):
        return False, f"line_not_in_added_range:{actual}:{line_start}-{line_end}"

    if not _snippet_matches(code_snippet, index.added_text.get(actual, "")):
        return False, f"snippet_not_in_diff:{actual}:{line_start}"

    return True, "ok"
