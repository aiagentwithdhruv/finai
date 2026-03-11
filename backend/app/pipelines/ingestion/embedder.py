"""
Embedding pipeline step.

Generates OpenAI text-embedding-3-small vectors for document chunks.
Batches requests to stay within the 2048-input API limit (we use max 100 per call).
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from openai import AsyncOpenAI

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL = "text-embedding-3-small"
_EMBEDDING_DIMS = 1536
_BATCH_SIZE = 100


async def embed_chunks(
    chunks: list[dict[str, Any]],
    api_key: str,
) -> list[dict[str, Any]]:
    """
    Generate embeddings for a list of chunk dicts.

    Each chunk dict must have at minimum a "content" key (str).

    Returns the same list of chunk dicts with an "embedding" key added:
        "embedding": list[float]  — 1536-dimensional vector

    Args:
        chunks:  List of chunk dicts produced by chunker.chunk_document().
        api_key: OpenAI API key.

    Raises:
        openai.OpenAIError: On API errors (rate limit, auth, etc.).
    """
    if not chunks:
        return chunks

    client = AsyncOpenAI(api_key=api_key)

    # Work on a shallow copy to avoid mutating the caller's list
    result = list(chunks)

    # Process in batches of _BATCH_SIZE
    for batch_start in range(0, len(result), _BATCH_SIZE):
        batch = result[batch_start : batch_start + _BATCH_SIZE]
        texts = [chunk["content"] for chunk in batch]

        logger.debug(
            "Embedding batch",
            extra={
                "batch_start": batch_start,
                "batch_size": len(batch),
                "model": _EMBEDDING_MODEL,
            },
        )

        response = await client.embeddings.create(
            model=_EMBEDDING_MODEL,
            input=texts,
            encoding_format="float",
        )

        # The API returns embeddings in the same order as input
        for i, embedding_obj in enumerate(response.data):
            result[batch_start + i] = dict(result[batch_start + i])  # shallow copy the dict
            result[batch_start + i]["embedding"] = embedding_obj.embedding

    logger.info(
        "Embedding complete",
        extra={"total_chunks": len(result), "model": _EMBEDDING_MODEL, "dims": _EMBEDDING_DIMS},
    )

    return result


async def embed_single(text: str, api_key: str) -> list[float]:
    """
    Embed a single text string. Useful for query-time embedding in RAG retrieval.

    Returns:
        list[float] — 1536-dimensional vector
    """
    client = AsyncOpenAI(api_key=api_key)
    response = await client.embeddings.create(
        model=_EMBEDDING_MODEL,
        input=[text],
        encoding_format="float",
    )
    return response.data[0].embedding
