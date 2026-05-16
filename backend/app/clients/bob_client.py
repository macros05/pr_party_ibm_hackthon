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
    
    async def searcher_pass(
        self,
        diff: str,
        package_json: str,
        context_files: dict[str, str]
    ) -> list[FindingRaw]:
        """
        Searcher Pass: Analyze diff and produce raw findings using Granite.
        
        Args:
            diff: Git diff content
            package_json: package.json content for dependency context
            context_files: Dict of filename -> content for imported modules
        
        Returns:
            List of raw findings (no character assignment yet)
        """
        logger.info(
            "searcher_pass_start",
            diff_length=len(diff),
            context_files_count=len(context_files)
        )
        
        # Load simplified searcher prompt template
        from pathlib import Path
        import re
        
        project_root = Path(__file__).parent.parent.parent.parent
        searcher_path = project_root / "prompts" / "bob_searcher_simple.md"
        
        with open(searcher_path, "r", encoding="utf-8") as f:
            prompt_template = f.read()
        
        # Simplified prompt - just diff, no complex context
        prompt = prompt_template + f"\n\n{diff}\n\nReturn JSON now:"
        
        # Call Granite with explicit JSON instruction
        response = await self._call_granite(prompt, max_tokens=4096)
        
        # Parse JSON response with multiple extraction strategies
        try:
            json_str = response.strip()
            
            # Strategy 1: Extract from markdown code block
            if "```json" in json_str:
                json_start = json_str.find("```json") + 7
                json_end = json_str.find("```", json_start)
                json_str = json_str[json_start:json_end].strip()
            elif "```" in json_str:
                # Generic code block
                json_start = json_str.find("```") + 3
                json_end = json_str.find("```", json_start)
                json_str = json_str[json_start:json_end].strip()
            
            # Strategy 2: Find JSON object boundaries
            if not json_str.startswith("{"):
                # Try to find the first {
                match = re.search(r'\{', json_str)
                if match:
                    json_str = json_str[match.start():]
            
            if not json_str.endswith("}"):
                # Try to find the last }
                match = re.search(r'\}(?=[^}]*$)', json_str)
                if match:
                    json_str = json_str[:match.end()]
            
            # Parse JSON
            findings_data = json.loads(json_str)
            findings = [FindingRaw(**f) for f in findings_data.get("findings", [])]
            
            logger.info(
                "searcher_pass_complete",
                findings_count=len(findings)
            )
            
            return findings
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(
                "searcher_parse_error",
                error=str(e),
                response_preview=response[:200]
            )
            # Return empty findings instead of crashing
            logger.warning("returning_empty_findings_due_to_parse_error")
            return []
    
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
        
        # Parse JSON response
        try:
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()
            
            validated_data = json.loads(json_str)
            findings = [FindingValidated(**f) for f in validated_data.get("findings", [])]
            
            logger.info(
                "validator_pass_complete",
                findings_validated_count=len(findings),
                filtered_count=len(findings_raw) - len(findings)
            )
            
            return findings
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(
                "validator_parse_error",
                error=str(e),
                response_preview=response[:500]
            )
            raise ValueError(f"Failed to parse validator response: {e}")


# Global client instance
_bob_client: BobClient | None = None


def get_bob_client() -> BobClient:
    """Get or create global analysis client instance (uses Granite)."""
    global _bob_client
    if _bob_client is None:
        _bob_client = BobClient()
    return _bob_client

# Made with Granite (watsonx.ai)
