"""
CreditMemoGenerator — generates credit memo narrative using LLM + deterministic ratios.

Architecture:
  - Ratio calculations are INJECTED from ratios.py (deterministic code)
  - LLM generates ONLY narrative sections (borrower profile, risk assessment, recommendation)
  - Financial tables are built from code, never from LLM output
  - Source attributions are required for every factual claim

This enforces the CLAUDE.md rule:
    "Ratio calculations are CODE, not LLM — never let the LLM calculate EBITDA margins"
"""

from __future__ import annotations

import json
import logging
from decimal import Decimal
from typing import Any

from app.core.config import get_settings
from app.core.llm_client import llm_complete
from app.pipelines.generation.ratios import calculate_ratios, ratios_to_display_dict

logger = logging.getLogger(__name__)

_MAX_TOKENS = 3000

_SYSTEM_PROMPT = """You are a senior credit analyst at a UK advisory firm.

You are generating narrative sections for a credit memorandum.

CRITICAL RULES:
1. Only generate the NARRATIVE sections (borrower profile, risk assessment, recommendation).
2. Do NOT generate or modify any financial figures, ratios, or tables — these are injected separately.
3. Reference provided financial data to support your narrative but NEVER calculate ratios yourself.
4. Every claim about the company must reference the provided financial data or source documents.
5. Use professional, formal UK financial advisory language.
6. Flag any data gaps or inconsistencies explicitly.
7. The recommendation must be supported by specific evidence from the financial data.

Structure your output as valid JSON with these exact keys:
{
  "borrower_profile": "...",
  "financial_overview": "...",
  "risk_assessment": "...",
  "mitigating_factors": "...",
  "recommendation": "...",
  "conditions_precedent": "..."
}"""


class CreditMemoGenerator:
    """
    Generates credit memo documents with LLM narrative + code-calculated ratios.

    Usage::

        generator = CreditMemoGenerator()
        memo = await generator.generate(
            company_name="Acme Ltd",
            financials_data=[{...}, {...}],
            ratios=calculated_ratios_dict,
            comparables=[...],
        )
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    async def generate(
        self,
        company_name: str,
        financials_data: list[dict[str, Any]],
        ratios: dict[str, Any],
        comparables: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        # Build the deterministic financial tables (never from LLM)
        financial_tables = self._build_financial_tables(financials_data, ratios)

        # Build the prompt context
        context = self._build_prompt_context(
            company_name=company_name,
            financials_data=financials_data,
            ratios=ratios,
            financial_tables=financial_tables,
            comparables=comparables,
        )

        # LLM generates ONLY narrative text
        result = await llm_complete(
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": context}],
            max_tokens=_MAX_TOKENS,
            temperature=0.3,
        )

        sections = self._parse_sections(result["text"])

        # Approximate cost tracking (varies by model)
        cost_usd = (result["prompt_tokens"] * 0.000003) + (result["completion_tokens"] * 0.000015)

        return {
            "company_name": company_name,
            "sections": sections,
            "financial_tables": financial_tables,
            "sources": [
                {"type": "financial_data", "description": "Provided financial statements"},
            ],
            "model_used": result["model_used"],
            "prompt_tokens": result["prompt_tokens"],
            "completion_tokens": result["completion_tokens"],
            "generation_cost_usd": round(cost_usd, 6),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_financial_tables(
        self,
        financials_data: list[dict[str, Any]],
        ratios: dict[str, Any],
    ) -> dict[str, Any]:
        """Build structured financial tables from deterministic data."""
        income_rows = []
        for period in sorted(financials_data, key=lambda x: x.get("period_end", ""), reverse=True):
            income_rows.append(
                {
                    "period": str(period.get("period_end", "N/A")),
                    "revenue": _fmt_currency(period.get("revenue")),
                    "gross_profit": _fmt_currency(period.get("gross_profit")),
                    "ebitda": _fmt_currency(period.get("ebitda")),
                    "net_income": _fmt_currency(period.get("net_income")),
                    "net_debt": _fmt_currency(period.get("net_debt")),
                }
            )

        display_ratios = ratios_to_display_dict(
            {k: Decimal(str(v)) if v is not None else None for k, v in ratios.items()}
        )

        return {
            "income_statement": income_rows,
            "key_ratios": display_ratios,
        }

    def _build_prompt_context(
        self,
        company_name: str,
        financials_data: list[dict[str, Any]],
        ratios: dict[str, Any],
        financial_tables: dict[str, Any],
        comparables: list[dict[str, Any]] | None,
    ) -> str:
        lines = [
            f"Generate a credit memorandum for: {company_name}",
            "",
            "=== FINANCIAL SUMMARY (code-calculated, do not modify) ===",
        ]

        for key, val in financial_tables["key_ratios"].items():
            lines.append(f"  {key.replace('_', ' ').title()}: {val}")

        lines.append("")
        lines.append("=== INCOME STATEMENT DATA ===")
        for row in financial_tables["income_statement"]:
            lines.append(
                f"  {row['period']}: Revenue {row['revenue']}, EBITDA {row['ebitda']}, "
                f"Net Income {row['net_income']}, Net Debt {row['net_debt']}"
            )

        if comparables:
            lines.append("")
            lines.append("=== COMPARABLE COMPANIES ===")
            for comp in comparables[:5]:
                lines.append(
                    f"  {comp.get('name', 'N/A')} ({comp.get('ticker', 'N/A')}): "
                    f"EV/EBITDA {comp.get('ev_ebitda', 'N/A')}x, "
                    f"EV/Revenue {comp.get('ev_revenue', 'N/A')}x"
                )

        lines.append("")
        lines.append(
            "Generate the narrative sections. "
            "Reference the above data to support your analysis. "
            "Return valid JSON only."
        )

        return "\n".join(lines)

    def _parse_sections(self, raw_text: str) -> dict[str, str]:
        text = raw_text
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
            text = text.strip()

        try:
            data = json.loads(text)
            return {
                "borrower_profile": data.get("borrower_profile", ""),
                "financial_overview": data.get("financial_overview", ""),
                "risk_assessment": data.get("risk_assessment", ""),
                "mitigating_factors": data.get("mitigating_factors", ""),
                "recommendation": data.get("recommendation", ""),
                "conditions_precedent": data.get("conditions_precedent", ""),
            }
        except json.JSONDecodeError:
            logger.warning("Credit memo LLM returned non-JSON — using raw text as fallback")
            return {
                "borrower_profile": raw_text,
                "financial_overview": "",
                "risk_assessment": "",
                "mitigating_factors": "",
                "recommendation": "",
                "conditions_precedent": "",
            }


def _fmt_currency(value: Any) -> str:
    """Format a currency value as a string with GBP sign."""
    if value is None:
        return "N/A"
    try:
        d = Decimal(str(value))
        return f"\u00a3{int(d):,}"
    except Exception:
        return str(value)
