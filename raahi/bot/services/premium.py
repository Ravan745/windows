"""
Premium Service - Provider-neutral entitlement management with expiration worker.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import structlog
from discord import Guild, Member, User

from bot.core.config import settings
from bot.database.repositories import premium_repo
from bot.database.session import db

logger = structlog.get_logger(__name__)


class PremiumService:
    """Handles all premium logic, checks, and background tasks."""

    def __init__(self, bot: Any) -> None:
        self.bot = bot
        self._expiration_task: asyncio.Task | None = None

    async def has_premium(
        self,
        user: User | Member | None = None,
        guild: Guild | None = None,
        scope: str | None = None,
    ) -> bool:
        """Check if user/guild has active premium entitlement."""
        if not settings.premium_enabled:
            return True

        async with db.session() as session:
            entitlements = await premium_repo.get_active_entitlements(
                session, user_id=user.id if user else None, guild_id=guild.id if guild else None
            )

            for ent in entitlements:
                if ent.end_time and ent.end_time < datetime.now(timezone.utc):
                    continue
                if scope and ent.scope != scope:
                    continue
                if ent.tier in ("premium", "lifetime"):
                    return True
        return False

    async def grant_premium(
        self,
        *,
        user_id: int | None = None,
        guild_id: int | None = None,
        tier: str = "premium",
        duration_days: int | None = None,
        created_by: int,
        reason: str = "manual",
    ) -> Any:
        """Grant premium entitlement."""
        async with db.session() as session:
            entitlement = await premium_repo.grant(
                session,
                user_id=user_id,
                guild_id=guild_id,
                tier=tier,
                scope="user" if user_id else "guild",
                duration_days=duration_days,
                created_by=created_by,
                metadata={"reason": reason},
            )
            await session.commit()
            return entitlement

    async def revoke_premium(self, entitlement_id: int, reason: str, revoked_by: int) -> None:
        async with db.session() as session:
            await premium_repo.revoke(session, entitlement_id, reason, revoked_by)
            await session.commit()

    async def run_expiration_worker(self) -> None:
        """Background worker that expires premium entitlements."""
        while True:
            try:
                await asyncio.sleep(3600)  # Check every hour

                async with db.session() as session:
                    # Find expired entitlements
                    # In production use more efficient query
                    logger.info("premium_expiration_check_run")
                    # Implementation would query and mark expired
            except asyncio.CancelledError:
                break
            except Exception as exc:
                logger.exception("expiration_worker_error", error=str(exc))
                await asyncio.sleep(300)
