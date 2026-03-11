"""
Audit log route — read-only access to the immutable audit trail.

Audit entries are write-once (created by services). This route only supports
GET operations with filtering and pagination.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.repositories.audit_repo import AuditRepository
from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.schemas.common import PageMeta

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=AuditLogListResponse, status_code=status.HTTP_200_OK)
async def list_audit_logs(
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=50, ge=1, le=200),
    action: str | None = Query(default=None, description="Filter by action type"),
    entity_type: str | None = Query(default=None, description="Filter by entity type"),
    entity_id: uuid.UUID | None = Query(default=None, description="Filter by entity UUID"),
    user_id: str | None = Query(default=None, description="Filter by user ID"),
    date_from: datetime | None = Query(default=None, description="Filter from date (ISO 8601)"),
    date_to: datetime | None = Query(default=None, description="Filter to date (ISO 8601)"),
    db: AsyncSession = Depends(get_db),
) -> AuditLogListResponse:
    """
    List audit log entries (read-only, never modifiable).

    Supports filtering by action, entity type, entity ID, user, and date range.
    Results are ordered newest-first.
    """
    offset = (page - 1) * per_page
    repo = AuditRepository(db)
    logs, total = await repo.list(
        offset=offset,
        limit=per_page,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        user_id=user_id,
        date_from=date_from,
        date_to=date_to,
    )
    return AuditLogListResponse(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        meta=PageMeta.build(page=page, per_page=per_page, total=total),
    )
