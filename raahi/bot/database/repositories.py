"""
Database Repositories - Clean abstraction layer for all models.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import structlog
from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession

from bot.database.models import (
    Guild, User, PremiumEntitlement, Playlist, PlayerState,
    NoPrefixGrant, AuditLog, LicenseKey, KeyRedemption
)
from bot.database.session import db

logger = structlog.get_logger(__name__)


class BaseRepository:
    """Base repository with common operations."""

    model: Any = None

    async def get_by_id(self, session: AsyncSession, id: int) -> Any | None:
        result = await session.execute(select(self.model).where(self.model.id == id))
        return result.scalar_one_or_none()

    async def create(self, session: AsyncSession, **kwargs: Any) -> Any:
        instance = self.model(**kwargs)
        session.add(instance)
        await session.flush()
        return instance


class GuildRepository(BaseRepository):
    model = Guild

    async def get_or_create(self, session: AsyncSession, guild_id: int) -> Guild:
        result = await session.execute(
            select(Guild).where(Guild.id == guild_id)
        )
        guild = result.scalar_one_or_none()

        if guild is None:
            guild = Guild(id=guild_id)
            session.add(guild)
            await session.flush()
        return guild

    async def update_settings(
        self, session: AsyncSession, guild_id: int, **kwargs: Any
    ) -> Guild:
        guild = await self.get_or_create(session, guild_id)
        for key, value in kwargs.items():
            if hasattr(guild, key):
                setattr(guild, key, value)
        await session.flush()
        return guild


class UserRepository(BaseRepository):
    model = User

    async def get_or_create(self, session: AsyncSession, user_id: int) -> User:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            user = User(id=user_id)
            session.add(user)
            await session.flush()
        return user


class PremiumRepository(BaseRepository):
    model = PremiumEntitlement

    async def get_active_entitlements(
        self, session: AsyncSession, user_id: int | None = None, guild_id: int | None = None
    ) -> list[PremiumEntitlement]:
        stmt = select(PremiumEntitlement).where(
            PremiumEntitlement.status == "active"
        )

        if user_id:
            stmt = stmt.where(PremiumEntitlement.user_id == user_id)
        if guild_id:
            stmt = stmt.where(PremiumEntitlement.guild_id == guild_id)

        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def grant(
        self,
        session: AsyncSession,
        *,
        user_id: int | None = None,
        guild_id: int | None = None,
        tier: str = "premium",
        scope: str = "user",
        duration_days: int | None = None,
        created_by: int | None = None,
        metadata: dict | None = None,
    ) -> PremiumEntitlement:
        end_time = None
        if duration_days:
            end_time = datetime.now(timezone.utc) + __import__("datetime").timedelta(days=duration_days)

        entitlement = PremiumEntitlement(
            user_id=user_id,
            guild_id=guild_id,
            tier=tier,
            scope=scope,
            end_time=end_time,
            created_by=created_by,
            metadata_json=metadata or {},
        )
        session.add(entitlement)
        await session.flush()

        # Audit
        audit = AuditLog(
            actor_id=created_by or 0,
            action="grant_premium",
            target_type="entitlement",
            target_id=entitlement.id,
            details={"tier": tier, "scope": scope},
        )
        session.add(audit)

        return entitlement

    async def revoke(
        self, session: AsyncSession, entitlement_id: int, reason: str, revoked_by: int
    ) -> None:
        result = await session.execute(
            select(PremiumEntitlement).where(PremiumEntitlement.id == entitlement_id)
        )
        ent = result.scalar_one_or_none()
        if ent:
            ent.status = "revoked"
            ent.revoked_reason = reason
            await session.flush()

            audit = AuditLog(
                actor_id=revoked_by,
                action="revoke_premium",
                target_type="entitlement",
                target_id=entitlement_id,
                details={"reason": reason},
            )
            session.add(audit)


class PlaylistRepository(BaseRepository):
    model = Playlist

    async def create_playlist(
        self,
        session: AsyncSession,
        *,
        name: str,
        user_id: int | None = None,
        guild_id: int | None = None,
        tracks: list[dict] | None = None,
        is_public: bool = False,
    ) -> Playlist:
        playlist = Playlist(
            name=name,
            user_id=user_id,
            guild_id=guild_id,
            tracks=tracks or [],
            track_count=len(tracks or []),
            is_public=is_public,
        )
        session.add(playlist)
        await session.flush()
        return playlist

    async def get_user_playlists(self, session: AsyncSession, user_id: int) -> list[Playlist]:
        result = await session.execute(
            select(Playlist).where(Playlist.user_id == user_id)
        )
        return list(result.scalars().all())


class PlayerStateRepository(BaseRepository):
    model = PlayerState

    async def save_state(
        self, session: AsyncSession, guild_id: int, **state: Any
    ) -> PlayerState:
        result = await session.execute(
            select(PlayerState).where(PlayerState.guild_id == guild_id)
        )
        player_state = result.scalar_one_or_none()

        if player_state is None:
            player_state = PlayerState(guild_id=guild_id, **state)
            session.add(player_state)
        else:
            for k, v in state.items():
                setattr(player_state, k, v)

        await session.flush()
        return player_state

    async def get_state(self, session: AsyncSession, guild_id: int) -> PlayerState | None:
        result = await session.execute(
            select(PlayerState).where(PlayerState.guild_id == guild_id)
        )
        return result.scalar_one_or_none()


class NoPrefixRepository(BaseRepository):
    model = NoPrefixGrant

    async def grant(
        self, session: AsyncSession, *, user_id: int | None = None, guild_id: int | None = None,
        expires_at: datetime | None = None, granted_by: int, reason: str | None = None
    ) -> NoPrefixGrant:
        grant = NoPrefixGrant(
            user_id=user_id,
            guild_id=guild_id,
            expires_at=expires_at,
            granted_by=granted_by,
            reason=reason,
        )
        session.add(grant)
        await session.flush()
        return grant

    async def is_granted(
        self, session: AsyncSession, user_id: int, guild_id: int | None = None
    ) -> bool:
        stmt = select(NoPrefixGrant).where(
            (NoPrefixGrant.user_id == user_id) | (NoPrefixGrant.guild_id == guild_id),
            NoPrefixGrant.expires_at.is_(None) | (NoPrefixGrant.expires_at > datetime.now(timezone.utc))
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none() is not None


# Repository instances for easy DI
guild_repo = GuildRepository()
user_repo = UserRepository()
premium_repo = PremiumRepository()
playlist_repo = PlaylistRepository()
player_state_repo = PlayerStateRepository()
no_prefix_repo = NoPrefixRepository()
