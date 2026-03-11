"""
TeaserGenerator — generates deal teasers for M&A / debt advisory mandates.

A deal teaser is an anonymous (or named) 1-5 page document that provides:
  - Executive summary
  - Business overview
  - Financial highlights (with sourced figures)
  - Deal rationale

When anonymize=True, the company name is replaced with a project codename
(e.g. "Project Apollo") and identifying details are masked.
"""

from __future__ import annotations

import json
import logging
import random
from typing import Any

from app.core.config import get_settings
from app.core.llm_client import llm_complete

logger = logging.getLogger(__name__)

_MAX_TOKENS = 3000

# Codename pools for anonymous teasers
_CODENAME_PREFIXES = [
    "Apollo", "Atlas", "Aurora", "Beacon", "Catalyst", "Citadel",
    "Compass", "Crown", "Diamond", "Eagle", "Eclipse", "Falcon",
    "Genesis", "Horizon", "Keystone", "Lighthouse", "Mercury",
    "Monarch", "Neptune", "Nexus", "Orion", "Phoenix", "Pinnacle",
    "Pioneer", "Prism", "Quantum", "Raven", "Sapphire", "Titan",
    "Vector", "Vanguard", "Zenith",
]

_SYSTEM_PROMPT = """You are a senior M&A advisor at a UK financial advisory firm.

You are generating a deal teaser — a professional, concise document used in M&A / debt advisory processes.

CRITICAL RULES:
1. Keep language professional, formal, and commercially precise.
2. Do NOT include specific financial figures unless they are provided in the context below.
3. Every financial figure cited must come from the provided financial data.
4. If anonymized, NEVER reveal the company's actual name or identifying details.
5. Use UK English and UK financial conventions (£ not $, EV/EBITDA multiples, etc.).
6. Structure: Executive Summary → Business Overview → Financial Highlights → Deal Rationale.

Return valid JSON with these exact keys:
{
  "executive_summary": "...",
  "business_overview": "...",
  "financial_highlights": "...",
  "deal_rationale": "...",
  "investment_considerations": "..."
}"""


