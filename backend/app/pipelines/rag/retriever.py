"""
RAGRetriever — vector similarity search over document chunks.

Uses pgvector's cosine distance operator (<=>) to find the most relevant
chunks for a given natural-language query.

Filters:
    company_id  — retrieve only from a specific company's documents
    deal_id     — retrieve only from documents on a specific deal
    document_id — retrieve only from a specific document

The document JOIN for company/deal filtering is applied lazily to avoid
unnecessary joins when not needed.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.pipelines.ingestion.embedder import embed_single

logger = logging.getLogger(__name__)


class RAGRetriever:
    """
    Retrieves semantically similar document chunks for a natural-language query.

    Usage::

        retriever = RAGRetriever()
        results = await retriever.retrieve(
            query="What was EBITDA margin in FY2023?",
            db_session=session,
            top_k=5,
            company_id=company_uuid,
        )
    """

    def __init__(self) -> None:
        pass

    async def retrieve(
        self,
        query: str,
        db_session: AsyncSession,
        top_k: int = 5,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        document_id: uuid.UUID | None = None,
    ) -> list[dict[str, Any]]:
        """
        Embed the query and find the top_k most similar chunks.

        Returns list of dicts:
            {
                "chunk_id": UUID,
                "document_id": UUID,
                "content": str,
                "page_number": int | None,
                "section_header": str | None,
                "document_name": str,
                "relevance_score": float,   # cosine similarity 0.0-1.0
            }
        """
        if not query.strip():
            return []

        # Embed the query using the same model as chunk embeddings
        logger.debug("Embedding query for retrieval", extra={"query_len": len(query)})
        query_embedding = await embed_single(query)

        # Use the repository's vector search method
        from app.repositories.document_repo import DocumentRepository

        repo = DocumentRepository(db_session)
        chunk_pairs = await repo.search_chunks(
            query_embedding=query_embedding,
            top_k=top_k,
            document_id=document_id,
            company_id=company_id,
            deal_id=deal_id,
        )

        if not chunk_pairs:
            logger.info("No chunks retrieved for query", extra={"query": query[:100]})
            return []

        # Enrich with document filename (requires document FK)
        results = []
        for chunk, similarity in chunk_pairs:
            # Lazy-load the document relationship to get the filename
            # This is done per-chunk but chunk_pairs is small (top_k <= 20)
            from sqlalchemy import select
            from app.models.document import Document

            doc_result = await db_session.execute(
                select(Document.filename, Document.original_filename)
                .where(Document.id == chunk.document_id)
            )
            doc_row = doc_result.first()
            doc_name = (doc_row.original_filename or doc_row.filename) if doc_row else "Unknown"

            results.append(
                {
                    "chunk_id": chunk.id,
                    "document_id": chunk.document_id,
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "section_header": chunk.section_title,
                    "document_name": doc_name,
                    "relevance_score": round(similarity, 4),
                }
            )

        logger.info(
            "Retrieved chunks",
            extra={
                "query": query[:80],
                "chunks": len(results),
                "top_score": results[0]["relevance_score"] if results else 0,
            },
        )

        return results
