"""Company ORM model."""

from __future__ import annotations

import uuid
from datetime import date

from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company_number: Mapped[str | None] = mapped_column(
        String(20), nullable=True, unique=True, index=True
    )
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    country: Mapped[str] = mapped_column(String(3), nullable=False, default="GB")
    registered_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    incorporation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    company_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
