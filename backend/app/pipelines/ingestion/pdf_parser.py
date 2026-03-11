"""
PDF parsing pipeline step.

Extracts text, page structure, and section headers from financial PDF documents.
Uses pypdf for text extraction with heuristic section detection.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

from pypdf import PdfReader


# ---------------------------------------------------------------------------
# Section header detection heuristics
# ---------------------------------------------------------------------------

# Lines that are all-caps (3+ words or single short header) are section headers
_ALL_CAPS_RE = re.compile(r"^[A-Z][A-Z\s\d\-\&\(\)\/\.]{4,}$")

# Lines that are title-cased and short (< 60 chars) after stripping
_TITLE_CASE_RE = re.compile(r"^[A-Z][a-zA-Z\s\d\-\&\(\)\/\.]{2,59}$")

# Numbered section headers: "1.", "1.1", "I.", "A." at start of line
_NUMBERED_SECTION_RE = re.compile(r"^(\d+\.[\d\.]*|[IVX]+\.|[A-Z]\.)\s+[A-Z]")


def _is_section_header(line: str, next_line: str | None) -> bool:
    """
    Determine whether a line is a section header using multiple heuristics:
    1. All-caps line (financial doc convention)
    2. Numbered section prefix (1., 1.1, I., A.)
    3. Short title-case line followed by a blank line
    """
    stripped = line.strip()
    if not stripped or len(stripped) < 3:
        return False

    if _ALL_CAPS_RE.match(stripped):
        return True

    if _NUMBERED_SECTION_RE.match(stripped):
        return True

    # Title-case line followed by blank — common in Word-exported PDFs
    if next_line is not None and next_line.strip() == "" and _TITLE_CASE_RE.match(stripped):
        return True

    return False


def _extract_section_headers(lines: list[str]) -> list[tuple[int, str]]:
    """
    Return list of (line_index, header_text) for all detected section headers.
    """
    headers: list[tuple[int, str]] = []
    for i, line in enumerate(lines):
        next_line = lines[i + 1] if i + 1 < len(lines) else None
        if _is_section_header(line, next_line):
            headers.append((i, line.strip()))
    return headers


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def parse_pdf(file_path: str) -> dict[str, Any]:
    """
    Parse a PDF file and return structured content.

    Args:
        file_path: Absolute path to the PDF file.

    Returns:
        {
            "pages": [
                {
                    "page_num": int,       # 1-indexed
                    "text": str,           # full extracted text for the page
                    "section_headers": list[str],  # headers detected on this page
                    "char_count": int,
                }
            ],
            "metadata": {
                "total_pages": int,
                "title": str | None,
                "author": str | None,
                "creation_date": str | None,
                "file_name": str,
                "file_size_bytes": int,
                "total_chars": int,
            }
        }

    Raises:
        FileNotFoundError: If file_path does not exist.
        ValueError: If the file is not a valid PDF.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    file_size = path.stat().st_size

    try:
        reader = PdfReader(str(path))
    except Exception as exc:
        raise ValueError(f"Cannot read PDF '{file_path}': {exc}") from exc

    # Extract document-level metadata
    raw_meta = reader.metadata or {}
    metadata: dict[str, Any] = {
        "total_pages": len(reader.pages),
        "title": raw_meta.get("/Title") or raw_meta.get("title"),
        "author": raw_meta.get("/Author") or raw_meta.get("author"),
        "creation_date": str(raw_meta.get("/CreationDate", "")) or None,
        "file_name": path.name,
        "file_size_bytes": file_size,
        "total_chars": 0,
    }

    pages: list[dict[str, Any]] = []
    total_chars = 0

    for page_idx, page in enumerate(reader.pages):
        page_num = page_idx + 1

        try:
            text: str = page.extract_text() or ""
        except Exception:
            # Gracefully handle pages that fail to extract (scanned/encrypted)
            text = ""

        # Normalise line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")

        lines = text.split("\n")
        section_headers = [hdr for _, hdr in _extract_section_headers(lines)]

        char_count = len(text)
        total_chars += char_count

        pages.append(
            {
                "page_num": page_num,
                "text": text,
                "section_headers": section_headers,
                "char_count": char_count,
            }
        )

    metadata["total_chars"] = total_chars

    return {"pages": pages, "metadata": metadata}
