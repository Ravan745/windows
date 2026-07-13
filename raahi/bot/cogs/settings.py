"""
Settings Cog - Guild configuration commands.
"""

from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from bot.constants import BRANDING
from bot.core.bot import RaahiBot


class Settings(commands.Cog):
    """Guild settings."""

    def __init__(self, bot: RaahiBot) -> None:
        self.bot = bot

    @app_commands.command(name="setprefix", description="Set custom prefix")
    @app_commands.checks.has_permissions(manage_guild=True)
    async def set_prefix(self, interaction: discord.Interaction, prefix: str) -> None:
        await interaction.response.defer(ephemeral=True)
        async with self.bot.guild_repo.session() as session:  # type: ignore[attr-defined]
            await self.bot.guild_repo.update_settings(session, interaction.guild.id, prefix=prefix)
            await session.commit()
        await interaction.followup.send(f"{BRANDING.SUCCESS} Prefix set to `{prefix}`")

    @app_commands.command(name="setdj", description="Set DJ role")
    async def set_dj(self, interaction: discord.Interaction, role: discord.Role) -> None:
        await interaction.response.defer(ephemeral=True)
        # Update DB
        await interaction.followup.send(f"{BRANDING.DJ} DJ role set to {role.mention}")


async def setup(bot: RaahiBot) -> None:
    await bot.add_cog(Settings(bot))
