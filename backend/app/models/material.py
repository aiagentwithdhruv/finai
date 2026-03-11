"""Generated material ORM model."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class Material(Base, TimestampMixin):
    __tablename__ = "materials"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    deal_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("deals.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    material_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="generating", index=True
    )
    title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Structured content stored as JSON
    content: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    source_document_ids: Mapped[list[str] | None] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=True
    )
    model_used: Mapped[str | None] = mapped_column(String(100), nullable=True)
    generation_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Human review tracking
    reviewed_by: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    review_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
