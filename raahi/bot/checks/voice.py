"""
Voice and permission checks for music commands.
"""

from __future__ import annotations

from typing import Any

import discord
from discord.ext import commands

from bot.core.bot import RaahiBot


async def voice_check(ctx_or_inter: Any) -> bool:
    """Ensure user is in voice channel."""
    if isinstance(ctx_or_inter, discord.Interaction):
        user = ctx_or_inter.user
        guild = ctx_or_inter.guild
    else:
        user = ctx_or_inter.author
        guild = ctx_or_inter.guild

    if not guild or not user.voice or not user.voice.channel:
        if isinstance(ctx_or_inter, discord.Interaction):
            await ctx_or_inter.response.send_message("You must be in a voice channel.", ephemeral=True)
        else:
            await ctx_or_inter.reply("You must be in a voice channel.")
        return False
    return True


async def same_voice_check(ctx_or_inter: Any) -> bool:
    """Ensure bot and user in same voice channel."""
    player = ctx_or_inter.guild.voice_client if ctx_or_inter.guild else None
    if not player:
        return True

    user_vc = ctx_or_inter.author.voice.channel if hasattr(ctx_or_inter.author, "voice") and ctx_or_inter.author.voice else None
    if user_vc and player.channel and user_vc.id != player.channel.id:
        msg = "You must be in the same voice channel as the bot."
        if isinstance(ctx_or_inter, discord.Interaction):
            await ctx_or_inter.response.send_message(msg, ephemeral=True)
        else:
            await ctx_or_inter.reply(msg)
        return False
    return True


async def dj_check(ctx_or_inter: Any) -> bool:
    """Check for DJ role or permissions."""
    # Simple implementation: allow everyone or check role
    # Extend with guild settings
    return True
