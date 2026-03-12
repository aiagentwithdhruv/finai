"""
Async SQLAlchemy 2.0 database engine, session factory, and dependency injection.
pgvector extension is enabled during init_db().
"""

from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Engine — created lazily so tests can override DATABASE_URL before import
# ---------------------------------------------------------------------------

_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


def _build_engine() -> AsyncEngine:
    settings = get_settings()

    connect_args: dict = {
        # asyncpg-specific options
        "server_settings": {"application_name": "finai-backend"},
        # Disable prepared statements — required for Supabase/pgbouncer transaction mode
        "statement_cache_size": 0,
    }

    # Use NullPool in test/serverless environments to avoid connection leaks.
    # Default pool is fine for long-running servers.
    pool_class = NullPool if settings.environment == "testing" else None  # type: ignore[assignment]

    kwargs: dict = dict(
        url=settings.database_url,
        echo=settings.is_development,       # SQL debug logging in dev only
        connect_args=connect_args,
        pool_pre_ping=True,                 # detect stale connections
        pool_size=10,
        max_overflow=20,
        pool_recycle=1800,                  # recycle connections every 30 min
    )

    if pool_class is not None:
        # NullPool has no pool_size/max_overflow
        for key in ("pool_size", "max_overflow", "pool_recycle", "pool_pre_ping"):
            kwargs.pop(key, None)
        kwargs["poolclass"] = pool_class

    return create_async_engine(**kwargs)


def get_engine() -> AsyncEngine:
    """Return (and lazily create) the shared async engine."""
    global _engine
    if _engine is None:
        _engine = _build_engine()
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """Return (and lazily create) the shared session factory."""
    global _session_factory
    if _session_factory is None:
        _session_factory = async_sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,     # avoid lazy-load issues after commit
            autoflush=False,
            autocommit=False,
        )
    return _session_factory


# ---------------------------------------------------------------------------
# Dependency injection helper — used in FastAPI route signatures
# ---------------------------------------------------------------------------

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that yields a database session per request.

    Usage::

        @router.get("/items/{item_id}")
        async def read_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
            ...
    """
    factory = get_session_factory()
    async with factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# ---------------------------------------------------------------------------
# Database initialisation — called once at application startup
# ---------------------------------------------------------------------------

async def init_db() -> None:
    """
    Create all tables (if they don't exist) and enable required extensions.

    This is NOT a replacement for Alembic migrations — it is a safety net
    for local development and test environments.  Production should use
    `alembic upgrade head` in the CI/CD pipeline.
    """
    from app.models import Base  # deferred import to avoid circular deps

    engine = get_engine()

    async with engine.begin() as conn:
        # Enable pgvector — must run before CREATE TABLE for vector columns
        await _enable_extensions(conn)

        # Reflect-and-create tables that don't exist yet
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created / verified.")


async def _enable_extensions(conn: AsyncConnection) -> None:
    """Enable PostgreSQL extensions required by the application."""
    extensions = [
        "vector",      # pgvector — 1536-dim embeddings
        "uuid-ossp",   # gen_random_uuid() fallback
        "pg_trgm",     # trigram full-text search support
    ]
    for ext in extensions:
        await conn.execute(text(f'CREATE EXTENSION IF NOT EXISTS "{ext}"'))
    logger.debug("PostgreSQL extensions enabled: %s", extensions)


# ---------------------------------------------------------------------------
# Teardown — called at application shutdown
# ---------------------------------------------------------------------------

async def close_db() -> None:
    """Dispose the engine connection pool gracefully."""
    global _engine, _session_factory
    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database connection pool disposed.")
