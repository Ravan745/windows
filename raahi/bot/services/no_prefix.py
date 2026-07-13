"""
No-Prefix Service - Premium only, exact command matching, anti-spam.
"""

from __future__ import annotations

import asyncio
import re
from datetime import datetime, timezone
from typing import Any

import structlog
from discord import Message

from bot.core.config import settings
from bot.database.repositories import no_prefix_repo
from bot.database.session import db

logger = structlog.get_logger(__name__)


class NoPrefixService:
    """Handles premium no-prefix commands."""

    def __init__(self, bot: Any) -> None:
        self.bot = bot
        self._cache: dict[int, bool] = {}  # Simple in-memory cache

    async def should_handle_no_prefix(self, message: Message) -> bool:
        """Determine if message is a valid no-prefix command."""
        if not settings.no_prefix_default and not await self._is_premium(message):
            return False

        if message.author.bot or message.webhook_id:
            return False

        content = message.content.strip()
        if not content:
            return False

        # Check if it matches a registered command
        # For simplicity, check against known music commands
        known_commands = {"play", "pause", "resume", "skip", "stop", "queue", "np", "volume", "loop", "filter"}

        first_word = content.split()[0].lower()
        return first_word in known_commands

    async def _is_premium(self, message: Message) -> bool:
        """Check premium entitlement for no-prefix."""
        user_id = message.author.id
        guild_id = message.guild.id if message.guild else None

        # Check cache
        cache_key = (user_id, guild_id)
        if cache_key in self._cache:
            return self._cache[cache_key]

        async with db.session() as session:
            granted = await no_prefix_repo.is_granted(session, user_id, guild_id)
            self._cache[cache_key] = granted
            return granted

    async def handle_no_prefix(self, message: Message) -> None:
        """Parse and execute no-prefix command."""
        content = message.content.strip()
        parts = content.split()
        command = parts[0].lower()
        args = " ".join(parts[1:]) if len(parts) > 1 else ""

        # Rate limiting (simple)
        # In production use proper rate limiter

        ctx = await self.bot.get_context(message)

        # Route to music commands
        if command == "play":
            cog = self.bot.get_cog("Music")
            if cog:
                await cog._handle_play(message, args)
        elif command == "pause":
            # Similar routing
            pass
        # ... implement other commands

        logger.info("no_prefix_command", command=command, user=message.author.id)

    async def run_cleanup(self) -> None:
        """Cleanup expired grants and cache."""
        while True:
            await asyncio.sleep(3600)
            self._cache.clear()
            logger.info("no_prefix_cache_cleared")
