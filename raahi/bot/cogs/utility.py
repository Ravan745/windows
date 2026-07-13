"""
Utility Cog - Stats, ping, feedback, privacy.
"""

from __future__ import annotations

import discord
from discord import app_commands
from discord.ext import commands

from bot.constants import BRANDING
from bot.core.bot import RaahiBot


class Utility(commands.Cog):
    """Utility commands."""

    def __init__(self, bot: RaahiBot) -> None:
        self.bot = bot

    @app_commands.command(name="ping", description="Check bot latency")
    async def ping(self, interaction: discord.Interaction) -> None:
        await interaction.response.send_message(f"{BRANDING.SUCCESS} Pong! `{round(self.bot.latency * 1000)}ms`")

    @app_commands.command(name="stats", description="Bot statistics")
    async def stats(self, interaction: discord.Interaction) -> None:
        embed = discord.Embed(title=f"{BRANDING.name} Stats", color=BRANDING.color)
        embed.add_field(name="Servers", value=len(self.bot.guilds), inline=True)
        embed.add_field(name="Shards", value=self.bot.shard_count or 1, inline=True)
        await interaction.response.send_message(embed=embed)


async def setup(bot: RaahiBot) -> None:
    await bot.add_cog(Utility(bot))
