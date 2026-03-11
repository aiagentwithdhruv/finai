"""
Deal routes — CRUD, pipeline management.

Thin HTTP layer — all business logic in DealRepository.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.deal_repo import DealRepository
from app.schemas.common import PageMeta
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealUpdate,
    PipelineSummary,
)

router = APIRouter(prefix="/deals", tags=["deals"])


# ------------------------------------------------------------------
# POST /deals — create
# ------------------------------------------------------------------

@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
async def create_deal(
    body: DealCreate,
    db: AsyncSession = Depends(get_db),
) -> DealResponse:
    """Create a new deal mandate."""
    try:
        repo = DealRepository(db)
        deal = await repo.create(body.model_dump(exclude_unset=True))
        return DealResponse.model_validate(deal)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "DEAL_CREATE_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# GET /deals — list (pipeline view)
# ------------------------------------------------------------------

@router.get("", response_model=DealListResponse, status_code=status.HTTP_200_OK)
async def list_deals(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    deal_status: str | None = Query(default=None, alias="status"),
    deal_type: str | None = Query(default=None),
    company_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> DealListResponse:
    """List deals with pagination and optional filters."""
    offset = (page - 1) * per_page
    repo = DealRepository(db)
    deals, total = await repo.list(
        offset=offset,
        limit=per_page,
        status=deal_status,
        deal_type=deal_type,
        company_id=company_id,
    )
    return DealListResponse(
        items=[DealResponse.model_validate(d) for d in deals],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )


# ------------------------------------------------------------------
# GET /deals/pipeline — pipeline summary counts
# ------------------------------------------------------------------

@router.get("/pipeline", response_model=PipelineSummary, status_code=status.HTTP_200_OK)
async def get_pipeline_summary(db: AsyncSession = Depends(get_db)) -> PipelineSummary:
    """Get deal count by status for the pipeline dashboard."""
    repo = DealRepository(db)
    summary = await repo.get_pipeline_summary()
    return PipelineSummary(**summary)


# ------------------------------------------------------------------
# GET /deals/{id} — get
# ------------------------------------------------------------------

@router.get("/{deal_id}", response_model=DealResponse, status_code=status.HTTP_200_OK)
async def get_deal(
    deal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> DealResponse:
    """Get a deal by ID with related documents and materials."""
    repo = DealRepository(db)
    deal = await repo.get_by_id(deal_id)
    if deal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "DEAL_NOT_FOUND", "message": f"Deal {deal_id} not found"},
        )
    return DealResponse.model_validate(deal)


# ------------------------------------------------------------------
# PATCH /deals/{id} — update
# ------------------------------------------------------------------

@router.patch("/{deal_id}", response_model=DealResponse, status_code=status.HTTP_200_OK)
async def update_deal(
    deal_id: uuid.UUID,
    body: DealUpdate,
    db: AsyncSession = Depends(get_db),
) -> DealResponse:
    """Update deal status, team, or metadata."""
    repo = DealRepository(db)
    deal = await repo.update(deal_id, body.model_dump(exclude_unset=True))
    if deal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "DEAL_NOT_FOUND", "message": f"Deal {deal_id} not found"},
        )
    return DealResponse.model_validate(deal)
