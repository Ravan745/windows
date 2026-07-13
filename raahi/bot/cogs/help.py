"""
Help Cog - Beautiful help command with categories.
"""

from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from bot.constants import BRANDING
from bot.core.bot import RaahiBot


class Help(commands.Cog):
    """Premium help system."""

    def __init__(self, bot: RaahiBot) -> None:
        self.bot = bot

    @app_commands.command(name="help", description="Show all commands")
    async def help_slash(self, interaction: discord.Interaction) -> None:
        embed = discord.Embed(
            title=f"{BRANDING.SPARKLES} {BRANDING.name} Help",
            description=BRANDING.description,
            color=BRANDING.color,
        )
        embed.add_field(name="Music", value="/play, /pause, /skip, /queue, /filter...", inline=False)
        embed.add_field(name="Premium", value="/grantpremium (owner)", inline=False)
        embed.add_field(name="Settings", value="/setprefix, /setdj", inline=False)
        embed.set_footer(text=BRANDING.footer)
        await interaction.response.send_message(embed=embed, ephemeral=True)


async def setup(bot: RaahiBot) -> None:
    await bot.add_cog(Help(bot))
