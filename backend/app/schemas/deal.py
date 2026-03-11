"""Deal schemas — create, update, read, list."""

from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class DealType(StrEnum):
    MA = "ma"
    DEBT = "debt"
    EQUITY = "equity"
    OTHER = "other"


class DealStatus(StrEnum):
    SOURCING = "sourcing"
    SCREENING = "screening"
    DILIGENCE = "diligence"
    NEGOTIATION = "negotiation"
    CLOSED = "closed"
    DEAD = "dead"


class DealCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    company_id: uuid.UUID
    deal_type: DealType = DealType.MA
    status: DealStatus = DealStatus.SOURCING
    description: str | None = None
    target_close_date: datetime | None = None
    deal_value: float | None = Field(
        default=None,
        description="Deal value in the company's base currency",
    )
    assigned_team: list[str] | None = Field(
        default=None,
        description="List of team member emails/IDs",
    )
    tags: list[str] | None = None


class DealUpdate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str | None = Field(default=None, min_length=1, max_length=255)
    status: DealStatus | None = None
    description: str | None = None
    target_close_date: datetime | None = None
    deal_value: float | None = None
    assigned_team: list[str] | None = None
    tags: list[str] | None = None


class DealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    company_id: uuid.UUID
    deal_type: DealType
    status: DealStatus
    description: str | None
    target_close_date: datetime | None
    deal_value: float | None
    assigned_team: list[str] | None
    tags: list[str] | None
    # Aggregate counts — populated by service layer join/sub-query
    document_count: int = 0
    material_count: int = 0
    created_at: datetime
    updated_at: datetime


class DealListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[DealResponse]
    meta: PageMeta


class PipelineSummary(BaseModel):
    """Deal count per status — used by the pipeline dashboard."""

    model_config = ConfigDict(from_attributes=True)

    sourcing: int = 0
    screening: int = 0
    diligence: int = 0
    negotiation: int = 0
    closed: int = 0
    dead: int = 0
    total: int = 0
