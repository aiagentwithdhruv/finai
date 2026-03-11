"""Company repository — all DB access for Company entities."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.company import Company


class CompanyRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, data: dict[str, Any]) -> Company:
        company = Company(**data)
        self._session.add(company)
        await self._session.flush()
        await self._session.refresh(company)
        return company

    async def get_by_id(self, company_id: uuid.UUID) -> Company | None:
        stmt = select(Company).where(Company.id == company_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_company_number(self, company_number: str) -> Company | None:
        stmt = select(Company).where(Company.company_number == company_number)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        offset: int = 0,
        limit: int = 20,
        sector: str | None = None,
        country: str | None = None,
        company_status: str | None = None,
    ) -> tuple[list[Company], int]:
        """Return (items, total_count) for pagination."""
        base = select(Company)

        if sector is not None:
            base = base.where(Company.sector == sector)
        if country is not None:
            base = base.where(Company.country == country)
        if company_status is not None:
            base = base.where(Company.company_status == company_status)

        # Total count (without limit/offset)
        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        # Paginated rows
        items_stmt = (
            base.order_by(Company.name)
            .offset(offset)
            .limit(limit)
        )
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total

    async def update(
        self, company_id: uuid.UUID, data: dict[str, Any]
    ) -> Company | None:
        stmt = (
            update(Company)
            .where(Company.id == company_id)
            .values(**data)
            .returning(Company)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def search(
        self,
        query: str,
        *,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Company], int]:
        """Case-insensitive name/company_number search."""
        pattern = f"%{query}%"
        base = select(Company).where(
            or_(
                Company.name.ilike(pattern),
                Company.company_number.ilike(pattern),
            )
        )

        count_stmt = select(func.count()).select_from(base.subquery())
        total: int = (await self._session.execute(count_stmt)).scalar_one()

        items_stmt = base.order_by(Company.name).offset(offset).limit(limit)
        rows = await self._session.execute(items_stmt)
        return list(rows.scalars().all()), total
