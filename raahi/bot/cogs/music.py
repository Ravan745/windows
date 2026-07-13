"""
Music Cog - Full music commands with slash + prefix support.
"""

from __future__ import annotations

import asyncio
from typing import Optional

import structlog
import wavelink
from discord import Embed, Interaction, app_commands
from discord.ext import commands

from bot.constants import BRANDING, Colors
from bot.core.bot import RaahiBot
from bot.checks.voice import voice_check, same_voice_check, dj_check
from bot.views.player import PlayerView, QueueView
from bot.utils.helpers import format_duration, create_track_embed

logger = structlog.get_logger(__name__)


class Music(commands.Cog):
    """Music commands."""

    def __init__(self, bot: RaahiBot) -> None:
        self.bot = bot

    # ==================== SLASH COMMANDS ====================

    @app_commands.command(name="play", description="Play a song or playlist")
    @app_commands.describe(query="Song name, URL, or playlist")
    async def play_slash(self, interaction: Interaction, query: str) -> None:
        await self._handle_play(interaction, query)

    @app_commands.command(name="pause", description="Pause playback")
    async def pause_slash(self, interaction: Interaction) -> None:
        await self._handle_pause(interaction)

    @app_commands.command(name="resume", description="Resume playback")
    async def resume_slash(self, interaction: Interaction) -> None:
        await self._handle_resume(interaction)

    @app_commands.command(name="skip", description="Skip the current track")
    async def skip_slash(self, interaction: Interaction) -> None:
        await self._handle_skip(interaction)

    @app_commands.command(name="stop", description="Stop playback and clear queue")
    async def stop_slash(self, interaction: Interaction) -> None:
        await self._handle_stop(interaction)

    @app_commands.command(name="queue", description="Show the current queue")
    async def queue_slash(self, interaction: Interaction) -> None:
        await self._handle_queue(interaction)

    @app_commands.command(name="nowplaying", description="Show now playing")
    async def np_slash(self, interaction: Interaction) -> None:
        await self._handle_np(interaction)

    @app_commands.command(name="volume", description="Set volume (0-150)")
    @app_commands.describe(level="Volume level")
    async def volume_slash(self, interaction: Interaction, level: app_commands.Range[int, 0, 150]) -> None:
        await self._handle_volume(interaction, level)

    @app_commands.command(name="loop", description="Set loop mode")
    @app_commands.describe(mode="off | track | queue")
    async def loop_slash(self, interaction: Interaction, mode: str) -> None:
        await self._handle_loop(interaction, mode)

    @app_commands.command(name="filter", description="Apply audio filter")
    @app_commands.describe(name="Filter name")
    async def filter_slash(self, interaction: Interaction, name: str) -> None:
        await self._handle_filter(interaction, name)

    # ==================== PREFIX COMMANDS ====================

    @commands.command(name="play", aliases=["p"])
    async def play_prefix(self, ctx: commands.Context, *, query: str) -> None:
        await self._handle_play(ctx, query)

    @commands.command(name="pause")
    async def pause_prefix(self, ctx: commands.Context) -> None:
        await self._handle_pause(ctx)

    # ... (other prefix commands similarly)

    # ==================== IMPLEMENTATION HELPERS ====================

    async def _handle_play(self, ctx_or_inter: Interaction | commands.Context, query: str) -> None:
        """Core play logic."""
        if isinstance(ctx_or_inter, Interaction):
            await ctx_or_inter.response.defer()
            guild = ctx_or_inter.guild
            author = ctx_or_inter.user
        else:
            guild = ctx_or_inter.guild
            author = ctx_or_inter.author

        if not guild:
            return

        # Voice checks
        if not await voice_check(ctx_or_inter):
            return

        # Get or create player
        player: wavelink.Player | None = guild.voice_client  # type: ignore

        if not player:
            vc = author.voice.channel if hasattr(author, "voice") and author.voice else None
            if not vc:
                await self._reply(ctx_or_inter, f"{BRANDING.ERROR} You must be in a voice channel.")
                return
            player = await vc.connect(cls=wavelink.Player)

        # Search tracks
        try:
            tracks: wavelink.Search = await wavelink.Playable.search(query)
        except Exception as exc:
            await self._reply(ctx_or_inter, f"{BRANDING.ERROR} Search failed: {exc}")
            return

        if not tracks:
            await self._reply(ctx_or_inter, f"{BRANDING.ERROR} No results found.")
            return

        if isinstance(tracks, wavelink.Playlist):
            for track in tracks.tracks[:20]:  # Limit
                player.queue.put(track)
            await self._reply(ctx_or_inter, f"{BRANDING.SUCCESS} Added playlist: **{tracks.name}** ({len(tracks.tracks)} tracks)")
        else:
            track = tracks[0]
            player.queue.put(track)
            embed = create_track_embed(track, "Queued")
            await self._reply(ctx_or_inter, embed=embed)

        # Start playing if idle
        if not player.playing:
            await player.play(await player.queue.get(), requester=author)

    async def _handle_pause(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return

        await player.pause(True)
        await self._reply(ctx_or_inter, f"{BRANDING.PAUSE} Paused")

    async def _handle_resume(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return
        await player.pause(False)
        await self._reply(ctx_or_inter, f"{BRANDING.PLAY} Resumed")

    async def _handle_skip(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return
        await player.skip()
        await self._reply(ctx_or_inter, f"{BRANDING.SKIP} Skipped")

    async def _handle_stop(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return
        await player.stop()
        await player.disconnect()
        await self._reply(ctx_or_inter, f"{BRANDING.STOP} Stopped and disconnected")

    async def _handle_queue(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player or player.queue.is_empty:
            await self._reply(ctx_or_inter, f"{BRANDING.INFO} Queue is empty.")
            return

        view = QueueView(player)
        embed = self._build_queue_embed(player)
        await self._reply(ctx_or_inter, embed=embed, view=view)

    async def _handle_np(self, ctx_or_inter: Interaction | commands.Context) -> None:
        player = self._get_player(ctx_or_inter)
        if not player or not player.current:
            await self._reply(ctx_or_inter, "Nothing playing.")
            return

        embed = player._build_now_playing_embed()
        view = PlayerView(player)
        await self._reply(ctx_or_inter, embed=embed, view=view)

    async def _handle_volume(self, ctx_or_inter: Interaction | commands.Context, level: int) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return
        await player.set_volume(level)
        await self._reply(ctx_or_inter, f"{BRANDING.VOLUME} Volume set to {level}%")

    async def _handle_loop(self, ctx_or_inter: Interaction | commands.Context, mode: str) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return

        if mode.lower() not in ("off", "track", "queue"):
            await self._reply(ctx_or_inter, f"{BRANDING.ERROR} Invalid mode. Use off | track | queue")
            return

        player.loop_mode = mode.lower()
        await self._reply(ctx_or_inter, f"{BRANDING.LOOP} Loop set to **{mode}**")

    async def _handle_filter(self, ctx_or_inter: Interaction | commands.Context, name: str) -> None:
        player = self._get_player(ctx_or_inter)
        if not player:
            return

        valid_filters = ["bassboost", "nightcore", "vaporwave", "8d", "karaoke", "reset"]
        if name.lower() not in valid_filters:
            await self._reply(ctx_or_inter, f"{BRANDING.ERROR} Invalid filter.")
            return

        if name.lower() == "reset":
            await player.clear_filters()
        else:
            await player.apply_filter(name.lower())

        await self._reply(ctx_or_inter, f"{BRANDING.FILTER} Filter **{name}** applied")

    # ==================== HELPERS ====================

    def _get_player(self, ctx_or_inter: Interaction | commands.Context) -> wavelink.Player | None:
        guild = ctx_or_inter.guild if hasattr(ctx_or_inter, "guild") else None
        if not guild or not guild.voice_client:
            return None
        return guild.voice_client  # type: ignore

    async def _reply(self, ctx_or_inter: Interaction | commands.Context, content: str | None = None, embed: Embed | None = None, view: Any = None) -> None:
        if isinstance(ctx_or_inter, Interaction):
            if ctx_or_inter.response.is_done():
                await ctx_or_inter.followup.send(content=content, embed=embed, view=view, ephemeral=True)
            else:
                await ctx_or_inter.response.send_message(content=content, embed=embed, view=view, ephemeral=True)
        else:
            await ctx_or_inter.reply(content=content, embed=embed, view=view)

    @commands.Cog.listener()
    async def on_wavelink_node_ready(self, payload: wavelink.NodeReadyEventPayload) -> None:
        logger.info("lavalink_node_ready", node=payload.node.identifier)


async def setup(bot: RaahiBot) -> None:
    await bot.add_cog(Music(bot))
