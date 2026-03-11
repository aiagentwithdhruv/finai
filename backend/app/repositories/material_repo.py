"""Material repository — all DB access for generated Material entities."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.material import Material


class MaterialRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: dict[str, Any]) -> Material:
        material = Material(**data)
        self._session.add(material)
        await self._session.flush()
        await self._session.refresh(material)
        return material

    async def get_by_id(self, material_id: uuid.UUID) -> Material | None:
        stmt = select(Material).where(Material.id == material_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        material_type: str | None = None,
        status: str | None = None,
    ) -> tuple[list[Material], int]:
        base = select(Material)

        if company_id is not None:
            base = base.where(Material.company_id == company_id)
        if deal_id is not None:
            base = base.where(Material.deal_id == deal_id)
        if material_type is not None:
            base = base.where(Material.material_type == material_type)
        if status is not None:
            base = base.where(Material.status == status)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(Material.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def update_status(
        self,
        material_id: uuid.UUID,
        status: str,
        extra: dict[str, Any] | None = None,
    ) -> Material | None:
        """Update status and any additional fields (e.g. reviewed_by, reviewed_at)."""
        values: dict[str, Any] = {"status": status}
        if extra:
            values.update(extra)
        stmt = (
            update(Material)
            .where(Material.id == material_id)
            .values(**values)
            .returning(Material)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
