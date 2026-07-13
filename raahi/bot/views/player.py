"""
Interactive Player Views - Buttons, Selects, and Pagination.
"""

from __future__ import annotations

import asyncio
from typing import Any

import discord
from discord.ui import Button, View, Select

from bot.constants import BRANDING


class PlayerView(View):
    """Interactive now-playing player controls."""

    def __init__(self, player: Any) -> None:
        super().__init__(timeout=300)
        self.player = player

    @discord.ui.button(emoji=BRANDING.PAUSE, style=discord.ButtonStyle.secondary, custom_id="pause")
    async def pause(self, interaction: discord.Interaction, button: Button) -> None:
        await interaction.response.defer()
        if self.player.playing:
            await self.player.pause(True)
            button.emoji = BRANDING.PLAY
        else:
            await self.player.pause(False)
            button.emoji = BRANDING.PAUSE
        await interaction.message.edit(view=self)

    @discord.ui.button(emoji=BRANDING.SKIP, style=discord.ButtonStyle.secondary)
    async def skip(self, interaction: discord.Interaction, button: Button) -> None:
        await interaction.response.defer()
        await self.player.skip()
        self.stop()

    @discord.ui.button(emoji=BRANDING.STOP, style=discord.ButtonStyle.danger)
    async def stop(self, interaction: discord.Interaction, button: Button) -> None:
        await interaction.response.defer()
        await self.player.stop()
        await self.player.disconnect()
        self.stop()

    @discord.ui.button(emoji=BRANDING.LOOP, style=discord.ButtonStyle.secondary)
    async def loop(self, interaction: discord.Interaction, button: Button) -> None:
        await interaction.response.defer()
        modes = ["off", "track", "queue"]
        current = self.player.loop_mode
        idx = (modes.index(current) + 1) % 3
        self.player.loop_mode = modes[idx]
        await interaction.followup.send(f"Loop: {modes[idx]}", ephemeral=True)

    @discord.ui.button(emoji=BRANDING.VOLUME, style=discord.ButtonStyle.secondary)
    async def volume(self, interaction: discord.Interaction, button: Button) -> None:
        # Simple volume modal or select
        await interaction.response.send_message("Use /volume", ephemeral=True)


class QueueView(View):
    """Paginated queue view."""

    def __init__(self, player: Any) -> None:
        super().__init__(timeout=180)
        self.player = player
        self.page = 0

    @discord.ui.button(emoji=BRANDING.LEFT, style=discord.ButtonStyle.secondary)
    async def previous(self, interaction: discord.Interaction, button: Button) -> None:
        self.page = max(0, self.page - 1)
        await self._update(interaction)

    @discord.ui.button(emoji=BRANDING.RIGHT, style=discord.ButtonStyle.secondary)
    async def next(self, interaction: discord.Interaction, button: Button) -> None:
        self.page += 1
        await self._update(interaction)

    async def _update(self, interaction: discord.Interaction) -> None:
        # Rebuild embed
        await interaction.response.defer()
        # In real implementation rebuild embed with page
        await interaction.message.edit(content=f"Page {self.page}", view=self)


# Additional views can be added (lyrics, filters, playlist manager)
