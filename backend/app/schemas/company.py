"""Company schemas — create, read, list, lookup."""

from __future__ import annotations

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import PageMeta


class CompanyCreate(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str = Field(..., min_length=1, max_length=255)
    company_number: str | None = Field(
        default=None,
        max_length=20,
        description="Companies House registration number (UK)",
    )
    sector: str | None = Field(default=None, max_length=100)
    country: str = Field(default="GB", max_length=3)
    registered_address: str | None = None
    incorporation_date: date | None = None
    company_status: str | None = Field(default="active", max_length=50)
    description: str | None = None
    website: str | None = None


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    company_number: str | None
    sector: str | None
    country: str
    registered_address: str | None
    incorporation_date: date | None
    company_status: str | None
    description: str | None
    website: str | None
    created_at: datetime
    updated_at: datetime


class CompanyListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: list[CompanyResponse]
    meta: PageMeta


class CompanyLookupRequest(BaseModel):
    """Request to look up a company from Companies House API."""

    model_config = ConfigDict(from_attributes=True)

    company_number: str | None = Field(
        default=None,
        description="UK Companies House registration number",
    )
    company_name: str | None = Field(
        default=None,
        description="Company name to search for",
    )

    def model_post_init(self, __context: object) -> None:
        if not self.company_number and not self.company_name:
            raise ValueError("Either company_number or company_name is required")
