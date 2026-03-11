"""Pydantic v2 request/response schemas."""

from app.schemas.audit import AuditLogListResponse, AuditLogResponse
from app.schemas.chat import ChatRequest, ChatResponse, ChatScopeType, SourceCitation
from app.schemas.common import (
    ErrorDetail,
    ErrorResponse,
    HealthResponse,
    PageMeta,
    PaginationParams,
)
from app.schemas.comparable import (
    ComparableCreate,
    ComparableListResponse,
    ComparableResponse,
    MultiplesDict,
    SectorMedians,
)
from app.schemas.company import (
    CompanyCreate,
    CompanyListResponse,
    CompanyLookupRequest,
    CompanyResponse,
)
from app.schemas.deal import (
    DealCreate,
    DealListResponse,
    DealResponse,
    DealStatus,
    DealType,
    DealUpdate,
    PipelineSummary,
)
from app.schemas.document import (
    DocumentChunkResponse,
    DocumentListResponse,
    DocumentResponse,
    DocumentStatus,
    DocumentType,
    DocumentUploadResponse,
)
from app.schemas.financial import (
    FinancialListResponse,
    FinancialStatementResponse,
    FinancialSummary,
)
from app.schemas.material import (
    GenerateRequest,
    MaterialApproval,
    MaterialListResponse,
    MaterialResponse,
    MaterialStatus,
    MaterialType,
)

__all__ = [
    # common
    "ErrorDetail",
    "ErrorResponse",
    "HealthResponse",
    "PageMeta",
    "PaginationParams",
    # audit
    "AuditLogListResponse",
    "AuditLogResponse",
    # chat
    "ChatRequest",
    "ChatResponse",
    "ChatScopeType",
    "SourceCitation",
    # comparable
    "ComparableCreate",
    "ComparableListResponse",
    "ComparableResponse",
    "MultiplesDict",
    "SectorMedians",
    # company
    "CompanyCreate",
    "CompanyListResponse",
    "CompanyLookupRequest",
    "CompanyResponse",
    # deal
    "DealCreate",
    "DealListResponse",
    "DealResponse",
    "DealStatus",
    "DealType",
    "DealUpdate",
    "PipelineSummary",
    # document
    "DocumentChunkResponse",
    "DocumentListResponse",
    "DocumentResponse",
    "DocumentStatus",
    "DocumentType",
    "DocumentUploadResponse",
    # financial
    "FinancialListResponse",
    "FinancialStatementResponse",
    "FinancialSummary",
    # material
    "GenerateRequest",
    "MaterialApproval",
    "MaterialListResponse",
    "MaterialResponse",
    "MaterialStatus",
    "MaterialType",
]
