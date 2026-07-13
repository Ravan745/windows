"""
Raahi Constants - Single source of truth for branding, emojis, and config.
All emojis and UI elements managed here for easy rebranding.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Final


@dataclass(frozen=True)
class Branding:
    """Cute premium brand configuration. Change these to rebrand."""
    name: str = "Raahi"
    description: str = "Your cozy music companion"
    color: int = 0xA78BFA  # Soft pastel purple
    footer: str = "✨ Raahi • Cozy Vibes Only"
    support_invite: str = "https://discord.gg/raahi"
    website: str = "https://raahi.bot"
    github: str = "https://github.com/raahi-bot/raahi"

    # Emojis - Single place for all emojis (cute, consistent theme)
    # Music
    PLAY: str = "▶️"
    PAUSE: str = "⏸️"
    STOP: str = "⏹️"
    SKIP: str = "⏭️"
    PREV: str = "⏮️"
    VOLUME: str = "🔊"
    LOOP: str = "🔁"
    SHUFFLE: str = "🔀"
    QUEUE: str = "📜"
    NOW_PLAYING: str = "🎵"
    HEART: str = "💖"
    STAR: str = "⭐"
    RADIO: str = "📻"
    LYRICS: str = "📝"
    FILTER: str = "🎛️"

    # Status & Feedback
    SUCCESS: str = "✅"
    ERROR: str = "❌"
    WARNING: str = "⚠️"
    INFO: str = "ℹ️"
    LOADING: str = "⏳"
    CLOCK: str = "🕒"
    MUSIC_NOTE: str = "🎶"

    # Premium
    PREMIUM: str = "👑"
    CROWN: str = "👑"
    GIFT: str = "🎁"
    KEY: str = "🔑"

    # Navigation
    LEFT: str = "◀️"
    RIGHT: str = "▶️"
    FIRST: str = "⏪"
    LAST: str = "⏩"
    CLOSE: str = "✖️"

    # Cute extras
    SPARKLES: str = "✨"
    HEART_PINK: str = "💗"
    BUTTERFLY: str = "🦋"
    COZY: str = "🧸"
    MOON: str = "🌙"

    # Source icons
    YOUTUBE: str = "📺"
    SPOTIFY: str = "🎧"
    SOUNDCLOUD: str = "☁️"
    APPLE: str = "🍎"
    TWITCH: str = "📺"

    # UI
    DJ: str = "🎧"
    REQUEST: str = "📍"
    HISTORY: str = "📜"
    FAVORITE: str = "❤️"


# Export as singleton-like constant
BRANDING: Final[Branding] = Branding()


# Common colors (pastel cozy palette)
class Colors:
    SUCCESS = 0x86EFAC  # Soft green
    ERROR = 0xFCA5A5    # Soft red
    WARNING = 0xFDE047  # Soft yellow
    INFO = 0xA5B4FC     # Soft blue
    PREMIUM = 0xC084FC  # Soft purple
    PRIMARY = BRANDING.color


# Default Lavalink plugins required
REQUIRED_LAVALINK_PLUGINS = [
    "youtube",
    "spotify",
    "soundcloud",
    "applemusic",
    "deezer",
    "bandcamp",
    "twitch",
]

# Premium tiers (configurable)
PREMIUM_TIERS = {
    "free": {
        "name": "Free",
        "max_queue": 50,
        "max_playlist": 10,
        "autoplay": False,
        "24_7": False,
        "no_prefix": False,
        "filters": ["bassboost", "nightcore"],
    },
    "premium": {
        "name": "Premium",
        "max_queue": 200,
        "max_playlist": 50,
        "autoplay": True,
        "24_7": True,
        "no_prefix": True,
        "filters": "all",
    },
    "lifetime": {
        "name": "Lifetime",
        "max_queue": 500,
        "max_playlist": 100,
        "autoplay": True,
        "24_7": True,
        "no_prefix": True,
        "filters": "all",
    },
}
