"""
Financial ratio calculations — PURE PYTHON, NO LLM.

All ratio calculations in this module are deterministic:
  - Uses Python's Decimal for exact arithmetic
  - No floating-point rounding errors
  - LLM never touches these calculations (enforced by CLAUDE.md)

All public functions accept optional Decimal | None arguments and return
None if required inputs are missing, rather than raising.
"""

from __future__ import annotations

from decimal import Decimal, DivisionByZero, InvalidOperation, ROUND_HALF_UP
from typing import Any


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

_PERCENT = Decimal("100")
_PLACES_PCT = Decimal("0.01")    # 2 decimal places for percentages
_PLACES_X = Decimal("0.01")      # 2 decimal places for multiples
_PLACES_CURRENCY = Decimal("0.00")  # 0 decimal places for currency display


# ---------------------------------------------------------------------------
# Safe division helper
# ---------------------------------------------------------------------------

def _safe_div(numerator: Decimal | None, denominator: Decimal | None) -> Decimal | None:
    """Return numerator / denominator, or None if either is None or denominator is zero."""
    if numerator is None or denominator is None:
        return None
    try:
        if denominator == 0:
            return None
        return numerator / denominator
    except (DivisionByZero, InvalidOperation):
        return None


def _to_dec(value: Any) -> Decimal | None:
    """Safely coerce a value to Decimal. Returns None on failure."""
    if value is None:
        return None
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None


# ---------------------------------------------------------------------------
# Core ratio calculations
# ---------------------------------------------------------------------------

def calculate_ratios(
    revenue: Any = None,
    ebitda: Any = None,
    net_income: Any = None,
    gross_profit: Any = None,
    total_assets: Any = None,
    total_liabilities: Any = None,
    net_debt: Any = None,
    equity: Any = None,
    ebit: Any = None,
    interest_expense: Any = None,
    current_assets: Any = None,
    current_liabilities: Any = None,
    inventory: Any = None,
    cash_from_operations: Any = None,
    total_debt_service: Any = None,
) -> dict[str, Decimal | None]:
    """
    Calculate all standard financial ratios from raw P&L / balance sheet inputs.

    All inputs are coerced to Decimal before calculation — accepts int, float, str, Decimal.

    Returns a dict with all ratio names as keys. Values are Decimal or None (if
    required inputs were unavailable).

    Ratios returned:
        ebitda_margin       EBITDA / Revenue (%)
        net_margin          Net Income / Revenue (%)
        gross_margin        Gross Profit / Revenue (%)
        leverage_ratio      Net Debt / EBITDA (x)
        asset_turnover      Revenue / Total Assets (x)
        roe                 Net Income / Equity (%)
        interest_coverage   EBIT / Interest Expense (x)
        current_ratio       Current Assets / Current Liabilities (x)
        quick_ratio         (Current Assets - Inventory) / Current Liabilities (x)
        dscr                Cash from Operations / Total Debt Service (x)
        debt_to_equity      Total Liabilities / Equity (x)
    """
    r = _to_dec(revenue)
    ebitda_d = _to_dec(ebitda)
    ni = _to_dec(net_income)
    gp = _to_dec(gross_profit)
    ta = _to_dec(total_assets)
    tl = _to_dec(total_liabilities)
    nd = _to_dec(net_debt)
    eq = _to_dec(equity)
    ebit_d = _to_dec(ebit)
    ie = _to_dec(interest_expense)
    ca = _to_dec(current_assets)
    cl = _to_dec(current_liabilities)
    inv = _to_dec(inventory)
    cfo = _to_dec(cash_from_operations)
    ds = _to_dec(total_debt_service)

    # Margin ratios (as percentages)
    ebitda_margin = _safe_div(ebitda_d, r)
    if ebitda_margin is not None:
        ebitda_margin = (ebitda_margin * _PERCENT).quantize(_PLACES_PCT, rounding=ROUND_HALF_UP)

    net_margin = _safe_div(ni, r)
    if net_margin is not None:
        net_margin = (net_margin * _PERCENT).quantize(_PLACES_PCT, rounding=ROUND_HALF_UP)

    gross_margin = _safe_div(gp, r)
    if gross_margin is not None:
        gross_margin = (gross_margin * _PERCENT).quantize(_PLACES_PCT, rounding=ROUND_HALF_UP)

    roe = _safe_div(ni, eq)
    if roe is not None:
        roe = (roe * _PERCENT).quantize(_PLACES_PCT, rounding=ROUND_HALF_UP)

    # Multiple / coverage ratios
    leverage_ratio = _safe_div(nd, ebitda_d)
    if leverage_ratio is not None:
        leverage_ratio = leverage_ratio.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    asset_turnover = _safe_div(r, ta)
    if asset_turnover is not None:
        asset_turnover = asset_turnover.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    interest_coverage = _safe_div(ebit_d, ie)
    if interest_coverage is not None:
        interest_coverage = interest_coverage.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    current_ratio = _safe_div(ca, cl)
    if current_ratio is not None:
        current_ratio = current_ratio.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    # Quick ratio excludes inventory from current assets
    quick_numerator = (ca - inv) if (ca is not None and inv is not None) else ca
    quick_ratio = _safe_div(quick_numerator, cl)
    if quick_ratio is not None:
        quick_ratio = quick_ratio.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    dscr = _safe_div(cfo, ds)
    if dscr is not None:
        dscr = dscr.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    debt_to_equity = _safe_div(tl, eq)
    if debt_to_equity is not None:
        debt_to_equity = debt_to_equity.quantize(_PLACES_X, rounding=ROUND_HALF_UP)

    return {
        "ebitda_margin": ebitda_margin,
        "net_margin": net_margin,
        "gross_margin": gross_margin,
        "leverage_ratio": leverage_ratio,
        "asset_turnover": asset_turnover,
        "roe": roe,
        "interest_coverage": interest_coverage,
        "current_ratio": current_ratio,
        "quick_ratio": quick_ratio,
        "dscr": dscr,
        "debt_to_equity": debt_to_equity,
    }


