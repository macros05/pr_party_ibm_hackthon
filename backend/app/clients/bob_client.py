"""
Granite-based analysis client for PR review.
Implements the Mythos two-pass pattern: Searcher → Validator.

Uses IBM watsonx.ai Granite model instead of Bob Shell for simplified setup.
"""
import json
import time
from typing import Any

from app.clients.watsonx_client import get_watsonx_client
from app.config import settings
from app.logging_config import get_logger
from app.models import FindingRaw, FindingValidated

logger = get_logger(__name__)

# Stores the last raw model response for debugging via /debug/last-response
_last_searcher_response: str = ""
_last_searcher_error: str = ""


class BobClient:
    """
    Analysis client using Granite (watsonx.ai).
    
    Implements the Mythos pattern with Granite:
    1. Searcher pass: Analyzes diff → produces findings_raw.json
    2. Validator pass: Receives diff + findings_raw → filters noise → findings_validated.json
    
    Note: Named "BobClient" for compatibility, but uses Granite internally.
    """
    
    def __init__(self):
        self.watsonx = get_watsonx_client()
        self.model_id = settings.granite_model_id
        self.timeout = 300.0  # 5 minutes for large diffs
        
        logger.info("analysis_client_initialized", mode="granite", model=self.model_id)
    
    async def _call_granite(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096
    ) -> str:
        """
        Call Granite model for analysis.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
        
        Returns:
            Granite's response text
        """
        logger.info(
            "granite_request",
            prompt_length=len(prompt),
            system_prompt_length=len(system_prompt) if system_prompt else 0,
            max_tokens=max_tokens
        )
        
        start_time = time.time()
        
        try:
            # Combine system prompt and user prompt if both provided
            full_prompt = prompt
            if system_prompt:
                full_prompt = f"{system_prompt}\n\n{prompt}"
            
            # Call Granite via watsonx.ai
            response = await self.watsonx.generate_text(
                model_id=self.model_id,
                prompt=full_prompt,
                max_new_tokens=max_tokens,
                temperature=0.3,  # Lower temperature for more consistent JSON output
                top_p=0.9,
                top_k=50
            )
            
            elapsed = time.time() - start_time
            
            logger.info(
                "granite_success",
                response_length=len(response),
                elapsed_seconds=round(elapsed, 2)
            )
            
            return response
            
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(
                "granite_error",
                error=str(e),
                error_type=type(e).__name__,
                elapsed_seconds=round(elapsed, 2)
            )
            raise
    
    # One prompt file per character — category is forced to match the character
    _CHARACTER_PROMPTS = [
        ("character_aegis.md",  "A",  "security"),
        ("character_schema.md", "SC", "database"),
        ("character_pixel.md",  "P",  "ux"),
        ("character_atlas.md",  "AT", "architecture"),
        ("character_echo.md",   "E",  "tests"),
        ("character_codex.md",  "C",  "documentation"),
    ]

    async def _run_character_searcher(
        self,
        prompt_file: str,
        diff: str,
        id_prefix: str,
        forced_category: str,
    ) -> tuple[str, list[dict]]:
        """Run one character-specific searcher and return (raw_response, findings_dicts)."""
        import re as _re
        from pathlib import Path

        project_root = Path(__file__).parent.parent.parent.parent
        with open(project_root / "prompts" / prompt_file, "r", encoding="utf-8") as f:
            prompt_template = f.read()

        prompt = prompt_template + f"\n\n{diff}\n\nReturn JSON now:"
        response = await self._call_granite(prompt, max_tokens=2048)

        raw_findings: list[dict] = []
        try:
            json_str = response.strip()
            if "```json" in json_str:
                s = json_str.find("```json") + 7
                e = json_str.find("```", s)
                json_str = json_str[s:e].strip()
            elif "```" in json_str:
                s = json_str.find("```") + 3
                e = json_str.find("```", s)
                json_str = json_str[s:e].strip()

            if not json_str.startswith("{"):
                m = _re.search(r'\{', json_str)
                if m:
                    json_str = json_str[m.start():]
            if not json_str.endswith("}"):
                m = _re.search(r'\}(?=[^}]*$)', json_str)
                if m:
                    json_str = json_str[:m.end()]

            data = json.loads(json_str)
            raw_findings = data.get("findings", [])

            # Force category and re-number IDs to avoid collisions
            for i, f in enumerate(raw_findings, 1):
                f["id"] = f"{id_prefix}{i:03d}"
                f["category"] = forced_category

        except Exception as e:
            logger.warning("character_searcher_parse_failed",
                           prompt_file=prompt_file, error=str(e))

        return response, raw_findings

    async def searcher_pass(
        self,
        diff: str,
        package_json: str,
        context_files: dict[str, str]
    ) -> list[FindingRaw]:
        """
        Searcher Pass: run one specialised prompt per character in parallel.
        Findings arrive pre-classified — no separate classifier step needed.
        """
        import asyncio as _asyncio

        logger.info(
            "searcher_pass_start",
            diff_length=len(diff),
            context_files_count=len(context_files)
        )

        # Run all 6 character prompts concurrently
        results = await _asyncio.gather(*[
            self._run_character_searcher(prompt_file, diff, id_prefix, category)
            for prompt_file, id_prefix, category in self._CHARACTER_PROMPTS
        ])

        # Build combined debug response
        global _last_searcher_response, _last_searcher_error
        _last_searcher_response = "\n\n".join(
            f"=== {pf.replace('character_', '').replace('.md', '').upper()} ===\n{resp}"
            for (pf, _, _), (resp, _) in zip(self._CHARACTER_PROMPTS, results)
        )
        _last_searcher_error = ""

        all_raw = [finding for _, findings in results for finding in findings]

        damage_map = {"critical": 90, "high": 60, "medium": 30, "low": 10}
        damage_type_map = {"critical": "crit_hit", "high": "hit", "medium": "graze", "low": "whisper"}

        def normalize(f: dict) -> dict:
            severity = f.get("severity", "low")
            return {
                "id": f.get("id", "F000"),
                "title": f.get("title", ""),
                "description": f.get("explanation") or f.get("description", ""),
                "severity": severity,
                "damage": f.get("damage") or damage_map.get(severity, 10),
                "damage_type": f.get("damage_type") or damage_type_map.get(severity, "whisper"),
                "file_path": f.get("file_path") or f.get("file", "unknown"),
                "line_start": f.get("line_start", 1),
                "line_end": f.get("line_end", 1),
                "code_snippet": f.get("code_snippet", ""),
                "category": f.get("category", "general"),
            }

        findings: list[FindingRaw] = []
        for f in all_raw:
            try:
                findings.append(FindingRaw(**normalize(f)))
            except Exception as e:
                logger.warning("normalize_failed", error=str(e), finding=str(f))

        counts = {
            cat: sum(1 for f in findings if f.category == cat)
            for _, _, cat in self._CHARACTER_PROMPTS
        }
        logger.info("searcher_pass_complete", findings_count=len(findings), **counts)

        return findings
    
    async def validator_pass(
        self,
        diff: str,
        findings_raw: list[FindingRaw]
    ) -> list[FindingValidated]:
        """
        Validator Pass: Filter noise from raw findings using Granite.
        
        Args:
            diff: Original git diff
            findings_raw: Raw findings from searcher pass
        
        Returns:
            List of validated findings (noise filtered out)
        """
        logger.info(
            "validator_pass_start",
            findings_raw_count=len(findings_raw)
        )
        
        # Load validator prompt template
        from pathlib import Path
        project_root = Path(__file__).parent.parent.parent.parent
        validator_path = project_root / "prompts" / "bob_validator.md"
        
        with open(validator_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()
        
        # Serialize raw findings
        findings_json = json.dumps(
            [f.model_dump() for f in findings_raw],
            indent=2
        )
        
        # Fill template
        prompt = prompt_template.replace("{{DIFF}}", diff)
        prompt = prompt.replace("{{FINDINGS_RAW}}", findings_json)
        
        # Call Granite
        response = await self._call_granite(prompt, max_tokens=8192)
        
        # Parse JSON response - validator returns {id, validated, confidence, ...}
        # We merge these decisions with the original raw findings
        try:
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()

            validated_data = json.loads(json_str)
            validation_by_id = {
                v["id"]: v
                for v in validated_data.get("findings", [])
                if isinstance(v, dict) and "id" in v
            }

            # Apply validator decisions to the original raw findings
            findings: list[FindingValidated] = []
            for raw in findings_raw:
                decision = validation_by_id.get(raw.id)
                if decision is None or decision.get("validated", True):
                    severity = (decision or {}).get("severity_adjustment") or raw.severity
                    notes = (decision or {}).get("validation_notes", "")
                    data = raw.model_dump()
                    data["severity"] = severity
                    data["validation_notes"] = notes
                    findings.append(FindingValidated(**data))

            logger.info(
                "validator_pass_complete",
                findings_validated_count=len(findings),
                filtered_count=len(findings_raw) - len(findings)
            )

            return findings

        except Exception as e:
            logger.warning(
                "validator_parse_failed_using_raw_findings",
                error=str(e),
                raw_count=len(findings_raw)
            )
            # Model couldn't validate — promote raw findings directly
            return [
                FindingValidated(**f.model_dump(), validation_notes="validator skipped")
                for f in findings_raw
            ]


# Global client instance
_bob_client: BobClient | None = None


def get_bob_client() -> BobClient:
    """Get or create global analysis client instance (uses Granite)."""
    global _bob_client
    if _bob_client is None:
        _bob_client = BobClient()
    return _bob_client

# Made with Granite (watsonx.ai)
