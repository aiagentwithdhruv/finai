"""
Document type classifier.

Uses the configured classifier model to classify financial documents into
one of several predefined categories. Fast, cheap, and accurate for this task.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from app.core.config import get_settings
from app.core.llm_client import llm_complete

logger = logging.getLogger(__name__)

# Document types the classifier can return
DOCUMENT_TYPES = [
    "financial_statement",
    "credit_memo",
    "teaser",
    "legal",
    "management_accounts",
    "presentation",
    "other",
]

_SYSTEM_PROMPT = """You are a financial document classification expert at a UK advisory firm.
Classify documents into exactly one of these types:
- financial_statement: Annual reports, audited accounts, balance sheets, P&L, cash flow statements
- credit_memo: Credit analysis, lending proposals, risk assessment memos
- teaser: Deal teasers, information memoranda, anonymous company summaries for M&A
- legal: Shareholder agreements, facility agreements, NDAs, legal opinions
- management_accounts: Monthly/quarterly management accounts, board packs, internal financials
- presentation: Pitch decks, investor presentations, board slides
- other: Does not fit any of the above

Respond ONLY with a JSON object: {"doc_type": "<type>", "confidence": <0.0-1.0>, "reasoning": "<brief>"}"""


async def classify_document(
    text_sample: str,
) -> dict[str, Any]:
    """
    Classify a financial document by its text content.

    Args:
        text_sample: A representative text sample from the document
                     (typically first 2000 characters or first few pages).

    Returns:
        {
            "doc_type": str,      # one of DOCUMENT_TYPES
            "confidence": float,  # 0.0-1.0
            "reasoning": str,     # brief explanation
        }

    Falls back to {"doc_type": "other", "confidence": 0.0} on any error.
    """
    if not text_sample or not text_sample.strip():
        return {"doc_type": "other", "confidence": 0.0, "reasoning": "Empty document"}

    sample = text_sample[:2000].strip()
    settings = get_settings()

    try:
        llm_result = await llm_complete(
            model=settings.classifier_model,
            system=_SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Classify this financial document:\n\n{sample}",
                }
            ],
            max_tokens=256,
            temperature=0.0,
        )

        raw_text = llm_result["text"]

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
            raw_text = raw_text.strip()

        result = json.loads(raw_text)

        # Validate and normalise
        doc_type = result.get("doc_type", "other")
        if doc_type not in DOCUMENT_TYPES:
            doc_type = "other"

        confidence = float(result.get("confidence", 0.5))
        confidence = max(0.0, min(1.0, confidence))

        return {
            "doc_type": doc_type,
            "confidence": confidence,
            "reasoning": result.get("reasoning", ""),
        }

    except json.JSONDecodeError as exc:
        logger.warning("Classifier returned non-JSON response", extra={"error": str(exc)})
        return {"doc_type": "other", "confidence": 0.0, "reasoning": "Parse error"}

    except Exception as exc:
        logger.error("Document classification failed", extra={"error": str(exc)})
        return {"doc_type": "other", "confidence": 0.0, "reasoning": f"Error: {exc}"}