def calculate_growth(current: Any, previous: Any) -> Decimal | None:
    """
    Calculate year-over-year growth rate as a percentage.

    Returns None if either input is None or previous is zero.

    Example:
        calculate_growth(110, 100) → Decimal("10.00")  (10% growth)
        calculate_growth(90, 100)  → Decimal("-10.00") (10% decline)
    """
    c = _to_dec(current)
    p = _to_dec(previous)
    if c is None or p is None or p == 0:
        return None

    growth = ((c - p) / abs(p)) * _PERCENT
    return growth.quantize(_PLACES_PCT, rounding=ROUND_HALF_UP)


# ---------------------------------------------------------------------------
# Formatting helpers
# ---------------------------------------------------------------------------

def format_ratio(value: Any, format_type: str = "percentage") -> str:
    """
    Format a ratio value as a human-readable string.

    Args:
        value:       Decimal, float, int, or None.
        format_type: "percentage" | "multiple" | "currency"

    Returns:
        Formatted string.

    Examples:
        format_ratio(Decimal("23.45"), "percentage") → "23.45%"
        format_ratio(Decimal("3.20"), "multiple")    → "3.20x"
        format_ratio(Decimal("1500000"), "currency") → "£1,500,000"
        format_ratio(None, "percentage")             → "N/A"
    """
    if value is None:
        return "N/A"

    d = _to_dec(value)
    if d is None:
        return "N/A"

    if format_type == "percentage":
        return f"{d:.2f}%"
    elif format_type == "multiple":
        return f"{d:.2f}x"
    elif format_type == "currency":
        # Format as currency with commas, no decimals for large numbers
        integer_part = int(d)
        return f"£{integer_part:,}"
    else:
        return str(d)


def ratios_to_display_dict(ratios: dict[str, Decimal | None]) -> dict[str, str]:
    """
    Convert a ratios dict (from calculate_ratios) to human-readable display strings.
    Used when embedding ratios in generated documents.
    """
    format_map = {
        "ebitda_margin": "percentage",
        "net_margin": "percentage",
        "gross_margin": "percentage",
        "roe": "percentage",
        "leverage_ratio": "multiple",
        "asset_turnover": "multiple",
        "interest_coverage": "multiple",
        "current_ratio": "multiple",
        "quick_ratio": "multiple",
        "dscr": "multiple",
        "debt_to_equity": "multiple",
    }
    return {
        key: format_ratio(value, format_map.get(key, "multiple"))
        for key, value in ratios.items()
    }
