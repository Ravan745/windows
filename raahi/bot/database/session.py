"""
Database session management - Async SQLAlchemy with SQLite optimizations.
"""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from bot.core.config import settings

logger = structlog.get_logger(__name__)


class Database:
    """Database manager with connection pooling and WAL mode."""

    def __init__(self) -> None:
        self.engine: AsyncEngine | None = None
        self.session_factory: async_sessionmaker[AsyncSession] | None = None

    async def init(self) -> None:
        """Initialize engine and session factory."""
        connect_args = {
            "check_same_thread": False,
        }

        # SQLite specific optimizations
        if "sqlite" in settings.database_url:
            connect_args.update({
                "timeout": 30,
            })

        self.engine = create_async_engine(
            settings.database_url,
            echo=False,
            poolclass=StaticPool if "sqlite" in settings.database_url else None,
            connect_args=connect_args,
            pool_pre_ping=True,
        )

        self.session_factory = async_sessionmaker(
            bind=self.engine,
            expire_on_commit=False,
        )

        logger.info("database_initialized", url=settings.database_url.split("://")[0])

    async def close(self) -> None:
        """Close connections."""
        if self.engine:
            await self.engine.dispose()
            logger.info("database_closed")

    @asynccontextmanager
    async def session(self) -> AsyncGenerator[AsyncSession, None]:
        """Get async session context manager."""
        if not self.session_factory:
            await self.init()

        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise


# Global database instance
db = Database()


async def init_db() -> None:
    """Initialize database (called from main)."""
    await db.init()


async def get_session() -> AsyncSession:
    """Get a new session (for dependency injection)."""
    if not db.session_factory:
        await db.init()
    return db.session_factory()  # type: ignore[return-value]
