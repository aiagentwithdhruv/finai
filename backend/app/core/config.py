"""
Application configuration — validated at startup via pydantic-settings.
Fails fast on missing critical environment variables.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, AnyHttpUrl, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ------------------------------------------------------------------
    # Supabase
    # ------------------------------------------------------------------
    supabase_url: AnyHttpUrl = Field(..., description="Supabase project URL")
    supabase_anon_key: str = Field(..., description="Supabase anon/public key")
    supabase_service_key: str = Field(..., description="Supabase service role key (server-side only)")

    # ------------------------------------------------------------------
    # Database — asyncpg-compatible URL
    # ------------------------------------------------------------------
    database_url: str = Field(
        ...,
        description=(
            "PostgreSQL connection string — must use postgresql+asyncpg:// scheme. "
            "Example: postgresql+asyncpg://user:pass@host:5432/dbname"
        ),
    )

    # ------------------------------------------------------------------
    # LLM providers
    # ------------------------------------------------------------------
    anthropic_api_key: str = Field(..., description="Anthropic API key for Claude models")
    openai_api_key: str = Field(..., description="OpenAI API key for GPT-4o + embeddings")
    xai_api_key: str = Field(default="", description="xAI API key for Grok models (optional)")
    moonshot_api_key: str = Field(default="", description="Moonshot API key for Kimi models (optional)")

    # ------------------------------------------------------------------
    # Model selection — configurable per-deployment via env vars
    # ------------------------------------------------------------------
    llm_model: str = Field(
        default="claude-sonnet-4-6",
        description="Primary LLM for RAG chat & generation (claude-sonnet-4-6 | grok-4-1-fast-reasoning | kimi-k2.5)",
    )
    llm_temperature: float = Field(default=0.2, description="Default temperature for RAG chat")
    classifier_model: str = Field(
        default="claude-haiku-4-5-20251001",
        description="Lightweight model for document classification",
    )
    embedding_model: str = Field(
        default="text-embedding-3-small",
        description="Embedding model for vector search",
    )

    # ------------------------------------------------------------------
    # External data sources
    # ------------------------------------------------------------------
    companies_house_api_key: str = Field(..., description="UK Companies House REST API key")
    alpha_vantage_api_key: str = Field(
        default="",
        description="Alpha Vantage API key (optional — yfinance used as primary)",
    )
    fred_api_key: str = Field(..., description="FRED (Federal Reserve) macroeconomic data API key")

    # ------------------------------------------------------------------
    # Observability
    # ------------------------------------------------------------------
    langsmith_api_key: str = Field(
        default="",
        description="LangSmith tracing key (optional but recommended for production)",
    )
    langsmith_project: str = Field(
        default="finai",
        description="LangSmith project name for trace grouping",
    )

    # ------------------------------------------------------------------
    # App settings
    # ------------------------------------------------------------------
    environment: Literal["development", "staging", "production"] = Field(
        default="development",
        description="Deployment environment — controls feature flags and log verbosity",
    )
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
    )
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        description="Allowed CORS origins — comma-separated string or JSON list",
    )

    # ------------------------------------------------------------------
    # Derived / computed
    # ------------------------------------------------------------------
    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def is_development(self) -> bool:
        return self.environment == "development"

    # ------------------------------------------------------------------
    # Validators
    # ------------------------------------------------------------------
    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if not v.startswith("postgresql"):
            raise ValueError(
                "DATABASE_URL must start with 'postgresql' — "
                f"got: {v[:30]}..."
            )
        if "+asyncpg" not in v:
            # Auto-upgrade sync URL to asyncpg driver
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Accept comma-separated string or JSON list from env var."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    @model_validator(mode="after")
    def warn_missing_optional_keys(self) -> Settings:
        """Emit warnings for missing optional-but-recommended keys."""
        if not self.langsmith_api_key and self.is_production:
            import warnings
            warnings.warn(
                "LANGSMITH_API_KEY is not set — LLM traces will not be captured in production.",
                stacklevel=2,
            )
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return the singleton Settings instance.
    Cached after first call — call invalidate_settings_cache() in tests.
    """
    return Settings()


def invalidate_settings_cache() -> None:
    """Clear the lru_cache — use in tests to reload env vars between cases."""
    get_settings.cache_clear()
