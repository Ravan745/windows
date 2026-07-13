"""
Database package initialization.
"""

from bot.database.session import init_db, db, get_session
from bot.database.models import Base
from bot.database.repositories import (
    guild_repo, user_repo, premium_repo,
    playlist_repo, player_state_repo, no_prefix_repo
)

__all__ = [
    "init_db", "db", "get_session",
    "Base",
    "guild_repo", "user_repo", "premium_repo",
    "playlist_repo", "player_state_repo", "no_prefix_repo",
]


async def create_tables() -> None:
    """Create all tables (for initial setup, use Alembic in production)."""
    from sqlalchemy.ext.asyncio import create_async_engine
    from bot.core.config import settings

    engine = create_async_engine(settings.database_url)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await engine.dispose()
