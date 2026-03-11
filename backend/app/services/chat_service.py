"""
ChatService — business logic for the RAG chat pipeline.

Orchestrates:
  1. RAGRetriever embeds the query and fetches top-k relevant chunks
  2. RAGChat generates a grounded answer with source citations
  3. AuditRepository logs the interaction
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.pipelines.rag.chat import RAGChat
from app.pipelines.rag.retriever import RAGRetriever
from app.repositories.audit_repo import AuditRepository

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self, settings: Settings, db_session: AsyncSession) -> None:
        self._settings = settings
        self._db = db_session
        self._retriever = RAGRetriever()
        self._chat = RAGChat()
        self._audit = AuditRepository(db_session)

    async def chat(
        self,
        message: str,
        conversation_history: list[dict[str, str]] | None = None,
        company_id: uuid.UUID | None = None,
        deal_id: uuid.UUID | None = None,
        document_id: uuid.UUID | None = None,
        top_k: int = 5,
        actor: str | None = None,
    ) -> dict[str, Any]:
        """
        Answer a financial question using RAG.

        Returns:
            {
                "answer": str,
                "sources": list,
                "confidence": str,
                "retrieved_chunks": int,
                "model_used": str,
                "conversation_id": UUID,
                "message_id": UUID,
            }
        """
        conversation_id = uuid.uuid4()
        message_id = uuid.uuid4()

        # Step 1: Retrieve relevant chunks
        chunks = await self._retriever.retrieve(
            query=message,
            db_session=self._db,
            top_k=top_k,
            company_id=company_id,
            deal_id=deal_id,
            document_id=document_id,
        )

        # Step 2: Generate answer
        result = await self._chat.answer(
            message=message,
            retrieved_chunks=chunks,
            conversation_history=conversation_history,
        )

        # Step 3: Audit log
        try:
            await self._audit.log(
                {
                    "actor": actor or "anonymous",
                    "action": "rag.query",
                    "entity_type": "document",
                    "status": "success",
                    "model_used": result.get("model_used"),
                    "prompt_tokens": result.get("prompt_tokens"),
                    "completion_tokens": result.get("completion_tokens"),
                    "details": {
                        "query": message[:200],
                        "chunks_retrieved": len(chunks),
                        "confidence": result.get("confidence"),
                        "company_id": str(company_id) if company_id else None,
                        "deal_id": str(deal_id) if deal_id else None,
                    },
                }
            )
        except Exception as e:
            logger.warning("Audit log failed for chat", extra={"error": str(e)})

        return {
            "answer": result["answer"],
            "sources": result["sources"],
            "confidence": result["confidence"],
            "retrieved_chunks": len(chunks),
            "model_used": result["model_used"],
            "conversation_id": conversation_id,
            "message_id": message_id,
            "created_at": datetime.now(timezone.utc),
        }
