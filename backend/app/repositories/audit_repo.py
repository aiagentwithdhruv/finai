"""Audit log repository — append-only, never updates or deletes entries."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def log(self, data: dict[str, Any]) -> AuditLog:
        """Create a new immutable audit entry. Never update existing entries.

        Accepts arbitrary dict — known AuditLog columns are mapped directly,
        everything else is merged into the 'details' JSON field.
        """
        _KNOWN_COLS = {"user_id", "user_email", "action", "entity_type", "entity_id", "request_id", "ip_address", "details"}
        col_data: dict[str, Any] = {}
        extra: dict[str, Any] = {}

        for k, v in data.items():
            if k in _KNOWN_COLS:
                col_data[k] = v
            elif k == "actor":
                col_data["user_id"] = v
            else:
                extra[k] = v

        # Merge extra into details
        if extra:
            existing_details = col_data.get("details") or {}
            if isinstance(existing_details, dict):
                existing_details.update(extra)
            col_data["details"] = existing_details

        entry = AuditLog(**col_data)
        self._session.add(entry)
        await self._session.flush()
        return entry

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        action: str | None = None,
        entity_type: str | None = None,
        entity_id: uuid.UUID | None = None,
        user_id: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
    ) -> tuple[list[AuditLog], int]:
        """Paginated audit log, newest first.

        All filters are AND-combined.
        """
        base = select(AuditLog)

        if action is not None:
            base = base.where(AuditLog.action == action)
        if entity_type is not None:
            base = base.where(AuditLog.entity_type == entity_type)
        if entity_id is not None:
            base = base.where(AuditLog.entity_id == entity_id)
        if user_id is not None:
            base = base.where(AuditLog.user_id == user_id)
        if date_from is not None:
            base = base.where(AuditLog.created_at >= date_from)
        if date_to is not None:
            base = base.where(AuditLog.created_at <= date_to)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(AuditLog.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total
