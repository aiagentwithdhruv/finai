"""Deal ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Deal(Base, TimestampMixin):
    __tablename__ = "deals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    deal_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="ma", index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="sourcing", index=True
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_close_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    deal_value: Mapped[float | None] = mapped_column(Float, nullable=True)
    assigned_team: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True
    )
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
