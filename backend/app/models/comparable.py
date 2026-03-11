"""Comparable company ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Comparable(Base, TimestampMixin):
    __tablename__ = "comparables"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    ticker: Mapped[str] = mapped_column(
        String(20), nullable=False, unique=True, index=True
    )
    exchange: Mapped[str] = mapped_column(String(20), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sector: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    market_cap: Mapped[Decimal | None] = mapped_column(Numeric(24, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    # Trading multiples — stored flat for easy AVG aggregation
    ev_ebitda: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    ev_revenue: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    pe_ratio: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    ev_ebit: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_refreshed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
