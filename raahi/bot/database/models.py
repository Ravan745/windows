"""
Raahi Database Models - SQLAlchemy 2.0 async models.
All models defined here for clean migrations.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.sql import func


class Base(DeclarativeBase):
    """Base class for all models."""
    pass


class TimestampMixin:
    """Mixin for created/updated timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Guild(Base, TimestampMixin):
    """Guild settings and configuration."""
    __tablename__ = "guilds"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    prefix: Mapped[str | None] = mapped_column(String(32), default=None)
    language: Mapped[str] = mapped_column(String(8), default="en")
    dj_role_id: Mapped[int | None] = mapped_column(BigInteger, default=None)
    request_channel_id: Mapped[int | None] = mapped_column(BigInteger, default=None)
    enable_24_7: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_autoplay: Mapped[bool] = mapped_column(Boolean, default=True)
    max_queue_size: Mapped[int] = mapped_column(Integer, default=200)
    theme: Mapped[str] = mapped_column(String(32), default="cozy")
    command_blacklist: Mapped[list[str]] = mapped_column(JSON, default=list)
    allowed_channels: Mapped[list[int]] = mapped_column(JSON, default=list)

    # Relationships
    playlists = relationship("Playlist", back_populates="guild", cascade="all, delete-orphan")
    player_state = relationship("PlayerState", back_populates="guild", uselist=False, cascade="all, delete-orphan")


class User(Base, TimestampMixin):
    """User preferences and data."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    language: Mapped[str] = mapped_column(String(8), default="en")
    favorite_tracks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    listening_history: Mapped[list[dict]] = mapped_column(JSON, default=list)


class PremiumEntitlement(Base, TimestampMixin):
    """Premium entitlements - provider neutral."""
    __tablename__ = "premium_entitlements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    guild_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    tier: Mapped[str] = mapped_column(String(32), default="premium")
    scope: Mapped[str] = mapped_column(String(32))  # user, guild, lifetime, noprefix
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    end_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="active")  # active, revoked, expired
    source: Mapped[str] = mapped_column(String(64), default="owner")
    external_reference: Mapped[str | None] = mapped_column(String(128), nullable=True)
    metadata_json: Mapped[dict] = mapped_column(JSON, default=dict)
    created_by: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    revoked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("idx_premium_user_guild", "user_id", "guild_id"),
        Index("idx_premium_status", "status"),
    )


class LicenseKey(Base, TimestampMixin):
    """Redeemable license keys."""
    __tablename__ = "license_keys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    tier: Mapped[str] = mapped_column(String(32))
    max_activations: Mapped[int] = mapped_column(Integer, default=1)
    activations: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by: Mapped[int] = mapped_column(BigInteger)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)


class KeyRedemption(Base, TimestampMixin):
    """Key redemptions audit log."""
    __tablename__ = "key_redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    key_id: Mapped[int] = mapped_column(Integer, ForeignKey("license_keys.id"))
    user_id: Mapped[int] = mapped_column(BigInteger)
    guild_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class Playlist(Base, TimestampMixin):
    """Saved playlists (user and server)."""
    __tablename__ = "playlists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    guild_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("guilds.id"), nullable=True)
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    name: Mapped[str] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    tracks: Mapped[list[dict]] = mapped_column(JSON, default=list)
    track_count: Mapped[int] = mapped_column(Integer, default=0)

    guild = relationship("Guild", back_populates="playlists")


class PlayerState(Base, TimestampMixin):
    """Resumable player state for 24/7 and restarts."""
    __tablename__ = "player_states"

    guild_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("guilds.id"), primary_key=True)
    channel_id: Mapped[int] = mapped_column(BigInteger)
    current_track: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    queue: Mapped[list[dict]] = mapped_column(JSON, default=list)
    volume: Mapped[int] = mapped_column(Integer, default=100)
    loop_mode: Mapped[str] = mapped_column(String(16), default="off")
    is_24_7: Mapped[bool] = mapped_column(Boolean, default=False)
    filters: Mapped[dict] = mapped_column(JSON, default=dict)

    guild = relationship("Guild", back_populates="player_state")


class NoPrefixGrant(Base, TimestampMixin):
    """Premium no-prefix entitlements."""
    __tablename__ = "no_prefix_grants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    guild_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    granted_by: Mapped[int] = mapped_column(BigInteger)
    reason: Mapped[str | None] = mapped_column(Text)


class AuditLog(Base, TimestampMixin):
    """Audit trail for sensitive operations."""
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    actor_id: Mapped[int] = mapped_column(BigInteger)
    action: Mapped[str] = mapped_column(String(64))
    target_type: Mapped[str] = mapped_column(String(32))
    target_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    details: Mapped[dict] = mapped_column(JSON, default=dict)


class CommandUsage(Base):
    """Usage counters and stats."""
    __tablename__ = "command_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    command: Mapped[str] = mapped_column(String(64))
    guild_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    user_id: Mapped[int] = mapped_column(BigInteger)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# Additional models for history, favorites, blacklist etc. can be extended similarly.
