"""Financial statement repository — all DB access for FinancialStatement entities."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial import FinancialStatement


class FinancialRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: dict[str, Any]) -> FinancialStatement:
        stmt_obj = FinancialStatement(**data)
        self._session.add(stmt_obj)
        await self._session.flush()
        await self._session.refresh(stmt_obj)
        return stmt_obj

    async def get_by_company(
        self,
        company_id: uuid.UUID,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[FinancialStatement], int]:
        """All statements for a company, newest period first."""
        base = select(FinancialStatement).where(
            FinancialStatement.company_id == company_id
        )

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(FinancialStatement.period_end.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def get_latest(
        self, company_id: uuid.UUID
    ) -> FinancialStatement | None:
        """Most recent statement for a company by period_end."""
        stmt = (
            select(FinancialStatement)
            .where(FinancialStatement.company_id == company_id)
            .order_by(FinancialStatement.period_end.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(
        self, statement_id: uuid.UUID
    ) -> FinancialStatement | None:
        stmt = select(FinancialStatement).where(
            FinancialStatement.id == statement_id
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()
