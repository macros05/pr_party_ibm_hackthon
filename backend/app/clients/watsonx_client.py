"""
IBM watsonx.ai client with automatic IAM token refresh.
Tokens expire after 60 minutes - refresh 5 minutes before expiry.
"""
import time
from datetime import datetime, timedelta
from typing import Any

import httpx
from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
from ibm_watsonx_ai import APIClient, Credentials
from ibm_watsonx_ai.foundation_models import ModelInference

from app.config import settings
from app.logging_config import get_logger

logger = get_logger(__name__)


class WatsonxClient:
    """
    Manages watsonx.ai API client with automatic token refresh.
    
    IAM tokens expire after 60 minutes. We refresh 5 minutes before expiry
    to avoid mid-request failures.
    """
    
    def __init__(self):
        self.api_key = settings.watsonx_api_key
        self.project_id = settings.watsonx_project_id
        self.url = settings.watsonx_url
        self.refresh_margin = settings.iam_token_refresh_margin_seconds
        
        self._client: APIClient | None = None
        self._token_expiry: datetime | None = None
        
        logger.info("watsonx_client_initialized", url=self.url)
    
    def _should_refresh_token(self) -> bool:
        """Check if token needs refresh."""
        if self._token_expiry is None:
            return True
        
        # Refresh if within margin of expiry
        time_until_expiry = (self._token_expiry - datetime.now()).total_seconds()
        return time_until_expiry <= self.refresh_margin
    
    def _refresh_client(self) -> None:
        """Create new API client with fresh token."""
        logger.info("refreshing_watsonx_token")
        
        credentials = Credentials(
            url=self.url,
            api_key=self.api_key
        )
        
        self._client = APIClient(credentials=credentials, project_id=self.project_id)
        
        # IAM tokens are valid for 60 minutes
        self._token_expiry = datetime.now() + timedelta(minutes=60)
        
        logger.info(
            "watsonx_token_refreshed",
            expires_at=self._token_expiry.isoformat(),
            valid_for_seconds=3600
        )
    
    def get_client(self) -> APIClient:
        """Get API client, refreshing token if needed."""
        if self._should_refresh_token():
            self._refresh_client()
        
        assert self._client is not None, "Client should be initialized"
        return self._client
    
    async def generate_text(
        self,
        model_id: str,
        prompt: str,
        max_tokens: int | None = None,
        temperature: float | None = None,
        **kwargs: Any
    ) -> str:
        """
        Generate text using watsonx.ai foundation model.
        
        Args:
            model_id: Model identifier (e.g., 'ibm/granite-3-3-8b-instruct')
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0-1.0)
            **kwargs: Additional model parameters
        
        Returns:
            Generated text
        """
        client = self.get_client()
        
        # Set defaults from config
        if max_tokens is None:
            max_tokens = settings.granite_max_tokens
        if temperature is None:
            temperature = settings.granite_temperature
        
        logger.info(
            "watsonx_generate_request",
            model_id=model_id,
            prompt_length=len(prompt),
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        start_time = time.time()
        
        try:
            model = ModelInference(
                model_id=model_id,
                api_client=client,
                params={
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                    **kwargs
                }
            )
            
            result = model.generate_text(prompt=prompt)
            
            elapsed = time.time() - start_time
            
            logger.info(
                "watsonx_generate_success",
                model_id=model_id,
                response_length=len(result),
                elapsed_seconds=round(elapsed, 2)
            )
            
            return result
            
        except Exception as e:
            elapsed = time.time() - start_time
            logger.error(
                "watsonx_generate_error",
                model_id=model_id,
                error=str(e),
                elapsed_seconds=round(elapsed, 2)
            )
            raise


# Global client instance
_watsonx_client: WatsonxClient | None = None


def get_watsonx_client() -> WatsonxClient:
    """Get or create global watsonx client instance."""
    global _watsonx_client
    if _watsonx_client is None:
        _watsonx_client = WatsonxClient()
    return _watsonx_client

# Made with Bob
