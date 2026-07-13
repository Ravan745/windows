"""
Raahi Configuration - Typed Pydantic settings with validation.
All secrets from env, validated at startup.
"""

from __future__ import annotations

import json
import os
from typing import Any, Literal

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class LavalinkNode(BaseSettings):
    uri: str
    password: str
    identifier: str = "primary"
    region: str = "us"
    secure: bool = False


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Discord
    discord_token: str = Field(..., min_length=50)
    discord_application_id: int
    owner_ids: list[int] = Field(default_factory=list)

    # Branding
    bot_name: str = Field(default="Raahi")
    bot_description: str = Field(default="Your cozy music companion")
    bot_color: str = Field(default="#A78BFA")
    support_server_invite: str = Field(default="https://discord.gg/raahi")
    bot_invite_url: str = Field(default="")

    # Prefix
    default_prefix: str = Field(default="raahi")
    mention_prefix: bool = Field(default=True)

    # Database
    database_url: str = Field(default="sqlite+aiosqlite:///data/raahi.db")

    # Lavalink
    lavalink_nodes: list[LavalinkNode] = Field(default_factory=list)

    # Spotify (optional)
    spotify_client_id: str | None = None
    spotify_client_secret: str | None = None

    # Lyrics
    genius_api_key: str | None = None

    # Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = Field(default="INFO")
    environment: Literal["development", "production"] = Field(default="production")
    log_file: str = Field(default="logs/raahi.log")

    # Premium
    premium_enabled: bool = Field(default=True)
    premium_trial_days: int = Field(default=7)
    default_tier: str = Field(default="free")

    # Sharding
    shard_count: int = Field(default=0)
    shard_ids: list[int] | None = None

    # Feature flags
    enable_dashboard: bool = Field(default=False)
    enable_auto_play: bool = Field(default=True)
    enable_24_7: bool = Field(default=True)
    enable_radio: bool = Field(default=True)
    enable_lyrics: bool = Field(default=True)
    enable_filters: bool = Field(default=True)

    # Limits & Security
    max_queue_size: int = Field(default=200, ge=10)
    max_playlist_size: int = Field(default=50, ge=5)
    rate_limit_window: int = Field(default=60)
    rate_limit_max: int = Field(default=10)

    # No-prefix
    no_prefix_default: bool = Field(default=False)

    # Observability
    sentry_dsn: str | None = None
    health_port: int = Field(default=8080)

    @field_validator("lavalink_nodes", mode="before")
    @classmethod
    def parse_lavalink_nodes(cls, v: Any) -> list[LavalinkNode]:
        if isinstance(v, str):
            try:
                data = json.loads(v)
                return [LavalinkNode(**node) for node in data]
            except Exception as e:
                raise ValueError(f"Invalid LAVALINK_NODES JSON: {e}") from e
        if isinstance(v, list):
            return [LavalinkNode(**node) if isinstance(node, dict) else node for node in v]
        return v or []

    @field_validator("owner_ids", mode="before")
    @classmethod
    def parse_owner_ids(cls, v: Any) -> list[int]:
        if isinstance(v, str):
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        if isinstance(v, int):
            return [v]
        if isinstance(v, list):
            return [int(x) for x in v]
        return v or []

    @field_validator("shard_ids", mode="before")
    @classmethod
    def parse_shard_ids(cls, v: Any) -> list[int] | None:
        if isinstance(v, str):
            if not v.strip():
                return None
            return [int(x.strip()) for x in v.split(",") if x.strip()]
        return v

    @model_validator(mode="after")
    def validate_nodes(self) -> Settings:
        if not self.lavalink_nodes:
            raise ValueError("At least one Lavalink node must be configured")
        return self

    def get_bot_color(self) -> int:
        """Convert hex color string to int."""
        color = self.bot_color.lstrip("#")
        return int(color, 16)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


# Singleton settings instance
settings = Settings()  # type: ignore[call-arg]
