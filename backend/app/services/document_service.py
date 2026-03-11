"""
DocumentService — business logic for document upload, ingestion, and retrieval.

Orchestrates:
  1. Save file bytes to storage (local temp path for now, Supabase Storage in production)
  2. Create Document row in DB with status=pending
  3. Trigger IngestPipeline async (can be run in background task)
  4. Return DocumentUploadResponse immediately
"""

from __future__ import annotations

import logging
import os
import tempfile
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.models.document import ProcessingStatus
from app.pipelines.ingestion.pipeline import IngestPipeline
from app.repositories.document_repo import DocumentRepository

logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(self, settings: Settings, db_session: AsyncSession) -> None:
        self._settings = settings
        self._db = db_session
        self._repo = DocumentRepository(db_session)

    async def upload_and_process(
        self,
        file_bytes: bytes,
        filename: str,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        mime_type: str | None = None,
        run_pipeline: bool = True,
    ) -> Any:
        """
        Upload a file and trigger the ingestion pipeline.

        Args:
            file_bytes:   Raw file content.
            filename:     Original filename (used for display + extension detection).
            company_id:   Optional company association.
            deal_id:      Optional deal association.
            mime_type:    MIME type of the uploaded file.
            run_pipeline: If True, run the full ingestion pipeline synchronously.
                          Set False to defer (e.g., background task).

        Returns:
            Document ORM object.
        """
        # Create the Document row immediately so the caller gets an ID
        doc = await self._repo.create(
            {
                "filename": filename,
                "original_filename": filename,
                "file_size_bytes": len(file_bytes),
                "mime_type": mime_type or _detect_mime_type(filename),
                "processing_status": ProcessingStatus.PENDING,
                "company_id": company_id,
                "deal_id": deal_id,
            }
        )

        if run_pipeline:
            # Write to a temp file for the pipeline (pypdf needs a path)
            with tempfile.NamedTemporaryFile(
                suffix=_get_extension(filename),
                delete=False,
            ) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name

            try:
                pipeline = IngestPipeline(self._settings)
                doc = await pipeline.run(
                    file_path=tmp_path,
                    filename=filename,
                    document_id=doc.id,
                    db_session=self._db,
                )
            finally:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

        return doc

    async def list_documents(
        self,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        status: str | None = None,
        document_type: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Any], int]:
        return await self._repo.list(
            offset=offset,
            limit=limit,
            company_id=company_id,
            deal_id=deal_id,
            status=status,
            document_type=document_type,
        )

    async def get_document(self, document_id: uuid.UUID) -> Any | None:
        return await self._repo.get_by_id(document_id)


def _detect_mime_type(filename: str) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    mime_map = {
        "pdf": "application/pdf",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "csv": "text/csv",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
    }
    return mime_map.get(ext, "application/octet-stream")


def _get_extension(filename: str) -> str:
    if "." in filename:
        return "." + filename.rsplit(".", 1)[-1].lower()
    return ".bin"
