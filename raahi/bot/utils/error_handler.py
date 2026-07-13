"""
Global error handlers for commands and interactions.
"""

from __future__ import annotations

import structlog
from discord import Embed, Interaction
from discord.ext import commands

from bot.constants import BRANDING, Colors

logger = structlog.get_logger(__name__)


async def handle_command_error(ctx: commands.Context, error: Exception) -> None:
    """Handle prefix command errors."""
    if isinstance(error, commands.CommandNotFound):
        return

    if isinstance(error, commands.MissingPermissions):
        embed = Embed(title=f"{BRANDING.ERROR} Missing Permissions", color=Colors.ERROR)
        embed.description = "You don't have permission to use this command."
        await ctx.reply(embed=embed, ephemeral=True)
        return

    if isinstance(error, commands.CheckFailure):
        embed = Embed(title=f"{BRANDING.WARNING} Check Failed", color=Colors.WARNING)
        embed.description = str(error) or "You cannot use this command here."
        await ctx.reply(embed=embed)
        return

    logger.exception("command_error", command=ctx.command, error=str(error))
    embed = Embed(title=f"{BRANDING.ERROR} Error", color=Colors.ERROR, description="Something went wrong. Please try again.")
    await ctx.reply(embed=embed)


async def handle_app_command_error(interaction: Interaction, error: Exception) -> None:
    """Handle slash command errors."""
    if isinstance(error, commands.CheckFailure):
        if not interaction.response.is_done():
            await interaction.response.send_message(f"{BRANDING.ERROR} {str(error)}", ephemeral=True)
        return

    logger.exception("app_command_error", error=str(error))

    msg = f"{BRANDING.ERROR} An unexpected error occurred."
    if interaction.response.is_done():
        await interaction.followup.send(msg, ephemeral=True)
    else:
        await interaction.response.send_message(msg, ephemeral=True)
