"""
Structured JSON logging via structlog.

Every log record contains:
  - timestamp (ISO 8601)
  - level
  - logger  (module name)
  - request_id  (injected per-request via contextvars)
  - event  (the message)
  - any extra key=value pairs passed to the log call

Usage::

    import structlog
    logger = structlog.get_logger(__name__)

    logger.info("document.ingested", doc_id=str(doc.id), pages=42)
    logger.error("rag.query_failed", error=str(exc), query=query[:200])
"""

from __future__ import annotations

import logging
import sys
from contextvars import ContextVar
from typing import Any
from uuid import uuid4

import structlog

# ---------------------------------------------------------------------------
# Request-scoped context — injected by middleware, readable in any service
# ---------------------------------------------------------------------------

_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")
_user_id_ctx: ContextVar[str] = ContextVar("user_id", default="")


def get_request_id() -> str:
    return _request_id_ctx.get()


def set_request_id(request_id: str) -> None:
    _request_id_ctx.set(request_id)


def get_user_id() -> str:
    return _user_id_ctx.get()


def set_user_id(user_id: str) -> None:
    _user_id_ctx.set(user_id)


def generate_request_id() -> str:
    return uuid4().hex


# ---------------------------------------------------------------------------
# Processors
# ---------------------------------------------------------------------------

def _add_request_context(
    logger: Any,  # noqa: ANN401
    method: str,
    event_dict: dict[str, Any],
) -> dict[str, Any]:
    """Inject request_id and user_id from contextvars into every log record."""
    request_id = get_request_id()
    if request_id:
        event_dict["request_id"] = request_id
    user_id = get_user_id()
    if user_id:
        event_dict["user_id"] = user_id
    return event_dict


# ---------------------------------------------------------------------------
# Configuration entry point
# ---------------------------------------------------------------------------

def configure_logging(log_level: str = "INFO", json_logs: bool = True) -> None:
    """
    Configure structlog + standard library logging.
    Call this exactly once — at application startup in lifespan().

    Args:
        log_level: One of DEBUG / INFO / WARNING / ERROR / CRITICAL.
        json_logs: True for production (machine-readable JSON),
                   False for development (colourised console output).
    """
    shared_processors: list[Any] = [
        structlog.contextvars.merge_contextvars,
        _add_request_context,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if json_logs:
        # Production: single-line JSON output (compatible with Datadog / CloudWatch)
        renderer = structlog.processors.JSONRenderer()
    else:
        # Development: colourised, human-readable output
        shared_processors.append(structlog.dev.set_exc_info)
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=shared_processors
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.getLevelName(log_level)
        ),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    # Wire structlog into the standard library so that SQLAlchemy,
    # uvicorn, and third-party libraries are formatted the same way.
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.addHandler(handler)
    root_logger.setLevel(log_level)

    # Silence noisy third-party loggers in production
    for noisy in ("httpx", "httpcore", "hpack", "asyncio"):
        logging.getLogger(noisy).setLevel(logging.WARNING)
