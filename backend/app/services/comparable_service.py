"""
ComparableService — manages public company comparables from yfinance.

yfinance is the primary data source for:
  - Trailing multiples (EV/EBITDA, EV/Revenue, P/E)
  - Market cap and enterprise value
  - Sector / industry classification
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import yfinance as yf
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.comparable_repo import ComparableRepository

logger = logging.getLogger(__name__)


def _safe_decimal(value: Any) -> Decimal | None:
    """Safely convert a value to Decimal, returning None on failure."""
    if value is None:
        return None
    try:
        f = float(value)
        if not (f == f):  # NaN check
            return None
        return Decimal(str(round(f, 4)))
    except (TypeError, ValueError, Exception):
        return None


def fetch_company_data_yfinance(ticker: str) -> dict[str, Any]:
    """
    Fetch company data from yfinance.

    Returns a dict with all available fields, or raises on failure.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
    except Exception as exc:
        raise ValueError(f"yfinance lookup failed for '{ticker}': {exc}") from exc

    if not info or info.get("symbol") is None:
        raise ValueError(f"Ticker '{ticker}' not found or returned empty data")

    # Extract key fields with safe defaults
    market_cap = _safe_decimal(info.get("marketCap"))
    enterprise_value = _safe_decimal(info.get("enterpriseValue"))
    revenue_ttm = _safe_decimal(info.get("totalRevenue"))
    ebitda_ttm = _safe_decimal(info.get("ebitda"))
    net_income_ttm = _safe_decimal(info.get("netIncomeToCommon"))

    # Multiples — prefer direct fields, compute from EV/financials as fallback
    ev_ebitda = _safe_decimal(info.get("enterpriseToEbitda"))
    ev_revenue = _safe_decimal(info.get("enterpriseToRevenue"))
    pe_ratio = _safe_decimal(info.get("trailingPE"))
    price_to_book = _safe_decimal(info.get("priceToBook"))

    # EBITDA margin (code-calculated, not from yfinance)
    ebitda_margin = None
    if ebitda_ttm and revenue_ttm and revenue_ttm != 0:
        ebitda_margin = _safe_decimal(float(ebitda_ttm) / float(revenue_ttm))

    # Map to Comparable model field names
    # (only include fields that exist on the ORM model)
    return {
        "ticker": ticker.upper(),
        "exchange": info.get("exchange", ""),
        "name": info.get("longName") or info.get("shortName") or ticker,
        "sector": info.get("sector", "Other"),
        "market_cap": market_cap,
        "currency": info.get("currency", "USD"),
        "ev_ebitda": ev_ebitda,
        "ev_revenue": ev_revenue,
        "pe_ratio": pe_ratio,
        # ev_ebit not directly available from yfinance; leave None
        "ev_ebit": None,
        "notes": None,
        "last_refreshed_at": datetime.now(timezone.utc),
    }


class ComparableService:
    """
    Service for managing comparable company data.

    Data lifecycle:
        1. User adds ticker via POST /comps
        2. Service fetches data from yfinance and persists
        3. Daily scheduled task calls refresh_all()
    """

    def __init__(self, db_session: AsyncSession) -> None:
        self._db = db_session
        self._repo = ComparableRepository(db_session)

    async def add_company(self, ticker: str) -> Any:
        """
        Add a company to the comparables list by ticker symbol.

        Fetches data from yfinance immediately on add.

        Returns:
            Comparable ORM object.
        """
        ticker = ticker.strip().upper()

        # Fetch from yfinance (raises ValueError if not found)
        data = fetch_company_data_yfinance(ticker)

        # Create or update in DB
        comparable = await self._repo.create(data)
        logger.info("Added comparable", extra={"ticker": ticker, "name": data.get("name")})
        return comparable

    async def refresh_all(self) -> dict[str, Any]:
        """
        Refresh yfinance data for all comparables.

        Returns:
            {"refreshed": int, "failed": int, "errors": [...]}
        """
        comparables, _ = await self._repo.list()
        refreshed = 0
        failed = 0
        errors = []

        for comp in comparables:
            try:
                fresh_data = fetch_company_data_yfinance(comp.ticker)
                await self._repo.update_multiples(
                    comparable_id=comp.id,
                    multiples=fresh_data,
                )
                refreshed += 1
                logger.debug("Refreshed comparable", extra={"ticker": comp.ticker})
            except Exception as exc:
                failed += 1
                error_msg = str(exc)[:200]
                errors.append({"ticker": comp.ticker, "error": error_msg})
                logger.warning(
                    "Failed to refresh comparable",
                    extra={"ticker": comp.ticker, "error": error_msg},
                )
                # Log error details; we don't persist refresh_error since
                # the Comparable model doesn't carry that field.
                pass

        logger.info(
            "Comparable refresh complete",
            extra={"refreshed": refreshed, "failed": failed},
        )
        return {"refreshed": refreshed, "failed": failed, "errors": errors}

    async def list_comparables(
        self,
        sector_filter: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> dict[str, Any]:
        """
        List all comparables with sector median multiples.

        Returns:
            {
                "companies": [...],
                "sector_medians": {...},   # keyed by sector name
                "total": int,
            }
        """
        companies, total = await self._repo.list(
            sector=sector_filter,
            offset=offset,
            limit=limit,
        )

        # Compute sector medians
        medians_raw = await self._repo.get_sector_medians(sector=sector_filter)
        sector_medians = {row["sector"]: row for row in medians_raw if row.get("sector")}

        return {
            "companies": companies,
            "sector_medians": sector_medians,
            "total": total,
        }

    async def delete_comparable(self, comparable_id: Any) -> bool:
        return await self._repo.delete(comparable_id)
