#!/usr/bin/env python3
"""
Raahi - Production-ready Discord Music Bot
Single entry point: python main.py
"""

from __future__ import annotations

import asyncio
import logging
import os
import signal
import sys
from pathlib import Path
from typing import Any

import structlog
from discord import Intents, Status
from rich.console import Console
from rich.logging import RichHandler

from bot.core.bot import RaahiBot
from bot.core.config import settings
from bot.database import init_db, create_tables

# Ensure directories exist
Path("data").mkdir(exist_ok=True)
Path("logs").mkdir(exist_ok=True)

# Structured logging setup
console = Console()

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.dev.ConsoleRenderer(colors=True) if settings.environment == "development" else structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Rich logging handler for beautiful output
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(message)s",
    handlers=[RichHandler(console=console, rich_tracebacks=True)],
)

logger = structlog.get_logger("raahi.main")


def setup_signal_handlers(bot: RaahiBot) -> None:
    """Graceful shutdown handling for Pterodactyl and production."""

    def shutdown_handler(sig: int, frame: Any) -> None:
        logger.info("received_signal", signal=sig, frame=frame)
        asyncio.create_task(bot.close())

    for sig in (signal.SIGTERM, signal.SIGINT):
        signal.signal(sig, shutdown_handler)


async def main() -> None:
    """Main async entry point."""
    logger.info("starting_raahi", version="1.0.0", env=settings.environment)

    # Validate config
    if not settings.discord_token:
        logger.error("missing_discord_token")
        sys.exit(1)

    # Initialize database
    await init_db()
    await create_tables()

    # Create bot
    intents = Intents.default()
    intents.message_content = True
    intents.voice_states = True
    intents.guilds = True
    intents.members = True  # Required for DJ role checks

    bot = RaahiBot(
        command_prefix=settings.default_prefix,
        intents=intents,
        owner_ids=settings.owner_ids,
        shard_count=settings.shard_count or None,
        shard_ids=settings.shard_ids,
        status=Status.online,
    )

    setup_signal_handlers(bot)

    try:
        await bot.start(settings.discord_token)
    except KeyboardInterrupt:
        logger.info("shutdown_requested")
    finally:
        if not bot.is_closed():
            await bot.close()
        logger.info("raahi_shutdown_complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as exc:
        logger.exception("fatal_startup_error", error=str(exc))
        sys.exit(1)
