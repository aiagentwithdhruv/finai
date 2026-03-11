"""
Company routes — CRUD, Companies House lookup, financial data.

Thin HTTP layer — all business logic in CompanyService / CompanyRepository.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.company_repo import CompanyRepository
from app.repositories.financial_repo import FinancialRepository
from app.schemas.common import PageMeta
from app.schemas.company import (
    CompanyCreate,
    CompanyListResponse,
    CompanyLookupRequest,
    CompanyResponse,
)
from app.schemas.financial import FinancialListResponse, FinancialStatementResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["companies"])


# ------------------------------------------------------------------
# POST /companies/lookup — search Companies House (no persistence)
# ------------------------------------------------------------------

@router.post("/lookup", status_code=status.HTTP_200_OK)
async def lookup_companies(
    body: CompanyLookupRequest,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Search Companies House for companies matching a name or number.
    Results are NOT persisted — use POST /companies to save a company.
    """
    try:
        svc = CompanyService(settings=settings, db_session=db)
        query = body.company_name or body.company_number or ""
        return await svc.lookup(query=query)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": "COMPANIES_HOUSE_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# POST /companies — create a company record
# ------------------------------------------------------------------

@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
async def create_company(
    body: CompanyCreate,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    """Create a new company record manually."""
    try:
        repo = CompanyRepository(db)
        company = await repo.create(body.model_dump(exclude_unset=True))
        return CompanyResponse.model_validate(company)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error_code": "COMPANY_CREATE_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# GET /companies — list companies
# ------------------------------------------------------------------

@router.get("", response_model=CompanyListResponse, status_code=status.HTTP_200_OK)
async def list_companies(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    sector: str | None = Query(default=None),
    country: str | None = Query(default=None),
    company_status: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> CompanyListResponse:
    """List companies with pagination and optional filters."""
    repo = CompanyRepository(db)
    offset = (page - 1) * per_page
    companies, total = await repo.list(
        offset=offset,
        limit=per_page,
        sector=sector,
        country=country,
        company_status=company_status,
    )
    return CompanyListResponse(
        items=[CompanyResponse.model_validate(c) for c in companies],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )


# ------------------------------------------------------------------
# GET /companies/{id} — get company detail with financials
# ------------------------------------------------------------------

@router.get("/{company_id}", response_model=CompanyResponse, status_code=status.HTTP_200_OK)
async def get_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> CompanyResponse:
    """Get a company by ID."""
    repo = CompanyRepository(db)
    company = await repo.get_by_id(company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "COMPANY_NOT_FOUND", "message": f"Company {company_id} not found"},
        )
    return CompanyResponse.model_validate(company)


# ------------------------------------------------------------------
# GET /companies/{id}/financials — financial statements
# ------------------------------------------------------------------

@router.get("/{company_id}/financials", response_model=FinancialListResponse)
async def get_company_financials(
    company_id: uuid.UUID,
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> FinancialListResponse:
    """Get all financial statements for a company, newest first."""
    offset = (page - 1) * per_page
    repo = FinancialRepository(db)
    items, total = await repo.get_by_company(company_id, offset=offset, limit=per_page)
    return FinancialListResponse(
        items=[FinancialStatementResponse.model_validate(fs) for fs in items],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )


# ------------------------------------------------------------------
# POST /companies/{id}/refresh — refresh from Companies House
# ------------------------------------------------------------------

@router.post("/{company_id}/refresh", status_code=status.HTTP_200_OK)
async def refresh_company(
    company_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    """Refresh a company's data from Companies House API."""
    try:
        svc = CompanyService(settings=settings, db_session=db)
        update_data = await svc.refresh_from_companies_house(company_id=company_id)
        return {
            "success": True,
            "message": "Company data refreshed",
            "updated_fields": list(update_data.keys()),
        }
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "COMPANY_NOT_FOUND", "message": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"error_code": "REFRESH_ERROR", "message": str(exc)},
        )
