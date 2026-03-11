"""
IngestPipeline — orchestrates the full document ingestion lifecycle.

Stages:
    1. classify  — LLM detects document type
    2. parse     — pypdf extracts text and sections
    3. chunk     — financial-aware text chunking
    4. embed     — OpenAI embeddings via text-embedding-3-small
    5. store     — bulk insert DocumentChunk rows into PostgreSQL/pgvector

Status transitions on the Document row are persisted after each stage so
the UI can show real-time progress. Any unhandled exception sets
processing_status = 'failed' with an error message.
"""

from __future__ import annotations

import hashlib
import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.document import Document, ProcessingStatus
from app.pipelines.ingestion.classifier import classify_document
from app.pipelines.ingestion.chunker import chunk_document
from app.pipelines.ingestion.embedder import embed_chunks
from app.pipelines.ingestion.pdf_parser import parse_pdf

logger = logging.getLogger(__name__)

_EMBEDDING_MODEL = "text-embedding-3-small"


class IngestPipeline:
    """
    Async document ingestion pipeline.

    Usage::

        pipeline = IngestPipeline(settings)
        document = await pipeline.run(
            file_path="/tmp/uploaded.pdf",
            filename="Q3-accounts.pdf",
            document_id=doc.id,
            db_session=session,
        )
    """

    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def run(
        self,
        file_path: str,
        filename: str,
        document_id: uuid.UUID,
        db_session: AsyncSession,
    ) -> Document:
        """
        Execute all pipeline stages for a document.

        Returns the updated Document ORM object.
        On any stage failure, sets status='failed' and re-raises.
        """
        # Import repository here to avoid circular imports at module level
        from app.repositories.document_repo import DocumentRepository

        repo = DocumentRepository(db_session)

        doc = await repo.get_by_id(document_id)
        if doc is None:
            raise ValueError(f"Document {document_id} not found")

        try:
            # ------------------------------------------------------------------
            # Stage 1: Classify
            # ------------------------------------------------------------------
            await repo.update_status(
                document_id,
                ProcessingStatus.CLASSIFYING,
                extra=None,
            )
            logger.info("Classifying document", extra={"document_id": str(document_id)})

            # Read a text sample for classification (first 2000 chars)
            first_page_text = self._read_sample(file_path)
            classification = await classify_document(
                text_sample=first_page_text,
                api_key=self._settings.anthropic_api_key,
            )

            # ------------------------------------------------------------------
            # Stage 2: Parse
            # ------------------------------------------------------------------
            await repo.update_status(
                document_id,
                ProcessingStatus.PARSING,
                extra={
                    "doc_type": classification["doc_type"],
                    "doc_type_confidence": classification["confidence"],
                    "classification_reasoning": classification.get("reasoning", ""),
                },
            )
            logger.info("Parsing PDF", extra={"document_id": str(document_id)})

            parsed = parse_pdf(file_path)
            pages = parsed["pages"]
            metadata = parsed["metadata"]

            await repo.update_status(
                document_id,
                ProcessingStatus.PARSING,
                extra={
                    "page_count": metadata["total_pages"],
                    "extracted_metadata": {
                        "title": metadata.get("title"),
                        "author": metadata.get("author"),
                        "creation_date": metadata.get("creation_date"),
                        "total_chars": metadata.get("total_chars"),
                    },
                },
            )

            # ------------------------------------------------------------------
            # Stage 3: Chunk
            # ------------------------------------------------------------------
            await repo.update_status(document_id, ProcessingStatus.CHUNKING, extra=None)
            logger.info("Chunking document", extra={"document_id": str(document_id)})

            raw_chunks = chunk_document(pages, chunk_size=1000, overlap=200)

            # ------------------------------------------------------------------
            # Stage 4: Embed
            # ------------------------------------------------------------------
            await repo.update_status(document_id, ProcessingStatus.EMBEDDING, extra=None)
            logger.info(
                "Generating embeddings",
                extra={"document_id": str(document_id), "chunk_count": len(raw_chunks)},
            )

            embedded_chunks = await embed_chunks(
                chunks=raw_chunks,
                api_key=self._settings.openai_api_key,
            )

            # ------------------------------------------------------------------
            # Stage 5: Store
            # ------------------------------------------------------------------
            chunk_dicts = self._prepare_chunk_rows(
                document_id=document_id,
                chunks=embedded_chunks,
            )
            await repo.create_chunks(chunk_dicts)

            # Mark complete
            await repo.update_status(
                document_id,
                ProcessingStatus.COMPLETED,
                extra={
                    "chunk_count": len(chunk_dicts),
                    "embedding_model": _EMBEDDING_MODEL,
                },
            )

            logger.info(
                "Document ingestion complete",
                extra={
                    "document_id": str(document_id),
                    "chunks": len(chunk_dicts),
                    "pages": metadata["total_pages"],
                },
            )

            # Return refreshed document
            doc = await repo.get_by_id(document_id)
            return doc

        except Exception as exc:
            logger.exception(
                "Document ingestion failed",
                extra={"document_id": str(document_id), "error": str(exc)},
            )
            # Best-effort status update — we don't want to mask the original exception
            try:
                await repo.update_status(
                    document_id,
                    ProcessingStatus.FAILED,
                    extra={"processing_error": str(exc)[:2000]},
                )
            except Exception:
                pass
            raise

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _read_sample(self, file_path: str) -> str:
        """
        Read the first ~2000 characters from a PDF for classification.
        Falls back gracefully if the file can't be read.
        """
        try:
            from pypdf import PdfReader

            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages[:3]:
                text += (page.extract_text() or "") + "\n"
                if len(text) >= 2000:
                    break
            return text[:2000]
        except Exception:
            return ""

    def _prepare_chunk_rows(
        self,
        document_id: uuid.UUID,
        chunks: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Convert raw embedded chunk dicts to DocumentChunk column dicts.

        Maps:
            chunk["content"]          → content, content_hash
            chunk["page_number"]      → page_number
            chunk["section_header"]   → section_title
            chunk["char_start"]       → char_start
            chunk["char_end"]         → char_end
            chunk["embedding"]        → embedding
            chunk["chunk_index"]      → chunk_index
        """
        rows = []
        for chunk in chunks:
            content = chunk.get("content", "")
            content_hash = hashlib.sha256(content.encode()).hexdigest()

            rows.append(
                {
                    "document_id": document_id,
                    "content": content,
                    "content_hash": content_hash,
                    "chunk_index": chunk.get("chunk_index", 0),
                    "page_number": chunk.get("page_number"),
                    "section_title": chunk.get("section_header"),
                    "char_start": chunk.get("char_start"),
                    "char_end": chunk.get("char_end"),
                    "embedding": chunk.get("embedding"),
                    "embedding_model": _EMBEDDING_MODEL,
                    "is_table": False,
                }
            )
        return rows
