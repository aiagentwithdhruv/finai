"""
Material generation routes — create teasers, credit memos, presentations.

Thin HTTP layer — all business logic in GenerationService.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.repositories.material_repo import MaterialRepository
from app.schemas.common import PageMeta
from app.schemas.material import (
    GenerateRequest,
    MaterialApproval,
    MaterialListResponse,
    MaterialResponse,
)
from app.services.generation_service import GenerationService

router = APIRouter(prefix="/generate", tags=["generation"])


# ------------------------------------------------------------------
# POST /generate — trigger generation
# ------------------------------------------------------------------

@router.post("", response_model=MaterialResponse, status_code=status.HTTP_201_CREATED)
async def generate_material(
    body: GenerateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MaterialResponse:
    """
    Generate a financial advisory document (teaser, credit memo, company profile).

    Ratios are calculated deterministically in code; LLM handles narrative only.
    Generated document starts with status='draft' and requires human approval.
    """
    try:
        svc = GenerationService(settings=settings, db_session=db)
        material = await svc.generate_material(
            material_type=str(body.material_type),
            company_id=body.company_id,
            deal_id=body.deal_id,
            title=body.title if hasattr(body, "title") else None,
            inputs={
                "sections": getattr(body, "sections", None),
                "comparable_ids": getattr(body, "comparable_ids", None),
                "generation_notes": getattr(body, "generation_notes", None),
            },
            actor=str(request.client.host) if request.client else None,
        )
        return MaterialResponse.model_validate(material)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "NOT_FOUND", "message": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "GENERATION_ERROR", "message": str(exc)},
        )


# ------------------------------------------------------------------
# GET /generate/materials — list materials
# ------------------------------------------------------------------

@router.get("/materials", response_model=MaterialListResponse, status_code=status.HTTP_200_OK)
async def list_materials(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=20, ge=1, le=100),
    deal_id: uuid.UUID | None = Query(default=None),
    company_id: uuid.UUID | None = Query(default=None),
    material_type: str | None = Query(default=None),
    mat_status: str | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> MaterialListResponse:
    """List generated materials with pagination and filters."""
    offset = (page - 1) * per_page
    repo = MaterialRepository(db)
    materials, total = await repo.list(
        offset=offset,
        limit=per_page,
        company_id=company_id,
        deal_id=deal_id,
        material_type=material_type,
        status=mat_status,
    )
    return MaterialListResponse(
        items=[MaterialResponse.model_validate(m) for m in materials],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )


# ------------------------------------------------------------------
# GET /generate/materials/{id} — get material
# ------------------------------------------------------------------

@router.get(
    "/materials/{material_id}",
    response_model=MaterialResponse,
    status_code=status.HTTP_200_OK,
)
async def get_material(
    material_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> MaterialResponse:
    """Get a generated material with full content and source attribution."""
    repo = MaterialRepository(db)
    material = await repo.get_by_id(material_id)
    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "MATERIAL_NOT_FOUND", "message": f"Material {material_id} not found"},
        )
    return MaterialResponse.model_validate(material)


# ------------------------------------------------------------------
# PATCH /generate/materials/{id}/approve — human review gate
# ------------------------------------------------------------------

@router.patch(
    "/materials/{material_id}/approve",
    response_model=MaterialResponse,
    status_code=status.HTTP_200_OK,
)
async def approve_material(
    material_id: uuid.UUID,
    body: MaterialApproval,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MaterialResponse:
    """
    Human review gate (Layer 5 guardrail).
    No generated document reaches 'approved' without calling this endpoint.
    """
    try:
        svc = GenerationService(settings=settings, db_session=db)
        material = await svc.approve_material(
            material_id=material_id,
            approved=body.approved,
            reviewer=body.reviewer_id,
            notes=body.review_notes,
        )
        return MaterialResponse.model_validate(material)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "MATERIAL_NOT_FOUND", "message": str(exc)},
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "APPROVAL_ERROR", "message": str(exc)},
        )
