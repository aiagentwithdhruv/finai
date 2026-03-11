"""Comparable company repository — all DB access for Comparable entities."""

from __future__ import annotations

import uuid
from decimal import Decimal
from typing import Any

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comparable import Comparable


class ComparableRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: dict[str, Any]) -> Comparable:
        comparable = Comparable(**data)
        self._session.add(comparable)
        await self._session.flush()
        await self._session.refresh(comparable)
        return comparable

    async def get_by_id(self, comparable_id: uuid.UUID) -> Comparable | None:
        stmt = select(Comparable).where(Comparable.id == comparable_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ticker(self, ticker: str) -> Comparable | None:
        stmt = select(Comparable).where(Comparable.ticker == ticker.upper())
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        sector: str | None = None,
    ) -> tuple[list[Comparable], int]:
        base = select(Comparable)

        if sector is not None:
            base = base.where(Comparable.sector == sector)

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = (
            base.order_by(Comparable.sector, Comparable.name)
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def update_multiples(
        self,
        comparable_id: uuid.UUID,
        multiples: dict[str, Any],
    ) -> Comparable | None:
        """Partial update of multiple columns (used by daily yfinance refresh)."""
        stmt = (
            update(Comparable)
            .where(Comparable.id == comparable_id)
            .values(**multiples)
            .returning(Comparable)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def delete(self, comparable_id: uuid.UUID) -> bool:
        stmt = delete(Comparable).where(Comparable.id == comparable_id)
        result = await self._session.execute(stmt)
        return result.rowcount > 0  # type: ignore[return-value]

    async def get_sector_medians(
        self, sector: str | None = None
    ) -> list[dict[str, Any]]:
        """Compute AVG multiples grouped by sector.

        Returns list of dicts: {sector, company_count, median_ev_ebitda, ...}
        Note: PostgreSQL doesn't have a native MEDIAN aggregate without extensions;
        we use AVG here as a practical proxy. For true median, use percentile_cont
        in a raw SQL migration or add the stats extension.
        """
        stmt = select(
            Comparable.sector,
            func.count().label("company_count"),
            func.avg(Comparable.ev_ebitda).label("median_ev_ebitda"),
            func.avg(Comparable.ev_revenue).label("median_ev_revenue"),
            func.avg(Comparable.pe_ratio).label("median_pe_ratio"),
            func.avg(Comparable.ev_ebit).label("median_ev_ebit"),
        ).group_by(Comparable.sector)

        if sector is not None:
            stmt = stmt.where(Comparable.sector == sector)

        rows = await self._session.execute(stmt)

        def _dec(val: Any) -> Decimal | None:
            return Decimal(str(val)).quantize(Decimal("0.01")) if val is not None else None

        return [
            {
                "sector": row.sector,
                "company_count": row.company_count,
                "median_ev_ebitda": _dec(row.median_ev_ebitda),
                "median_ev_revenue": _dec(row.median_ev_revenue),
                "median_pe_ratio": _dec(row.median_pe_ratio),
                "median_ev_ebit": _dec(row.median_ev_ebit),
            }
            for row in rows
        ]
