"""Document schemas — upload, read, chunks."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class DocumentStatus(StrEnum):
    PENDING = "pending"
    CLASSIFYING = "classifying"
    PARSING = "parsing"
    CHUNKING = "chunking"
    EMBEDDING = "embedding"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(StrEnum):
    FINANCIAL_STATEMENT = "financial_statement"
    CREDIT_MEMO = "credit_memo"
    TEASER = "teaser"
    CIM = "cim"
    LEGAL = "legal"
    MANAGEMENT_ACCOUNTS = "management_accounts"
    XBRL = "xbrl"
    OTHER = "other"


class DocumentUploadResponse(BaseModel):
    """Returned immediately on upload before processing completes."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    status: DocumentStatus
    message: str = "Document queued for processing"


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID | None
    deal_id: uuid.UUID | None
    filename: str
    file_path: str | None
    mime_type: str | None
    file_size_bytes: int | None
    document_type: DocumentType | None
    status: DocumentStatus
    page_count: int | None
    chunk_count: int | None
    source_url: str | None
    period_start: str | None
    period_end: str | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[DocumentResponse]
    meta: PageMeta


class DocumentChunkResponse(BaseModel):
    """A single retrieved chunk from the vector store."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    chunk_index: int
    content: str
    page_number: int | None
    section_header: str | None
    chunk_type: str | None = Field(
        default=None,
        description="text, table, footnote, header",
    )
    # Similarity score from pgvector (populated on search results)
    similarity_score: float | None = None
    created_at: datetime
