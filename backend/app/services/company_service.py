"""
CompanyService — business logic for company lookup and management.

External API integration:
    Companies House REST API (UK)
    https://developer-specs.company-information.service.gov.uk/
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.repositories.company_repo import CompanyRepository

logger = logging.getLogger(__name__)

_CH_BASE_URL = "https://api.company-information.service.gov.uk"
_CH_TIMEOUT = 10.0  # seconds


async def lookup_companies_house(
    query: str,
    api_key: str,
    items_per_page: int = 10,
) -> list[dict[str, Any]]:
    """
    Search Companies House for companies matching the query string.

    Args:
        query:          Search term (company name or number).
        api_key:        Companies House REST API key.
        items_per_page: Max results to return (1-100).

    Returns:
        List of company result dicts:
        {
            "company_number": str,
            "title": str,
            "address": dict | None,
            "company_status": str | None,
            "company_type": str | None,
            "date_of_creation": str | None,
            "sic_codes": list[str],
            "description": str | None,
        }

    Raises:
        httpx.HTTPStatusError: On non-2xx responses from Companies House.
    """
    url = f"{_CH_BASE_URL}/search/companies"
    params = {"q": query, "items_per_page": items_per_page}

    # Companies House uses HTTP Basic Auth with API key as username, empty password
    auth = (api_key, "")

    async with httpx.AsyncClient(timeout=_CH_TIMEOUT) as client:
        response = await client.get(url, params=params, auth=auth)
        response.raise_for_status()
        data = response.json()

    items = data.get("items", [])
    results = []
    for item in items:
        address_obj = item.get("address", {})
        results.append(
            {
                "company_number": item.get("company_number", ""),
                "title": item.get("title", ""),
                "address": {
                    "address_line_1": address_obj.get("address_line_1"),
                    "address_line_2": address_obj.get("address_line_2"),
                    "locality": address_obj.get("locality"),
                    "postal_code": address_obj.get("postal_code"),
                    "country": address_obj.get("country"),
                }
                if address_obj
                else None,
                "company_status": item.get("company_status"),
                "company_type": item.get("company_type"),
                "date_of_creation": item.get("date_of_creation"),
                "sic_codes": item.get("sic_codes", []),
                "description": item.get("description"),
            }
        )

    logger.info(
        "Companies House search",
        extra={"query": query, "results": len(results)},
    )
    return results


async def get_company_details(
    company_number: str,
    api_key: str,
) -> dict[str, Any]:
    """
    Fetch full company profile from Companies House by registration number.

    Returns a rich dict with all available fields including officers,
    filing history, and charges (from separate API endpoints).
    """
    url = f"{_CH_BASE_URL}/company/{company_number}"
    auth = (api_key, "")

    async with httpx.AsyncClient(timeout=_CH_TIMEOUT) as client:
        response = await client.get(url, auth=auth)
        response.raise_for_status()
        return response.json()


async def get_company_officers(company_number: str, api_key: str) -> list[dict[str, Any]]:
    """Fetch the officer list for a company."""
    url = f"{_CH_BASE_URL}/company/{company_number}/officers"
    auth = (api_key, "")

    async with httpx.AsyncClient(timeout=_CH_TIMEOUT) as client:
        response = await client.get(url, auth=auth)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return response.json().get("items", [])


async def get_company_filing_history(
    company_number: str,
    api_key: str,
    category: str = "accounts",
    items_per_page: int = 10,
) -> list[dict[str, Any]]:
    """Fetch recent filing history (default: accounts category)."""
    url = f"{_CH_BASE_URL}/company/{company_number}/filing-history"
    params = {"category": category, "items_per_page": items_per_page}
    auth = (api_key, "")

    async with httpx.AsyncClient(timeout=_CH_TIMEOUT) as client:
        response = await client.get(url, params=params, auth=auth)
        if response.status_code == 404:
            return []
        response.raise_for_status()
        return response.json().get("items", [])


class CompanyService:
    """
    Service layer for company management.

    Orchestrates Companies House API calls, data normalisation,
    and persistence via CompanyRepository.
    """

    def __init__(self, settings: Settings, db_session: AsyncSession) -> None:
        self._settings = settings
        self._db = db_session
        self._repo = CompanyRepository(db_session)

    async def lookup(self, query: str) -> dict[str, Any]:
        """
        Search Companies House and return results (does not persist).
        """
        results = await lookup_companies_house(
            query=query,
            api_key=self._settings.companies_house_api_key,
        )
        return {
            "query": query,
            "total_results": len(results),
            "results": results,
        }

    async def refresh_from_companies_house(self, company_id: uuid.UUID) -> dict[str, Any]:
        """
        Pull fresh data from Companies House for an existing company and update the DB.

        Returns the updated company data dict.
        """
        company = await self._repo.get_by_id(company_id)
        if company is None:
            raise ValueError(f"Company {company_id} not found")

        if not company.company_number:
            raise ValueError(f"Company {company_id} has no company_number — cannot refresh from Companies House")

        api_key = self._settings.companies_house_api_key

        # Fetch all data in parallel-ish (sequential for now, could be gathered)
        details = await get_company_details(company.company_number, api_key)
        officers = await get_company_officers(company.company_number, api_key)
        filings = await get_company_filing_history(company.company_number, api_key)

        # Normalise address
        registered_addr = details.get("registered_office_address", {})
        update_data = {
            "name": details.get("company_name", company.name),
            "status": details.get("company_status", company.status),
            "registered_address": {
                "address_line_1": registered_addr.get("address_line_1"),
                "address_line_2": registered_addr.get("address_line_2"),
                "locality": registered_addr.get("locality"),
                "postal_code": registered_addr.get("postal_code"),
                "country": registered_addr.get("country"),
            },
            "sic_codes": details.get("sic_codes", []),
            "officers": officers[:20],   # Cap to avoid JSONB bloat
            "filing_history": filings[:20],
        }

        updated = await self._repo.update(company_id, update_data)
        return update_data
