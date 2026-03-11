"""Comparable company schemas — create, read, list with sector medians."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class MultiplesDict(BaseModel):
    """Trailing trading multiples for a comparable company."""

    model_config = ConfigDict(from_attributes=True)

    ev_ebitda: Decimal | None = Field(default=None, description="EV / EBITDA")
    ev_revenue: Decimal | None = Field(default=None, description="EV / Revenue")
    pe_ratio: Decimal | None = Field(default=None, description="Price / Earnings")
    ev_ebit: Decimal | None = Field(default=None, description="EV / EBIT")


class ComparableCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ticker: str = Field(..., max_length=20, description="Exchange ticker symbol")
    exchange: str = Field(..., max_length=20, description="e.g. LSE, NYSE, NASDAQ")
    name: str = Field(..., max_length=255)
    sector: str = Field(..., max_length=100)
    market_cap: Decimal | None = None
    currency: str = Field(default="USD", max_length=3)
    multiples: MultiplesDict | None = None
    notes: str | None = None


class ComparableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ticker: str
    exchange: str
    name: str
    sector: str
    market_cap: Decimal | None
    currency: str
    ev_ebitda: Decimal | None
    ev_revenue: Decimal | None
    pe_ratio: Decimal | None
    ev_ebit: Decimal | None
    notes: str | None
    last_refreshed_at: datetime | None
    created_at: datetime
    updated_at: datetime


class SectorMedians(BaseModel):
    """Sector-level median multiples computed from comparables."""

    model_config = ConfigDict(from_attributes=True)

    sector: str
    company_count: int
    median_ev_ebitda: Decimal | None
    median_ev_revenue: Decimal | None
    median_pe_ratio: Decimal | None
    median_ev_ebit: Decimal | None


class ComparableListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[ComparableResponse]
    meta: PageMeta
    # Keyed by sector name → median multiples for that sector
    sector_medians: dict[str, SectorMedians] = Field(
        default_factory=dict,
        description="Median multiples grouped by sector for all returned items",
    )
