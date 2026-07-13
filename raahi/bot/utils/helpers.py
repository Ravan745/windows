"""
Utility helpers for Raahi.
"""

from __future__ import annotations

import re
from typing import Any

import discord
import wavelink

from bot.constants import BRANDING, Colors


def format_duration(ms: int) -> str:
    """Format milliseconds to readable duration."""
    seconds = ms // 1000
    minutes, seconds = divmod(seconds, 60)
    hours, minutes = divmod(minutes, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    return f"{minutes}:{seconds:02d}"


def create_track_embed(track: wavelink.Playable, action: str = "Queued") -> discord.Embed:
    """Create a cute track embed."""
    embed = discord.Embed(
        title=f"{BRANDING.MUSIC_NOTE} {action}",
        description=f"**[{track.title}]({track.uri})**",
        color=Colors.SUCCESS,
    )
    embed.add_field(name="Artist", value=track.author or "Unknown", inline=True)
    embed.add_field(name="Duration", value=format_duration(track.length) if track.length else "Live", inline=True)

    if track.artwork:
        embed.set_thumbnail(url=track.artwork)

    embed.set_footer(text=BRANDING.footer)
    return embed


async def get_prefix(bot: Any, message: discord.Message) -> list[str]:
    """Dynamic prefix resolver."""
    from bot.core.config import settings

    prefixes = [settings.default_prefix]

    if settings.mention_prefix:
        prefixes.append(f"<@{bot.user.id}> ")
        prefixes.append(f"<@!{bot.user.id}> ")

    # Guild custom prefix from DB (simplified)
    if message.guild:
        # Fetch from repo if needed
        pass

    return prefixes


def sanitize_url(url: str) -> str:
    """Basic URL validation (extend with SSRF protection)."""
    if not re.match(r"^https?://", url):
        return ""
    # Add more SSRF checks in production
    return url
