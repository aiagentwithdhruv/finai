"""Deal repository — all DB access for Deal entities."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.deal import Deal
from app.models.document import Document
from app.models.material import Material


class DealRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: dict[str, Any]) -> Deal:
        deal = Deal(**data)
        self._session.add(deal)
        await self._session.flush()
        await self._session.refresh(deal)
        return deal

    async def get_by_id(self, deal_id: uuid.UUID) -> Deal | None:
        stmt = select(Deal).where(Deal.id == deal_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        status: str | None = None,
        company_id: uuid.UUID | None = None,
        deal_type: str | None = None,
    ) -> tuple[list[Deal], int]:
        base = select(Deal)

        if status is not None:
            base = base.where(Deal.status == status)
        if company_id is not None:
            base = base.where(Deal.company_id == company_id)
        if deal_type is not None:
            base = base.where(Deal.deal_type == deal_type)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(Deal.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def update(
        self, deal_id: uuid.UUID, data: dict[str, Any]
    ) -> Deal | None:
        stmt = (
            update(Deal)
            .where(Deal.id == deal_id)
            .values(**data)
            .returning(Deal)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_pipeline_summary(self) -> dict[str, int]:
        """Return count of deals grouped by status."""
        stmt = select(Deal.status, func.count().label("cnt")).group_by(Deal.status)
        rows = await self._session.execute(stmt)
        counts: dict[str, int] = {row.status: row.cnt for row in rows}
        # Ensure all statuses are present even if count is 0
        statuses = ["sourcing", "screening", "diligence", "negotiation", "closed", "dead"]
        summary = {s: counts.get(s, 0) for s in statuses}
        summary["total"] = sum(summary.values())
        return summary

    async def get_document_count(self, deal_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(Document.deal_id == deal_id)
        return (await self._session.execute(stmt)).scalar_one()

    async def get_material_count(self, deal_id: uuid.UUID) -> int:
        stmt = select(func.count()).where(Material.deal_id == deal_id)
        return (await self._session.execute(stmt)).scalar_one()
