"""
Application configuration using pydantic-settings.
Loads from environment variables with .env file support.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""
    
    # IBM watsonx.ai Configuration
    watsonx_api_key: str = "test_key"
    watsonx_project_id: str = "test_project"
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    
    
    # GitHub Configuration (optional)
    github_token: str | None = None
    
    # Application Settings
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000,http://localhost:3001"
    
    # Granite Model Configuration
    # Using granite-8b-code-instruct (supported in watsonx.ai environment)
    granite_model_id: str = "ibm/granite-8b-code-instruct"
    granite_max_tokens: int = 2048
    granite_temperature: float = 0.7
    
    # IAM Token Refresh (watsonx.ai tokens expire after 60min)
    iam_token_refresh_margin_seconds: int = 300  # Refresh 5min before expiry
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()

# Made with Bob
