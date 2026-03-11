"""
RAGChat — generates answers grounded in retrieved document chunks.

Design principles (enforced by CLAUDE.md):
  - LLM handles narrative synthesis ONLY
  - Every claim must trace to a source chunk
  - Temperature 0.2 for factual consistency
  - Explicit "I don't know" instruction prevents hallucination
  - Source attribution is mandatory in the prompt
"""

from __future__ import annotations

import logging
from typing import Any

from app.core.config import get_settings
from app.core.llm_client import llm_complete

logger = logging.getLogger(__name__)

_MAX_TOKENS = 2048

_SYSTEM_PROMPT = """You are a senior financial analyst assistant at a UK advisory firm.

CRITICAL RULES:
1. Answer ONLY based on the context documents provided below. Do NOT use external knowledge.
2. Every factual claim must be supported by a specific source (document name + page number).
3. If the answer cannot be found in the provided context, say: "I cannot find this information in the provided documents."
4. NEVER invent, estimate, or approximate financial figures not explicitly stated in the context.
5. When quoting numbers, always include the source: "According to [Document Name] (page X)..."
6. Flag uncertainty explicitly: use phrases like "Based on the available data..." when context is limited.
7. Keep answers concise and professional. Use bullet points for lists of facts.

Format your response as:
- Direct answer first
- Supporting evidence with source citations in parentheses
- Any caveats or data gaps at the end"""


def _build_context_block(retrieved_chunks: list[dict[str, Any]]) -> str:
    """Format retrieved chunks into a structured context block for the prompt."""
    if not retrieved_chunks:
        return "No relevant documents found."

    lines = ["=== CONTEXT DOCUMENTS ===\n"]
    for i, chunk in enumerate(retrieved_chunks, 1):
        doc_name = chunk.get("document_name", "Unknown Document")
        page = chunk.get("page_number", "?")
        section = chunk.get("section_header", "")
        content = chunk.get("content", "")
        score = chunk.get("relevance_score", 0)

        header = f"[Source {i}] {doc_name} | Page {page}"
        if section:
            header += f" | Section: {section}"
        header += f" | Relevance: {score:.2f}"

        lines.append(header)
        lines.append(content)
        lines.append("")

    return "\n".join(lines)


def _determine_confidence(chunks: list[dict[str, Any]]) -> str:
    """Classify retrieval confidence based on top-k relevance scores."""
    if not chunks:
        return "low"

    top_score = chunks[0].get("relevance_score", 0)
    avg_score = sum(c.get("relevance_score", 0) for c in chunks) / len(chunks)

    # OpenAI text-embedding-3-small cosine similarities are typically 0.25-0.55
    # for relevant financial document chunks. Thresholds calibrated accordingly.
    if top_score >= 0.40 and avg_score >= 0.30:
        return "high"
    elif top_score >= 0.30:
        return "medium"
    else:
        return "low"


class RAGChat:
    """
    Answers financial questions using retrieved context chunks.

    Usage::

        chat = RAGChat()
        response = await chat.answer(
            message="What was EBITDA for FY2023?",
            retrieved_chunks=chunks,
            conversation_history=[...],
        )
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    async def answer(
        self,
        message: str,
        retrieved_chunks: list[dict[str, Any]],
        conversation_history: list[dict[str, str]] | None = None,
    ) -> dict[str, Any]:
        """
        Generate a grounded answer for the user's query.

        Returns:
            {
                "answer": str,
                "sources": [...],
                "confidence": "high" | "medium" | "low",
                "model_used": str,
                "prompt_tokens": int,
                "completion_tokens": int,
            }
        """
        context_block = _build_context_block(retrieved_chunks)
        confidence = _determine_confidence(retrieved_chunks)

        # Build conversation messages
        messages: list[dict[str, str]] = []

        if conversation_history:
            for turn in conversation_history[-6:]:
                messages.append({"role": turn["role"], "content": turn["content"]})

        user_content = f"{context_block}\n\n=== USER QUESTION ===\n{message}"
        messages.append({"role": "user", "content": user_content})

        logger.debug(
            "Calling RAG chat",
            extra={
                "message": message[:100],
                "chunks": len(retrieved_chunks),
                "confidence": confidence,
            },
        )

        result = await llm_complete(
            system=_SYSTEM_PROMPT,
            messages=messages,
            max_tokens=_MAX_TOKENS,
            temperature=self._settings.llm_temperature,
        )

        # Build source citations from retrieved chunks
        sources = []
        for chunk in retrieved_chunks:
            sources.append(
                {
                    "doc_name": chunk.get("document_name", "Unknown"),
                    "page": chunk.get("page_number"),
                    "excerpt": chunk.get("content", "")[:300],
                    "chunk_id": chunk.get("chunk_id"),
                    "document_id": chunk.get("document_id"),
                    "relevance_score": chunk.get("relevance_score", 0.0),
                    "section_header": chunk.get("section_header"),
                }
            )

        return {
            "answer": result["text"],
            "sources": sources,
            "confidence": confidence,
            "model_used": result["model_used"],
            "prompt_tokens": result["prompt_tokens"],
            "completion_tokens": result["completion_tokens"],
        }
