"""Common shared schemas — health, errors, pagination."""

from __future__ import annotations

from typing import Any

from fastapi import Query
from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    status: str = "ok"
    version: str
    environment: str


class ErrorDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    error_code: str
    message: str
    details: list[ErrorDetail] | None = None
    request_id: str | None = None


class PaginationParams:
    """Dependency-injectable pagination parameters extracted from query string."""

    def __init__(
        self,
        page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
        per_page: int = Query(default=20, ge=1, le=100, description="Items per page"),
    ) -> None:
        self.page = page
        self.per_page = per_page

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page

    @property
    def limit(self) -> int:
        return self.per_page


class PageMeta(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    page: int
    per_page: int
    total: int
    total_pages: int

    @classmethod
    def build(cls, page: int, per_page: int, total: int) -> "PageMeta":
        total_pages = max(1, (total + per_page - 1) // per_page)
        return cls(page=page, per_page=per_page, total=total, total_pages=total_pages)