class TeaserGenerator:
    """
    Generates deal teasers with optional company anonymisation.

    Usage::

        generator = TeaserGenerator(api_key=settings.anthropic_api_key)
        teaser = await generator.generate(
            company_name="Acme Software Ltd",
            company_data={...},
            financials=[{...}],
            deal_type="ma",
            highlights=["Market leader in B2B SaaS", "Strong recurring revenue"],
            anonymize=True,
        )
    """

    def __init__(self) -> None:
        self._settings = get_settings()

    async def generate(
        self,
        company_name: str,
        company_data: dict[str, Any],
        financials: list[dict[str, Any]],
        deal_type: str = "ma",
        highlights: list[str] | None = None,
        anonymize: bool = True,
        codename: str | None = None,
    ) -> dict[str, Any]:
        """
        Generate a deal teaser document.

        Args:
            company_name:  The actual company name.
            company_data:  Company profile dict (sector, description, country, etc.)
            financials:    List of financial period dicts (revenue, ebitda, net_debt, etc.)
            deal_type:     "ma" | "debt" | "equity"
            highlights:    Key investment highlights to include.
            anonymize:     If True, replace company name with a project codename.
            codename:      Custom codename. If None and anonymize=True, auto-generate.

        Returns:
            {
                "display_name": str,   # "The Company" or "Project Apollo" or actual name
                "codename": str | None,
                "sections": {
                    "executive_summary": str,
                    "business_overview": str,
                    "financial_highlights": str,
                    "deal_rationale": str,
                    "investment_considerations": str,
                },
                "financial_summary": {...},  # structured, code-generated
                "model_used": str,
                "prompt_tokens": int,
                "completion_tokens": int,
                "generation_cost_usd": float,
            }
        """
        # Determine display name
        if anonymize:
            if codename:
                display_name = f"Project {codename}"
            else:
                codename = random.choice(_CODENAME_PREFIXES)
                display_name = f"Project {codename}"
        else:
            display_name = company_name
            codename = None

        # Build financial summary (code-generated, not LLM)
        financial_summary = self._build_financial_summary(financials)

        # Build prompt context
        context = self._build_prompt_context(
            display_name=display_name,
            company_data=company_data,
            financials=financials,
            financial_summary=financial_summary,
            deal_type=deal_type,
            highlights=highlights or [],
            anonymize=anonymize,
        )

        result = await llm_complete(
            system=_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": context}],
            max_tokens=_MAX_TOKENS,
            temperature=0.4,
        )

        sections = self._parse_sections(result["text"])
        cost_usd = (result["prompt_tokens"] * 0.000003) + (result["completion_tokens"] * 0.000015)

        return {
            "display_name": display_name,
            "codename": codename,
            "sections": sections,
            "financial_summary": financial_summary,
            "model_used": result["model_used"],
            "prompt_tokens": result["prompt_tokens"],
            "completion_tokens": result["completion_tokens"],
            "generation_cost_usd": round(cost_usd, 6),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_financial_summary(self, financials: list[dict[str, Any]]) -> dict[str, Any]:
        """Build a code-generated financial summary table (never from LLM)."""
        if not financials:
            return {}

        # Sort by period_end descending — most recent first
        sorted_fin = sorted(
            financials,
            key=lambda x: str(x.get("period_end", "")),
            reverse=True,
        )

        latest = sorted_fin[0]
        summary = {
            "latest_period": str(latest.get("period_end", "N/A")),
            "revenue": latest.get("revenue"),
            "ebitda": latest.get("ebitda"),
            "net_income": latest.get("net_income"),
            "net_debt": latest.get("net_debt"),
            "total_assets": latest.get("total_assets"),
            "equity": latest.get("equity"),
            "currency": latest.get("currency", "GBP"),
        }

        # Add YoY growth if two periods available
        if len(sorted_fin) >= 2:
            prev = sorted_fin[1]
            from app.pipelines.generation.ratios import calculate_growth
            rev_growth = calculate_growth(latest.get("revenue"), prev.get("revenue"))
            summary["revenue_growth_yoy"] = str(rev_growth) if rev_growth is not None else None
            ebitda_growth = calculate_growth(latest.get("ebitda"), prev.get("ebitda"))
            summary["ebitda_growth_yoy"] = str(ebitda_growth) if ebitda_growth is not None else None

        return summary

    def _build_prompt_context(
        self,
        display_name: str,
        company_data: dict[str, Any],
        financials: list[dict[str, Any]],
        financial_summary: dict[str, Any],
        deal_type: str,
        highlights: list[str],
        anonymize: bool,
    ) -> str:
        deal_type_map = {
            "ma": "M&A (sell-side)",
            "debt": "Debt Advisory",
            "equity": "Equity Raise",
            "ipo": "IPO",
            "restructuring": "Restructuring",
        }
        deal_description = deal_type_map.get(deal_type, deal_type)

        lines = [
            f"Generate a {deal_description} deal teaser for: {display_name}",
            f"Anonymized: {'Yes — do not include any identifying information' if anonymize else 'No'}",
            "",
            "=== COMPANY INFORMATION ===",
            f"Sector: {company_data.get('sector', 'N/A')}",
            f"Country: {company_data.get('country', 'UK')}",
            f"Status: {company_data.get('status', 'Active')}",
            f"Description: {company_data.get('description', 'Not provided')}",
            "",
            "=== KEY FINANCIAL HIGHLIGHTS (code-verified figures) ===",
        ]

        for key, val in financial_summary.items():
            if val is not None:
                lines.append(f"  {key.replace('_', ' ').title()}: {val}")

        if financials:
            lines.append("")
            lines.append("=== HISTORICAL FINANCIALS ===")
            for period in sorted(financials, key=lambda x: str(x.get("period_end", "")), reverse=True)[:3]:
                lines.append(
                    f"  {period.get('period_end', 'N/A')}: "
                    f"Revenue {period.get('revenue', 'N/A')}, "
                    f"EBITDA {period.get('ebitda', 'N/A')}"
                )

        if highlights:
            lines.append("")
            lines.append("=== INVESTMENT HIGHLIGHTS (from deal team) ===")
            for hl in highlights:
                lines.append(f"  - {hl}")

        lines.append("")
        lines.append("Generate the teaser sections. Return valid JSON only.")

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
                "executive_summary": data.get("executive_summary", ""),
                "business_overview": data.get("business_overview", ""),
                "financial_highlights": data.get("financial_highlights", ""),
                "deal_rationale": data.get("deal_rationale", ""),
                "investment_considerations": data.get("investment_considerations", ""),
            }
        except json.JSONDecodeError:
            logger.warning("Teaser LLM returned non-JSON — using raw text as fallback")
            return {
                "executive_summary": raw_text,
                "business_overview": "",
                "financial_highlights": "",
                "deal_rationale": "",
                "investment_considerations": "",
            }
