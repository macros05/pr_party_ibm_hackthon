"""
GitHub API client for fetching PR data.
Supports both authenticated and unauthenticated requests.
"""
import base64
import os
import re
from typing import Any

import httpx

from app.logging_config import get_logger

logger = get_logger(__name__)


class GitHubClient:
    """
    GitHub API client for fetching PR data.
    
    Fetches:
    - PR metadata (title, author, number)
    - Diff content
    - package.json (if exists)
    - Context files (files imported by changed files)
    """
    
    def __init__(self, token: str | None = None):
        from app.config import settings
        self.token = token or settings.github_token or os.getenv("GITHUB_TOKEN")
        self.base_url = "https://api.github.com"
        self.timeout = 30.0  # 30 seconds timeout
        
        logger.info(
            "github_client_initialized",
            authenticated=bool(self.token)
        )
    
    def _get_headers(self) -> dict[str, str]:
        """Get headers for GitHub API requests."""
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "PR-Party-Bot"
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"
        return headers
    
    @staticmethod
    def parse_pr_url(url: str) -> tuple[str, str, int]:
        """
        Parse GitHub PR URL into owner, repo, and PR number.
        
        Supports formats:
        - https://github.com/owner/repo/pull/123
        - github.com/owner/repo/pull/123
        - owner/repo/pull/123
        - owner/repo#123
        
        Returns:
            Tuple of (owner, repo, pr_number)
        
        Raises:
            ValueError: If URL format is invalid
        """
        # Remove protocol and trailing slashes
        url = url.strip().rstrip("/")
        url = re.sub(r"^https?://", "", url)
        url = re.sub(r"^github\.com/", "", url)
        
        # Try format: owner/repo/pull/123
        match = re.match(r"^([^/]+)/([^/]+)/pull/(\d+)$", url)
        if match:
            owner, repo, pr_num = match.groups()
            return owner, repo, int(pr_num)
        
        # Try format: owner/repo#123
        match = re.match(r"^([^/]+)/([^/#]+)#(\d+)$", url)
        if match:
            owner, repo, pr_num = match.groups()
            return owner, repo, int(pr_num)
        
        raise ValueError(
            f"Invalid GitHub PR URL format: {url}. "
            "Expected: https://github.com/owner/repo/pull/123"
        )
    
    async def fetch_pr(
        self,
        owner: str,
        repo: str,
        pr_number: int
    ) -> dict[str, Any]:
        """
        Fetch PR data from GitHub API.
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
        
        Returns:
            Dict with:
            - pr_number: int
            - pr_title: str
            - pr_author: str
            - diff: str (git diff)
            - package_json: str (JSON string, "{}" if not found)
            - context_files: dict[str, str] (empty for now)
        
        Raises:
            httpx.HTTPStatusError: If API request fails
        """
        logger.info(
            "fetching_pr_from_github",
            owner=owner,
            repo=repo,
            pr_number=pr_number
        )
        
        headers = self._get_headers()
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            # Fetch PR metadata
            pr_url = f"{self.base_url}/repos/{owner}/{repo}/pulls/{pr_number}"
            logger.debug("fetching_pr_metadata", url=pr_url)
            
            pr_response = await client.get(pr_url, headers=headers)
            pr_response.raise_for_status()
            pr_data = pr_response.json()
            
            pr_title = pr_data["title"]
            pr_author = pr_data["user"]["login"]
            
            logger.info(
                "pr_metadata_fetched",
                title=pr_title,
                author=pr_author
            )
            
            # Fetch diff. GitHub honours the Accept header over the .diff
            # extension — sending the default `application/vnd.github.v3+json`
            # would make this request return JSON metadata, not a diff, and
            # downstream parsing would silently see zero files. The diff media
            # type forces the actual unified-diff payload.
            diff_url = f"{pr_url}.diff"
            diff_headers = {**headers, "Accept": "application/vnd.github.v3.diff"}
            logger.debug("fetching_diff", url=diff_url)

            diff_response = await client.get(diff_url, headers=diff_headers)
            diff_response.raise_for_status()
            diff = diff_response.text

            if not diff.lstrip().startswith("diff --git"):
                logger.error(
                    "diff_response_not_a_diff",
                    content_type=diff_response.headers.get("content-type"),
                    body_preview=diff[:200],
                )
                raise RuntimeError(
                    "GitHub returned a non-diff payload for the .diff URL "
                    f"(content-type={diff_response.headers.get('content-type')!r}). "
                    "This usually means an Accept header override."
                )

            logger.info("diff_fetched", size_bytes=len(diff))
            
            # Fetch package.json if exists
            package_json = "{}"
            try:
                pkg_url = f"{self.base_url}/repos/{owner}/{repo}/contents/package.json"
                logger.debug("fetching_package_json", url=pkg_url)
                
                pkg_response = await client.get(pkg_url, headers=headers)
                if pkg_response.status_code == 200:
                    pkg_data = pkg_response.json()
                    # GitHub returns base64-encoded content
                    package_json = base64.b64decode(pkg_data["content"]).decode("utf-8")
                    logger.info("package_json_fetched")
                else:
                    logger.info("package_json_not_found")
            except Exception as e:
                logger.warning("package_json_fetch_failed", error=str(e))
            
            # Context files - TODO: Implement import detection
            # For now, return empty dict
            context_files: dict[str, str] = {}
            
            result = {
                "pr_number": pr_number,
                "pr_title": pr_title,
                "pr_author": pr_author,
                "diff": diff,
                "package_json": package_json,
                "context_files": context_files
            }
            
            logger.info(
                "pr_fetch_complete",
                pr_number=pr_number,
                diff_size=len(diff),
                has_package_json=package_json != "{}"
            )
            
            return result


# Global instance
_github_client: GitHubClient | None = None


def get_github_client() -> GitHubClient:
    """Get or create global GitHub client instance."""
    global _github_client
    if _github_client is None:
        _github_client = GitHubClient()
    return _github_client

# Made with Bob
