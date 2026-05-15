"""
IBM Bob API client for PR analysis.
Implements the Mythos two-pass pattern: Searcher → Validator.
"""
import json
import time
from typing import Any

import httpx

from app.config import settings
from app.logging_config import get_logger
from app.models import FindingRaw, FindingValidated

logger = get_logger(__name__)


class BobClient:
    """
    Client for IBM Bob API.
    
    Implements the Mythos pattern:
    1. Searcher pass: Analyzes diff → produces findings_raw.json
    2. Validator pass: Receives diff + findings_raw → filters noise → findings_validated.json
    """
    
    def __init__(self):
        self.api_key = settings.bob_api_key
        self.api_url = settings.bob_api_url
        self.timeout = 300.0  # 5 minutes for large diffs
        
        logger.info("bob_client_initialized", api_url=self.api_url)
    
    async def _call_bob(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4096
    ) -> str:
        """
        Make API call to Bob.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            max_tokens: Maximum tokens to generate
        
        Returns:
            Bob's response text
        """
        logger.info(
            "bob_api_request",
            prompt_length=len(prompt),
            system_prompt_length=len(system_prompt) if system_prompt else 0,
            max_tokens=max_tokens
        )
        
        start_time = time.time()
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "prompt": prompt,
                    "max_tokens": max_tokens
                }
                
                if system_prompt:
                    payload["system_prompt"] = system_prompt
                
                response = await client.post(
                    f"{self.api_url}/generate",
                    headers=headers,
                    json=payload
                )
                
                response.raise_for_status()
                result = response.json()
                
                elapsed = time.time() - start_time
                
                logger.info(
                    "bob_api_success",
                    response_length=len(result.get("text", "")),
                    elapsed_seconds=round(elapsed, 2)
                )
                
                return result.get("text", "")
                
        except httpx.HTTPError as e:
            elapsed = time.time() - start_time
            logger.error(
                "bob_api_error",
                error=str(e),
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
        Bob Searcher Pass: Analyze diff and produce raw findings.
        
        Args:
            diff: Git diff content
            package_json: package.json content for dependency context
            context_files: Dict of filename -> content for imported modules
        
        Returns:
            List of raw findings (no character assignment yet)
        """
        logger.info(
            "bob_searcher_pass_start",
            diff_length=len(diff),
            context_files_count=len(context_files)
        )
        
        # Load searcher prompt template
        with open("prompts/bob_searcher.md", "r", encoding="utf-8") as f:
            prompt_template = f.read()
        
        # Build context section
        context_section = f"## package.json\n```json\n{package_json}\n```\n\n"
        for filename, content in context_files.items():
            context_section += f"## {filename}\n```typescript\n{content}\n```\n\n"
        
        # Fill template
        prompt = prompt_template.replace("{{DIFF}}", diff)
        prompt = prompt.replace("{{CONTEXT}}", context_section)
        
        # Call Bob
        response = await self._call_bob(prompt, max_tokens=8192)
        
        # Parse JSON response
        try:
            # Extract JSON from markdown code block if present
            if "```json" in response:
                json_start = response.find("```json") + 7
                json_end = response.find("```", json_start)
                json_str = response[json_start:json_end].strip()
            else:
                json_str = response.strip()
            
            findings_data = json.loads(json_str)
            findings = [FindingRaw(**f) for f in findings_data.get("findings", [])]
            
            logger.info(
                "bob_searcher_pass_complete",
                findings_count=len(findings)
            )
            
            return findings
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(
                "bob_searcher_parse_error",
                error=str(e),
                response_preview=response[:500]
            )
            raise ValueError(f"Failed to parse Bob searcher response: {e}")
    
    async def validator_pass(
        self,
        diff: str,
        findings_raw: list[FindingRaw]
    ) -> list[FindingValidated]:
        """
        Bob Validator Pass: Filter noise from raw findings.
        
        Args:
            diff: Original git diff
            findings_raw: Raw findings from searcher pass
        
        Returns:
            List of validated findings (noise filtered out)
        """
        logger.info(
            "bob_validator_pass_start",
            findings_raw_count=len(findings_raw)
        )
        
        # Load validator prompt template
        with open("prompts/bob_validator.md", "r", encoding="utf-8") as f:
            prompt_template = f.read()
        
        # Serialize raw findings
        findings_json = json.dumps(
            [f.model_dump() for f in findings_raw],
            indent=2
        )
        
        # Fill template
        prompt = prompt_template.replace("{{DIFF}}", diff)
        prompt = prompt.replace("{{FINDINGS_RAW}}", findings_json)
        
        # Call Bob
        response = await self._call_bob(prompt, max_tokens=8192)
        
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
                "bob_validator_pass_complete",
                findings_validated_count=len(findings),
                filtered_count=len(findings_raw) - len(findings)
            )
            
            return findings
            
        except (json.JSONDecodeError, ValueError) as e:
            logger.error(
                "bob_validator_parse_error",
                error=str(e),
                response_preview=response[:500]
            )
            raise ValueError(f"Failed to parse Bob validator response: {e}")


# Global client instance
_bob_client: BobClient | None = None


def get_bob_client() -> BobClient:
    """Get or create global Bob client instance."""
    global _bob_client
    if _bob_client is None:
        _bob_client = BobClient()
    return _bob_client

# Made with Bob
