"""
RaahiBot - Core Discord bot class with sharding, Lavalink, and service integration.
"""

from __future__ import annotations

import asyncio
import contextlib
from typing import Any

import structlog
import wavelink
from discord.ext.commands import AutoShardedBot
from discord import Interaction, Message
from discord.ext import commands

from bot.constants import BRANDING
from bot.core.config import settings
from bot.database.repositories import GuildRepository, UserRepository, PremiumRepository
from bot.music.player import RaahiPlayer
from bot.services.premium import PremiumService
from bot.services.no_prefix import NoPrefixService
from bot.utils.helpers import get_prefix

logger = structlog.get_logger(__name__)


class RaahiBot(AutoShardedBot):
    """Main bot class. Clean, modular, production-ready."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        # Services
        self.premium_service = PremiumService(self)
        self.no_prefix_service = NoPrefixService(self)

        # Repositories
        self.guild_repo = GuildRepository()
        self.user_repo = UserRepository()
        self.premium_repo = PremiumRepository()

        # Wavelink nodes
        self.wavelink_nodes: dict[str, wavelink.Node] = {}

        # Feature flags
        self.enable_dashboard = settings.enable_dashboard

        # Startup flag
        self.ready = False

    async def setup_hook(self) -> None:
        """Load cogs and initialize Lavalink."""
        logger.info("setup_hook_started")

        # Load all cogs
        cogs = [
            "bot.cogs.music",
            "bot.cogs.premium",
            "bot.cogs.settings",
            "bot.cogs.utility",
            "bot.cogs.help",
        ]

        for cog in cogs:
            try:
                await self.load_extension(cog)
                logger.info("cog_loaded", cog=cog)
            except Exception as exc:
                logger.exception("cog_load_failed", cog=cog, error=str(exc))

        # Sync slash commands (global for production)
        if settings.environment == "production":
            try:
                await asyncio.wait_for(self.tree.sync(), timeout=20.0)
                logger.info("slash_commands_synced_globally")
            except asyncio.TimeoutError:
                logger.warning("slash_commands_sync_timeout", timeout=20.0)
            except Exception as exc:
                logger.exception("slash_commands_sync_failed", error=str(exc))
        else:
            # Sync to test guild in dev
            pass

        # Initialize Wavelink, but never let it delay Discord readiness.
        # Discord will call `on_ready` after setup_hook finishes.
        logger.info("wavelink_init_task_start")
        self.loop.create_task(self._init_wavelink())


        # Start background tasks
        self.loop.create_task(self._start_background_tasks())

        logger.info("setup_hook_complete", bot_name=BRANDING.name)


    async def _init_wavelink(self) -> None:
        """Connect to all configured Lavalink nodes with failover."""
        logger.info("initializing_wavelink", node_count=len(settings.lavalink_nodes))

        nodes = []
        for node_config in settings.lavalink_nodes:
            # wavelink==3.5.2 Node() signature does not support region/secure
            node = wavelink.Node(
                identifier=node_config.identifier,
                uri=node_config.uri,
                password=node_config.password,
            )
            nodes.append(node)

        # Connect nodes (don't block startup indefinitely if nodes are slow/unreachable)
        try:
            await asyncio.wait_for(
                wavelink.Pool.connect(nodes=nodes, client=self, cache_capacity=100),
                timeout=10.0,
            )
        except asyncio.TimeoutError:
            logger.warning("wavelink_connect_timeout", timeout=10.0)
        except Exception as exc:
            logger.exception("wavelink_connect_failed", error=str(exc))

        # Register player class
        wavelink.Player = RaahiPlayer  # type: ignore[assignment]

        logger.info("wavelink_initialized", nodes=len(wavelink.Pool.nodes))

    async def _start_background_tasks(self) -> None:
        """Start premium expiration worker, player state saver, etc."""
        await asyncio.sleep(5)  # Wait for ready

        # Premium expiration worker
        self.loop.create_task(self.premium_service.run_expiration_worker())

        # No-prefix maintenance
        self.loop.create_task(self.no_prefix_service.run_cleanup())

        logger.info("background_tasks_started")

    async def on_ready(self) -> None:
        """Bot ready handler."""
        if self.ready:
            return

        self.ready = True

        user = self.user
        logger.info(
            "bot_ready",
            name=user.name if user else "Unknown",
            id=user.id if user else 0,
            guilds=len(self.guilds),
            shards=self.shard_count,
        )

        # Set initial presence (never let presence update block readiness)
        import discord
        try:
            await self.change_presence(
                activity=discord.Activity(
                    type=discord.ActivityType.listening,
                    name=f"{BRANDING.name} • /play",
                )
            )
            logger.info("presence_set")
        except Exception as exc:
            logger.exception("presence_set_failed", error=str(exc))


    async def on_message(self, message: Message) -> None:
        """Handle prefix + no-prefix commands."""
        if message.author.bot or not message.guild:
            return

        # No-prefix premium commands
        if await self.no_prefix_service.should_handle_no_prefix(message):
            await self.no_prefix_service.handle_no_prefix(message)
            return

        # Normal prefix handling
        await self.process_commands(message)

    async def get_context(self, message: Message, *, cls: type[commands.Context] | None = None) -> commands.Context:
        """Override for custom context if needed."""
        return await super().get_context(message, cls=cls)

    async def on_command_error(self, ctx: commands.Context, error: Exception) -> None:
        """Global command error handler."""
        from bot.utils.error_handler import handle_command_error
        await handle_command_error(ctx, error)

    async def on_app_command_error(self, interaction: Interaction, error: Exception) -> None:
        """Global slash command error handler."""
        from bot.utils.error_handler import handle_app_command_error
        await handle_app_command_error(interaction, error)

    async def close(self) -> None:
        """Graceful shutdown."""
        logger.info("bot_closing")

        # Disconnect all players gracefully (wavelink==3.5.2 Pool has no .players)
        with contextlib.suppress(Exception):
            players = getattr(wavelink.Pool, "players", {})
            for _guild_id, player in list(players.items()):
                with contextlib.suppress(Exception):
                    await player.disconnect()

        await super().close()
        logger.info("bot_closed")
