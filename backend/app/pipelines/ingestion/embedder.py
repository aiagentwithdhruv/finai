"""
Embedding pipeline step.

Generates embeddings for document chunks via OpenRouter.
Batches requests to stay within API limits (max 100 per call).
"""

from __future__ import annotations

import logging
from typing import Any

from openai import AsyncOpenAI

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_EMBEDDING_DIMS = 1536
_BATCH_SIZE = 100
_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _get_client() -> tuple[AsyncOpenAI, str]:
    """Return an OpenAI-compatible client and the embedding model name."""
    settings = get_settings()
    client = AsyncOpenAI(
        api_key=settings.openrouter_api_key,
        base_url=_OPENROUTER_BASE_URL,
    )
    return client, settings.embedding_model


async def embed_chunks(
    chunks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Generate embeddings for a list of chunk dicts.

    Each chunk dict must have a "content" key (str).
    Returns the same list with an "embedding" key added (1536-dim vector).
    """
    if not chunks:
        return chunks

    client, model = _get_client()
    result = list(chunks)

    for batch_start in range(0, len(result), _BATCH_SIZE):
        batch = result[batch_start : batch_start + _BATCH_SIZE]
        texts = [chunk["content"] for chunk in batch]

        logger.debug(
            "Embedding batch",
            extra={"batch_start": batch_start, "batch_size": len(batch), "model": model},
        )

        response = await client.embeddings.create(
            model=model,
            input=texts,
            encoding_format="float",
        )

        for i, embedding_obj in enumerate(response.data):
            result[batch_start + i] = dict(result[batch_start + i])
            result[batch_start + i]["embedding"] = embedding_obj.embedding

    logger.info(
        "Embedding complete",
        extra={"total_chunks": len(result), "model": model, "dims": _EMBEDDING_DIMS},
    )

    return result


async def embed_single(text: str) -> list[float]:
    """
    Embed a single text string. Used for query-time embedding in RAG retrieval.
    """
    client, model = _get_client()
    response = await client.embeddings.create(
        model=model,
        input=[text],
        encoding_format="float",
    )
    return response.data[0].embedding
