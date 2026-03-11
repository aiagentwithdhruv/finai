"""Audit log schemas — FCA-compliant immutable audit trail."""

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class AuditLogResponse(BaseModel):
    """Single audit log entry.

    Logs are write-only from the application side — never updated or deleted.
    """

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    # Who performed the action
    user_id: str | None = None
    user_email: str | None = None
    # What happened
    action: str = Field(..., description="e.g. document.upload, material.approved, chat.query")
    entity_type: str = Field(..., description="e.g. document, material, deal, company")
    entity_id: uuid.UUID | None = None
    # Structured context for the action
    metadata: dict | None = Field(
        default=None,
        description=(
            "Arbitrary JSON context: prompt used, model version, source doc IDs, "
            "generation cost, review chain, etc."
        ),
    )
    # Request tracing
    request_id: str | None = None
    ip_address: str | None = None
    # Immutable timestamp — set by DB default, never overwritten
    created_at: datetime


class AuditLogListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[AuditLogResponse]
    meta: PageMeta
