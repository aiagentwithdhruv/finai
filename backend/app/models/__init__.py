"""
SQLAlchemy model registry.

Import every model here so that:
  1. Base.metadata.create_all() can see all table definitions.
  2. Alembic autogenerate detects all models.
  3. Relationship back-references resolve without ImportError.

Order: models with no foreign key dependencies first.
"""

from app.models.base import Base, BaseModel, TimestampMixin, UUIDPrimaryKeyMixin  # noqa: F401
from app.models.company import Company  # noqa: F401
from app.models.financial import FinancialStatement  # noqa: F401
from app.models.comparable import Comparable  # noqa: F401
from app.models.deal import Deal  # noqa: F401
from app.models.document import Document, DocumentChunk, EMBEDDING_DIM  # noqa: F401
from app.models.material import Material  # noqa: F401
from app.models.audit import AuditLog  # noqa: F401

__all__ = [
    "Base",
    "BaseModel",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "Company",
    "FinancialStatement",
    "Comparable",
    "Deal",
    "Document",
    "DocumentChunk",
    "EMBEDDING_DIM",
    "Material",
    "AuditLog",
]
