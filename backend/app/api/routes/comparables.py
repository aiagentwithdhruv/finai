"""
Comparable company routes — manage the peer multiples universe.

Thin HTTP layer — all business logic in ComparableService.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.comparable_repo import ComparableRepository
from app.schemas.common import PageMeta
from app.schemas.comparable import (
    ComparableCreate,
    ComparableListResponse,
    ComparableResponse,
    SectorMedians,
)
from app.services.comparable_service import ComparableService

router = APIRouter(prefix="/comps", tags=["comparables"])


# ------------------------------------------------------------------
# POST /comps — add a comparable by ticker
# ------------------------------------------------------------------

@router.post("", response_model=ComparableResponse, status_code=status.HTTP_201_CREATED)
async def add_comparable(
    body: ComparableCreate,
    db: AsyncSession = Depends(get_db),
) -> ComparableResponse:
    """Add a company to the comparable universe by ticker. Fetches data from yfinance."""
    try:
        svc = ComparableService(db_session=db)
        comp = await svc.add_company(ticker=body.ticker)
        return ComparableResponse.model_validate(comp)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"error_code": "TICKER_NOT_FOUND", "message": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": "YFINANCE_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# GET /comps — list with sector medians
# ------------------------------------------------------------------

@router.get("", response_model=ComparableListResponse, status_code=status.HTTP_200_OK)
async def list_comparables(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    sector: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> ComparableListResponse:
    """List comparable companies with sector median multiples."""
    offset = (page - 1) * per_page
    svc = ComparableService(db_session=db)
    result = await svc.list_comparables(
        sector_filter=sector,
        offset=offset,
        limit=per_page,
    )
    companies = [ComparableResponse.model_validate(c) for c in result["companies"]]
    sector_medians = {
        k: SectorMedians(**v)
        for k, v in result["sector_medians"].items()
    }
    return ComparableListResponse(
        items=companies,
        meta=PageMeta.build(page=page, per_page=per_page, total=result["total"]),
        sector_medians=sector_medians,
    )


# ------------------------------------------------------------------
# POST /comps/refresh — refresh all from yfinance
# ------------------------------------------------------------------

@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_all_comparables(
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Refresh yfinance data for all comparables. Returns success/failure counts."""
    svc = ComparableService(db_session=db)
    result = await svc.refresh_all()
    return result


# ------------------------------------------------------------------
# DELETE /comps/{id} — remove
# ------------------------------------------------------------------

@router.delete("/{comparable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comparable(
    comparable_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Remove a company from the comparable universe."""
    svc = ComparableService(db_session=db)
    deleted = await svc.delete_comparable(comparable_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "COMPARABLE_NOT_FOUND", "message": f"Comparable {comparable_id} not found"},
        )
