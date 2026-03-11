"""Document repository — DB access for documents and vector chunks."""

from __future__ import annotations

import uuid
from typing import Any

from pgvector.sqlalchemy import Vector
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document, DocumentChunk, EMBEDDING_DIM


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ------------------------------------------------------------------
    # Documents
    # ------------------------------------------------------------------

    async def create(self, data: dict[str, Any]) -> Document:
        doc = Document(**data)
        self._session.add(doc)
        await self._session.flush()
        await self._session.refresh(doc)
        return doc

    async def get_by_id(self, document_id: uuid.UUID) -> Document | None:
        stmt = select(Document).where(Document.id == document_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        status: str | None = None,
        document_type: str | None = None,
    ) -> tuple[list[Document], int]:
        base = select(Document)

        if company_id is not None:
            base = base.where(Document.company_id == company_id)
        if deal_id is not None:
            base = base.where(Document.deal_id == deal_id)
        if status is not None:
            base = base.where(Document.status == status)
        if document_type is not None:
            base = base.where(Document.document_type == document_type)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(Document.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def update_status(
        self,
        document_id: uuid.UUID,
        status: str,
        extra: dict[str, Any] | None = None,
    ) -> Document | None:
        values: dict[str, Any] = {"status": status}
        if extra:
            values.update(extra)
        stmt = (
            update(Document)
            .where(Document.id == document_id)
            .values(**values)
            .returning(Document)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    # ------------------------------------------------------------------
    # Chunks
    # ------------------------------------------------------------------

    async def create_chunks(
        self, chunks: list[dict[str, Any]]
    ) -> list[DocumentChunk]:
        """Bulk insert chunks in a single flush."""
        objects = [DocumentChunk(**c) for c in chunks]
        self._session.add_all(objects)
        await self._session.flush()
        return objects

    async def search_chunks(
        self,
        query_embedding: list[float],
        *,
        top_k: int = 5,
        document_id: uuid.UUID | None = None,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
    ) -> list[tuple[DocumentChunk, float]]:
        """pgvector cosine similarity search with optional scope filters.

        Returns list of (chunk, similarity_score) sorted by descending similarity.
        Cosine distance = 1 - cosine_similarity, so lower distance = more similar.
        """
        # cosine_distance is the pgvector operator <=>
        distance_col = DocumentChunk.embedding.cosine_distance(query_embedding).label(
            "distance"
        )
        stmt = (
            select(DocumentChunk, distance_col)
            .where(DocumentChunk.embedding.is_not(None))
            .order_by(distance_col)
            .limit(top_k)
        )

        if document_id is not None:
            stmt = stmt.where(DocumentChunk.document_id == document_id)

        # company_id / deal_id require a join to documents
        if company_id is not None or deal_id is not None:
            stmt = stmt.join(
                Document, DocumentChunk.document_id == Document.id
            )
            if company_id is not None:
                stmt = stmt.where(Document.company_id == company_id)
            if deal_id is not None:
                stmt = stmt.where(Document.deal_id == deal_id)

        result = await self._session.execute(stmt)
        rows = result.all()
        # Convert distance to similarity: similarity = 1 - distance
        return [(chunk, float(1.0 - dist)) for chunk, dist in rows]
