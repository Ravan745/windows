"""
RaahiPlayer - Custom Wavelink Player with premium features, state persistence, and interactive controls.
"""

from __future__ import annotations

import asyncio
import contextlib
from datetime import datetime, timezone
from typing import Any

import structlog
import wavelink
from discord import Embed, Message

from bot.constants import BRANDING, Colors
from bot.core.config import settings
from bot.database.repositories import player_state_repo
from bot.database.session import db

logger = structlog.get_logger(__name__)


class RaahiPlayer(wavelink.Player):
    """Enhanced player with Raahi features."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)

        # Raahi extensions
        self.loop_mode: str = "off"  # off, track, queue
        self.autoplay: bool = settings.enable_auto_play
        self.is_24_7: bool = False
        self.filters_state: dict[str, Any] = {}
        self.requester: Any | None = None
        self.current_message: Message | None = None  # For interactive player message
        self.vote_skip: set[int] = set()

        # Fair queue tracking
        self.user_queue_count: dict[int, int] = {}

    async def play(
        self,
        track: wavelink.Playable | wavelink.Playlist,
        *,
        replace: bool = False,
        start: int = 0,
        end: int | None = None,
        volume: int | None = None,
        **kwargs: Any,
    ) -> wavelink.Playable:
        """Override play to apply volume and update state."""
        if isinstance(track, wavelink.Playlist):
            # Handle playlist
            for t in track.tracks:
                self.queue.put(t)
            track = track.tracks[0] if track.tracks else None

        if track:
            result = await super().play(track, replace=replace, start=start, end=end, volume=volume, **kwargs)
            self.requester = kwargs.get("requester")
            await self._save_state()
            return result  # type: ignore[return-value]
        return None  # type: ignore[return-value]

    async def _save_state(self) -> None:
        """Persist player state for 24/7 and restart recovery."""
        if not self.guild:
            return

        async with db.session() as session:
            await player_state_repo.save_state(
                session,
                guild_id=self.guild.id,
                channel_id=self.channel.id if self.channel else 0,
                current_track=self.current.raw_data if self.current else None,
                queue=[t.raw_data for t in self.queue] if self.queue else [],
                volume=self.volume,
                loop_mode=self.loop_mode,
                is_24_7=self.is_24_7,
                filters=self.filters_state,
            )

    async def on_track_start(self, payload: wavelink.TrackStartEventPayload) -> None:
        """Track start handler."""
        logger.info(
            "track_started",
            guild=self.guild.id if self.guild else 0,
            track=payload.track.title,
        )

        # Send now playing message
        await self._send_now_playing()

    async def on_track_end(self, payload: wavelink.TrackEndEventPayload) -> None:
        """Track end - handle loops, autoplay, state."""
        logger.info("track_ended", guild=self.guild.id if self.guild else 0)

        if self.loop_mode == "track" and payload.track:
            await self.play(payload.track)
        elif self.loop_mode == "queue" and payload.track:
            self.queue.put(payload.track)
            if not self.playing:
                await self.play(await self.queue.get())
        elif self.autoplay and not self.queue.is_empty:
            # Autoplay logic handled in cog or service
            pass

        await self._save_state()

    async def on_player_update(self, payload: wavelink.PlayerUpdateEventPayload) -> None:
        """Handle player updates."""
        pass

    async def _send_now_playing(self) -> None:
        """Send beautiful now playing embed with controls."""
        if not self.guild or not self.current:
            return

        from bot.views.player import PlayerView

        embed = self._build_now_playing_embed()

        # Delete previous message if exists
        if self.current_message:
            with contextlib.suppress(Exception):
                await self.current_message.delete()

        view = PlayerView(self)
        channel = self.channel or self.guild.system_channel

        if channel:
            self.current_message = await channel.send(embed=embed, view=view)

    def _build_now_playing_embed(self) -> Embed:
        """Create premium looking now playing embed."""
        track = self.current
        if not track:
            return Embed(title="Nothing playing", color=Colors.INFO)

        embed = Embed(
            title=f"{BRANDING.NOW_PLAYING} Now Playing",
            description=f"**[{track.title}]({track.uri})**",
            color=BRANDING.color,
        )

        embed.add_field(name="Artist", value=track.author or "Unknown", inline=True)
        embed.add_field(name="Duration", value=str(track.length) if track.length else "Live", inline=True)
        embed.add_field(name="Volume", value=f"{self.volume}%", inline=True)

        embed.add_field(name="Loop", value=self.loop_mode.title(), inline=True)
        embed.add_field(name="Filters", value=len(self.filters_state) or "None", inline=True)
        embed.add_field(name="Requester", value=f"<@{self.requester.id}>" if self.requester else "Unknown", inline=True)

        if track.artwork:
            embed.set_thumbnail(url=track.artwork)

        embed.set_footer(text=BRANDING.footer)
        return embed

    async def apply_filter(self, filter_name: str, value: Any = None) -> None:
        """Apply audio filter."""
        # Implementation uses wavelink filters
        filters = wavelink.Filters()

        if filter_name == "bassboost":
            filters.equalizer.set(bands=[(0, 0.2), (1, 0.15), (2, 0.1)])
        elif filter_name == "nightcore":
            filters.timescale.set(speed=1.3, pitch=1.2)
        elif filter_name == "vaporwave":
            filters.timescale.set(speed=0.9, pitch=0.85)
        elif filter_name == "8d":
            filters.rotation.set(rotation_hz=0.2)
        elif filter_name == "karaoke":
            filters.karaoke.set(level=1.0, mono_level=1.0)
        # Add more filters...

        await self.set_filters(filters)
        self.filters_state[filter_name] = value or True

        await self._save_state()

    async def clear_filters(self) -> None:
        """Reset all filters."""
        await self.set_filters(wavelink.Filters())
        self.filters_state.clear()
        await self._save_state()

    async def vote_skip(self, user_id: int) -> bool:
        """Handle vote skip."""
        self.vote_skip.add(user_id)
        # Threshold logic can be configured
        if len(self.vote_skip) >= 3:  # Example
            await self.skip()
            self.vote_skip.clear()
            return True
        return False

    async def disconnect(self, *, force: bool = False) -> None:
        """Enhanced disconnect with state cleanup."""
        if self.guild:
            async with db.session() as session:
                # Optional: clear player state
                pass

        await super().disconnect(force=force)
