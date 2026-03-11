"""
Document routes — upload, ingestion pipeline, retrieval.

Thin HTTP layer — all business logic in DocumentService.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.document_repo import DocumentRepository
from app.schemas.common import PageMeta
from app.schemas.document import DocumentListResponse, DocumentResponse, DocumentUploadResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


# ------------------------------------------------------------------
# POST /documents — upload file
# ------------------------------------------------------------------

@router.post("", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    file: UploadFile = File(...),
    company_id: uuid.UUID | None = Query(default=None),
    deal_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> DocumentResponse:
    """
    Upload a document and trigger the ingestion pipeline.
    Returns immediately — pipeline runs synchronously (use background tasks in production).
    """
    try:
        file_bytes = await file.read()
        svc = DocumentService(settings=settings, db_session=db)
        doc = await svc.upload_and_process(
            file_bytes=file_bytes,
            filename=file.filename or "upload",
            company_id=company_id,
            deal_id=deal_id,
            mime_type=file.content_type,
            run_pipeline=True,
        )
        return DocumentResponse.model_validate(doc)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "UPLOAD_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# GET /documents — list
# ------------------------------------------------------------------

@router.get("", response_model=DocumentListResponse, status_code=status.HTTP_200_OK)
async def list_documents(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    company_id: uuid.UUID | None = Query(default=None),
    deal_id: uuid.UUID | None = Query(default=None),
    doc_type: str | None = Query(default=None),
    processing_status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    """List documents with pagination and filters."""
    offset = (page - 1) * per_page
    repo = DocumentRepository(db)
    docs, total = await repo.list(
        offset=offset,
        limit=per_page,
        company_id=company_id,
        deal_id=deal_id,
        document_type=doc_type,
        status=processing_status,
    )
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in docs],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )


# ------------------------------------------------------------------
# GET /documents/{id} — get with chunks
# ------------------------------------------------------------------

@router.get("/{document_id}", response_model=DocumentResponse, status_code=status.HTTP_200_OK)
async def get_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    """Get a document by ID with processing status and metadata."""
    repo = DocumentRepository(db)
    doc = await repo.get_by_id(document_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "DOCUMENT_NOT_FOUND", "message": f"Document {document_id} not found"},
        )
    return DocumentResponse.model_validate(doc)
