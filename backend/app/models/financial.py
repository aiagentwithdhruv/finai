"""Financial statement ORM model."""

from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class FinancialStatement(Base, TimestampMixin):
    __tablename__ = "financial_statements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    period_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_end: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="GBP")

    # Income statement
    revenue: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    cost_of_sales: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    gross_profit: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    ebitda: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    operating_profit: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_income: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Balance sheet
    total_assets: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    total_liabilities: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    net_debt: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    equity: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)

    # Cash flow
    cash_from_operations: Mapped[Decimal | None] = mapped_column(
        Numeric(20, 2), nullable=True
    )
    capex: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
    free_cash_flow: Mapped[Decimal | None] = mapped_column(Numeric(20, 2), nullable=True)
