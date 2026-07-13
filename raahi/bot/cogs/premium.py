"""
Premium Cog - Owner commands for premium management.
"""

from __future__ import annotations

from typing import Optional

import discord
from discord import app_commands
from discord.ext import commands

from bot.constants import BRANDING
from bot.core.bot import RaahiBot


class Premium(commands.Cog):
    """Premium management commands."""

    def __init__(self, bot: RaahiBot) -> None:
        self.bot = bot

    @commands.is_owner()
    @app_commands.command(name="grantpremium", description="[Owner] Grant premium")
    async def grant_premium(
        self,
        interaction: discord.Interaction,
        user: Optional[discord.User] = None,
        guild_id: Optional[str] = None,
        tier: str = "premium",
        days: int = 30,
    ) -> None:
        await interaction.response.defer(ephemeral=True)

        target_user = user.id if user else None
        target_guild = int(guild_id) if guild_id else None

        entitlement = await self.bot.premium_service.grant_premium(
            user_id=target_user,
            guild_id=target_guild,
            tier=tier,
            duration_days=days,
            created_by=interaction.user.id,
        )

        await interaction.followup.send(
            f"{BRANDING.SUCCESS} Granted **{tier}** to {user or guild_id} for {days} days."
        )

    @commands.is_owner()
    @app_commands.command(name="revokepremium", description="[Owner] Revoke premium")
    async def revoke_premium(self, interaction: discord.Interaction, entitlement_id: int, reason: str) -> None:
        await interaction.response.defer(ephemeral=True)
        await self.bot.premium_service.revoke_premium(entitlement_id, reason, interaction.user.id)
        await interaction.followup.send(f"{BRANDING.SUCCESS} Revoked entitlement #{entitlement_id}")


async def setup(bot: RaahiBot) -> None:
    await bot.add_cog(Premium(bot))
