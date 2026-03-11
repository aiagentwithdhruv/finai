"""Chat / RAG schemas — request, response, source citations."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class ChatScopeType(StrEnum):
    """Defines the retrieval boundary for the RAG query."""

    GLOBAL = "global"   # search across all deal documents
    DEAL = "deal"       # scoped to a single deal's documents
    COMPANY = "company" # scoped to a single company's documents
    DOCUMENT = "document"  # scoped to a specific document


class SourceCitation(BaseModel):
    """Mandatory source attribution — every AI claim must trace to a source."""

    model_config = ConfigDict(from_attributes=True)

    document_id: uuid.UUID
    document_filename: str
    chunk_id: uuid.UUID
    page_number: int | None = None
    section_header: str | None = None
    excerpt: str = Field(
        ...,
        description="Verbatim text excerpt from the source that supports the claim",
    )
    similarity_score: float | None = None


class ChatRequest(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    message: str = Field(..., min_length=1, max_length=4000)
    conversation_id: uuid.UUID | None = Field(
        default=None,
        description="Provide to continue an existing conversation with memory",
    )
    scope_type: ChatScopeType = ChatScopeType.GLOBAL
    scope_id: uuid.UUID | None = Field(
        default=None,
        description=(
            "Required when scope_type is deal, company, or document. "
            "The UUID of the scoped entity."
        ),
    )
    # Optional caller hints
    top_k: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Number of chunks to retrieve",
    )
    rerank: bool = Field(
        default=True,
        description="Apply re-ranking step on retrieved chunks",
    )

    def model_post_init(self, __context: object) -> None:
        if self.scope_type != ChatScopeType.GLOBAL and self.scope_id is None:
            raise ValueError(
                f"scope_id is required when scope_type is '{self.scope_type}'"
            )


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    conversation_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    sources: list[SourceCitation]
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description=(
            "Aggregate retrieval confidence. "
            "Below 0.4 triggers a low-confidence warning."
        ),
    )
    low_confidence_warning: bool = False
    model_used: str | None = None
    created_at: datetime
