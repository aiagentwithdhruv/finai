"""
GenerationService — orchestrates material generation.

Routes generation requests to the appropriate generator:
  - "teaser"         → TeaserGenerator
  - "credit_memo"    → CreditMemoGenerator
  - "company_profile"→ CreditMemoGenerator (simplified, without credit sections)
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.pipelines.generation.credit_memo import CreditMemoGenerator
from app.pipelines.generation.ratios import calculate_ratios
from app.pipelines.generation.teaser import TeaserGenerator
from app.repositories.audit_repo import AuditRepository
from app.repositories.company_repo import CompanyRepository
from app.repositories.financial_repo import FinancialRepository
from app.repositories.material_repo import MaterialRepository

logger = logging.getLogger(__name__)


class GenerationService:
    def __init__(self, settings: Settings, db_session: AsyncSession) -> None:
        self._settings = settings
        self._db = db_session
        self._company_repo = CompanyRepository(db_session)
        self._financial_repo = FinancialRepository(db_session)
        self._material_repo = MaterialRepository(db_session)
        self._audit_repo = AuditRepository(db_session)

    async def generate_material(
        self,
        material_type: str,
        company_id: uuid.UUID,
        deal_id: uuid.UUID | None = None,
        title: str | None = None,
        inputs: dict[str, Any] | None = None,
        actor: str | None = None,
    ) -> Any:
        """
        Generate a financial advisory document.

        Args:
            material_type: "teaser" | "credit_memo" | "company_profile"
            company_id:    Company to generate for.
            deal_id:       Optional deal context.
            title:         Title for the generated document.
            inputs:        Additional type-specific inputs.
            actor:         User who triggered the generation.

        Returns:
            Material ORM object (status="draft").
        """
        inputs = inputs or {}

        # ------------------------------------------------------------------
        # Fetch required data
        # ------------------------------------------------------------------
        company = await self._company_repo.get_by_id(company_id)
        if company is None:
            raise ValueError(f"Company {company_id} not found")

        financials_objs, _ = await self._financial_repo.get_by_company(company_id)
        financials_data = [
            {
                "period_end": str(fs.period_end),
                "period_start": str(fs.period_start) if fs.period_start else None,
                "currency": fs.currency,
                "revenue": float(fs.revenue) if fs.revenue is not None else None,
                "gross_profit": float(fs.gross_profit) if fs.gross_profit is not None else None,
                "ebitda": float(fs.ebitda) if fs.ebitda is not None else None,
                "net_income": float(fs.net_income) if fs.net_income is not None else None,
                "total_assets": float(fs.total_assets) if fs.total_assets is not None else None,
                "total_liabilities": float(fs.total_liabilities) if fs.total_liabilities is not None else None,
                "net_debt": float(fs.net_debt) if fs.net_debt is not None else None,
                "equity": float(fs.equity) if fs.equity is not None else None,
                "cash_from_operations": float(fs.cash_from_operations) if fs.cash_from_operations is not None else None,
            }
            for fs in financials_objs
        ]

        # Pre-calculate ratios from the most recent period (deterministic code)
        ratios: dict[str, Any] = {}
        if financials_data:
            latest = sorted(financials_data, key=lambda x: x.get("period_end", ""), reverse=True)[0]
            ratios = {
                k: float(v) if v is not None else None
                for k, v in calculate_ratios(
                    revenue=latest.get("revenue"),
                    ebitda=latest.get("ebitda"),
                    net_income=latest.get("net_income"),
                    gross_profit=latest.get("gross_profit"),
                    total_assets=latest.get("total_assets"),
                    total_liabilities=latest.get("total_liabilities"),
                    net_debt=latest.get("net_debt"),
                    equity=latest.get("equity"),
                ).items()
            }

        company_data = {
            "name": company.name,
            "sector": company.sector,
            "country": company.country,
            "status": company.company_status,
            "description": company.description,
            "website": company.website,
        }

        # ------------------------------------------------------------------
        # Route to the correct generator
        # ------------------------------------------------------------------
        generated_content: dict[str, Any] = {}
        prompt_tokens = 0
        completion_tokens = 0
        generation_cost_usd = 0.0
        model_used = ""

        if material_type == "credit_memo":
            generator = CreditMemoGenerator()
            result = await generator.generate(
                company_name=company.name,
                financials_data=financials_data,
                ratios=ratios,
                comparables=inputs.get("comparables"),
            )
            generated_content = result
            model_used = result.get("model_used", "")
            prompt_tokens = result.get("prompt_tokens", 0)
            completion_tokens = result.get("completion_tokens", 0)
            generation_cost_usd = result.get("generation_cost_usd", 0.0)

        elif material_type in ("teaser", "company_profile"):
            generator = TeaserGenerator()
            result = await generator.generate(
                company_name=company.name,
                company_data=company_data,
                financials=financials_data,
                deal_type=inputs.get("deal_type", "ma"),
                highlights=inputs.get("highlights", []),
                anonymize=inputs.get("anonymize", True) if material_type == "teaser" else False,
                codename=inputs.get("codename"),
            )
            generated_content = result
            model_used = result.get("model_used", "")
            prompt_tokens = result.get("prompt_tokens", 0)
            completion_tokens = result.get("completion_tokens", 0)
            generation_cost_usd = result.get("generation_cost_usd", 0.0)

        else:
            raise ValueError(f"Unknown material_type: {material_type}")

        # ------------------------------------------------------------------
        # Persist the generated material
        # ------------------------------------------------------------------
        material = await self._material_repo.create(
            {
                "company_id": company_id,
                "deal_id": deal_id,
                "material_type": material_type,
                "status": "draft",
                "title": title or f"{material_type.replace('_', ' ').title()} — {company.name}",
                "content": generated_content,
                "model_used": model_used,
                "generation_notes": inputs.get("generation_notes"),
                "version": 1,
            }
        )

        # ------------------------------------------------------------------
        # Audit log
        # ------------------------------------------------------------------
        try:
            await self._audit_repo.log(
                {
                    "actor": actor or "system",
                    "action": "generation.create",
                    "entity_type": "material",
                    "entity_id": material.id,
                    "status": "success",
                    "model_used": model_used,
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "cost_usd": generation_cost_usd,
                    "details": {
                        "material_type": material_type,
                        "company_id": str(company_id),
                        "deal_id": str(deal_id) if deal_id else None,
                    },
                }
            )
        except Exception as e:
            logger.warning("Audit log failed for generation", extra={"error": str(e)})

        return material

    async def approve_material(
        self,
        material_id: uuid.UUID,
        approved: bool,
        reviewer: str,
        notes: str | None = None,
    ) -> Any:
        """
        Apply human review decision (approve or reject).

        Human review gate is enforced here — no material can be
        marked 'approved' without this method being called.
        """
        from datetime import datetime, timezone

        new_status = "approved" if approved else "rejected"
        material = await self._material_repo.update_status(
            material_id=material_id,
            status=new_status,
            extra={
                "reviewed_by": reviewer,
                "reviewed_at": datetime.now(timezone.utc),
                "review_notes": notes,
            },
        )

        if material is None:
            raise ValueError(f"Material {material_id} not found")

        # Audit the approval decision
        try:
            await self._audit_repo.log(
                {
                    "actor": reviewer,
                    "action": "generation.approve" if approved else "generation.reject",
                    "entity_type": "material",
                    "entity_id": material_id,
                    "status": "success",
                    "details": {
                        "approved": approved,
                        "notes": notes,
                    },
                }
            )
        except Exception as e:
            logger.warning("Audit log failed for approval", extra={"error": str(e)})

        return material
