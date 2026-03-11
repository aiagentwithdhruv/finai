"""Material (generated document) schemas — generate, read, approve."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class MaterialType(StrEnum):
    TEASER = "teaser"
    CREDIT_MEMO = "credit_memo"
    COMPANY_PROFILE = "company_profile"
    INVESTMENT_PRESENTATION = "investment_presentation"
    PIPELINE_REPORT = "pipeline_report"


class MaterialStatus(StrEnum):
    GENERATING = "generating"
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class GenerateRequest(BaseModel):
    """Trigger material generation for a company."""

    model_config = ConfigDict(from_attributes=True)

    company_id: uuid.UUID
    deal_id: uuid.UUID | None = None
    material_type: MaterialType
    # Optional list of section names to include; None = all sections for that type
    sections: list[str] | None = Field(
        default=None,
        description=(
            "Subset of sections to generate. "
            "Defaults to all sections defined in the template."
        ),
    )
    # Comparable company IDs to pull multiples from
    comparable_ids: list[uuid.UUID] | None = Field(
        default=None,
        description="Comparable companies to include in valuation section",
    )
    generation_notes: str | None = Field(
        default=None,
        max_length=2000,
        description="Additional context or instructions for the generation run",
    )


class MaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    company_id: uuid.UUID
    deal_id: uuid.UUID | None
    material_type: MaterialType
    status: MaterialStatus
    title: str | None
    # Structured JSON content (section → content mapping)
    content: dict | None = None
    # Source document IDs used for generation
    source_document_ids: list[uuid.UUID] | None = None
    # LLM metadata stored for audit compliance
    model_used: str | None = None
    generation_notes: str | None = None
    # Human review tracking
    reviewed_by: str | None = None
    reviewed_at: datetime | None = None
    review_notes: str | None = None
    version: int = 1
    created_at: datetime
    updated_at: datetime


class MaterialApproval(BaseModel):
    """Human sign-off payload — no generated document reaches 'approved' without this."""

    model_config = ConfigDict(from_attributes=True)

    reviewer_id: str = Field(..., description="User ID or email of approver")
    approved: bool
    review_notes: str | None = Field(
        default=None,
        max_length=5000,
        description="Reviewer comments or rejection reason",
    )


class MaterialListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[MaterialResponse]
    meta: PageMeta
