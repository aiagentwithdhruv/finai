"""
Health check endpoint — returns application readiness and database connectivity.
"""

from __future__ import annotations

from datetime import datetime, timezone

import structlog
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

logger = structlog.get_logger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)) -> dict:
    """
    Application health check.

    Returns:
        - status: "healthy" | "degraded" | "unhealthy"
        - database: connectivity status
        - timestamp: current UTC time
    """
    db_status = "healthy"
    db_error: str | None = None

    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_status = "unhealthy"
        db_error = str(exc)
        logger.error("health.db_check_failed", error=str(exc))

    overall = "healthy" if db_status == "healthy" else "degraded"

    return {
        "status": overall,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "1.0.0",
        "components": {
            "database": {
                "status": db_status,
                "error": db_error,
            },
        },
    }
