"""
FinAI FastAPI application entry point.

Startup sequence:
  1. Validate all required environment variables (fail fast on missing config)
  2. Configure structured JSON logging
  3. Initialise database (enable pgvector, create tables if missing)
  4. Mount all routers under /api/v1

Architecture: routes (thin) → services (business logic) → repositories (DB access)
Every financial figure in AI output traces to a source document.
"""

from __future__ import annotations

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import (
    audit,
    comparables,
    companies,
    deals,
    documents,
    generation,
    health,
    rag,
)
from app.core.config import get_settings
from app.core.database import close_db, init_db
from app.core.logging import configure_logging, generate_request_id, set_request_id

logger = structlog.get_logger(__name__)

API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"


# ---------------------------------------------------------------------------
# Lifespan — startup and shutdown hooks
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan context manager.

    Startup:
      - Validate environment config (raises on missing critical vars)
      - Configure logging
      - Initialise database and pgvector extension

    Shutdown:
      - Dispose database connection pool
    """
    # ------------------------------------------------------------------
    # Startup
    # ------------------------------------------------------------------
    settings = get_settings()  # raises pydantic.ValidationError if env vars missing

    configure_logging(
        log_level=settings.log_level,
        json_logs=settings.is_production,
    )

    logger.info(
        "finai.startup",
        environment=settings.environment,
        log_level=settings.log_level,
        api_version=API_VERSION,
    )

    await init_db()
    logger.info("finai.database_ready")

    yield

    # ------------------------------------------------------------------
    # Shutdown
    # ------------------------------------------------------------------
    logger.info("finai.shutdown")
    await close_db()


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------

def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="FinAI — Financial Document Intelligence",
        description=(
            "AI-powered internal operating system for financial advisory firms. "
            "Ingest documents, extract intelligence, generate materials, automate workflows."
        ),
        version="1.0.0",
        docs_url=f"{API_PREFIX}/docs" if not settings.is_production else None,
        redoc_url=f"{API_PREFIX}/redoc" if not settings.is_production else None,
        openapi_url=f"{API_PREFIX}/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ------------------------------------------------------------------
    # CORS
    # ------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-API-Version"],
    )

    # ------------------------------------------------------------------
    # Request tracing middleware — injects request_id into every log record
    # ------------------------------------------------------------------
    @app.middleware("http")
    async def request_tracing_middleware(request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        request_id = request.headers.get("X-Request-ID") or generate_request_id()
        set_request_id(request_id)

        start_time = time.monotonic()
        response: Response = await call_next(request)
        duration_ms = round((time.monotonic() - start_time) * 1000, 2)

        response.headers["X-Request-ID"] = request_id
        response.headers["X-API-Version"] = API_VERSION

        logger.info(
            "http.request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=duration_ms,
            request_id=request_id,
        )

        return response

    # ------------------------------------------------------------------
    # Global exception handler — structured error responses
    # ------------------------------------------------------------------
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.error(
            "http.unhandled_exception",
            path=request.url.path,
            method=request.method,
            error=str(exc),
            exc_info=True,
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred. Please try again.",
                }
            },
        )

    # ------------------------------------------------------------------
    # Routers
    # ------------------------------------------------------------------
    app.include_router(health.router, prefix=API_PREFIX)
    app.include_router(companies.router, prefix=API_PREFIX)
    app.include_router(documents.router, prefix=API_PREFIX)
    app.include_router(deals.router, prefix=API_PREFIX)
    app.include_router(rag.router, prefix=API_PREFIX)
    app.include_router(generation.router, prefix=API_PREFIX)
    app.include_router(comparables.router, prefix=API_PREFIX)
    app.include_router(audit.router, prefix=API_PREFIX)

    return app


# ---------------------------------------------------------------------------
# Application instance (imported by uvicorn)
# ---------------------------------------------------------------------------

app = create_app()
