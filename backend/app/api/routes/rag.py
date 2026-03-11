"""
RAG chat route — single POST /chat endpoint.
Business logic in ChatService.
"""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", status_code=status.HTTP_200_OK)
async def chat(
    body: ChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict:
    """
    Answer a financial question using RAG over ingested documents.

    - Embeds the query and retrieves top-k relevant chunks via pgvector
    - Generates a grounded answer with mandatory source citations
    - Returns confidence score and all cited sources
    """
    try:
        svc = ChatService(settings=settings, db_session=db)

        # Extract scope from the linter-improved ChatRequest schema
        company_id: uuid.UUID | None = None
        deal_id: uuid.UUID | None = None
        document_id: uuid.UUID | None = None

        scope_type = getattr(body, "scope_type", None)
        scope_id = getattr(body, "scope_id", None)

        if scope_type and scope_id:
            if str(scope_type) == "company":
                company_id = scope_id
            elif str(scope_type) == "deal":
                deal_id = scope_id
            elif str(scope_type) == "document":
                document_id = scope_id

        result = await svc.chat(
            message=body.message,
            conversation_history=[
                {"role": m.role, "content": m.content}
                for m in (getattr(body, "conversation_history", None) or [])
            ] if hasattr(body, "conversation_history") else None,
            company_id=company_id,
            deal_id=deal_id,
            document_id=document_id,
            top_k=body.top_k,
            actor=str(request.client.host) if request.client else None,
        )
        return result
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error_code": "CHAT_ERROR", "message": str(exc)},
        )
