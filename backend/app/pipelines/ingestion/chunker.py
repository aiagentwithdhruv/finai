"""
Financial-context-aware document chunker.

Splits parsed PDF pages into overlapping text chunks that:
- Respect section boundaries (never starts a new chunk mid-section without context)
- Do not split mid-sentence
- Carry metadata: page_number, section_header, char positions
"""

from __future__ import annotations

import re
from typing import Any


# ---------------------------------------------------------------------------
# Sentence boundary detection
# ---------------------------------------------------------------------------

# Split on sentence-ending punctuation followed by whitespace or end-of-string.
# Keeps the delimiter attached to the preceding sentence.
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


def _split_into_sentences(text: str) -> list[str]:
    """Split text into sentences, preserving trailing whitespace context."""
    raw = _SENTENCE_SPLIT_RE.split(text.strip())
    # Filter blanks, ensure each sentence ends with a space for re-joining
    return [s.strip() for s in raw if s.strip()]


# ---------------------------------------------------------------------------
# Core chunking logic
# ---------------------------------------------------------------------------


def chunk_document(
    pages: list[dict[str, Any]],
    chunk_size: int = 1000,
    overlap: int = 200,
) -> list[dict[str, Any]]:
    """
    Convert a list of parsed pages into overlapping text chunks.

    Each input page dict is expected to have:
        - page_num: int
        - text: str
        - section_headers: list[str]

    Returns a list of chunk dicts:
        {
            "content": str,
            "page_number": int,          # page where the chunk starts
            "section_header": str | None, # most-recently-seen section header
            "char_start": int,            # absolute char offset in the full document
            "char_end": int,
            "chunk_index": int,
        }

    Chunking strategy:
    1. Concatenate all pages into a single token stream, tracking page boundaries.
    2. Break the stream at section boundaries when possible.
    3. Within sections, break at sentence boundaries.
    4. Apply overlap: each chunk starts `overlap` characters before the end of
       the previous chunk to preserve context across boundaries.
    """
    if not pages:
        return []

    # ------------------------------------------------------------------
    # Step 1: Build a flat list of (text_segment, page_num, section_header)
    # ------------------------------------------------------------------
    segments: list[dict[str, Any]] = []
    for page in pages:
        page_num: int = page["page_num"]
        text: str = page.get("text", "")
        section_headers: list[str] = page.get("section_headers", [])

        if not text.strip():
            continue

        # Split the page text at section boundaries
        # Build split points from header positions in the text
        header_positions: list[tuple[int, str]] = []
        for header in section_headers:
            pos = text.find(header)
            if pos != -1:
                header_positions.append((pos, header))

        header_positions.sort(key=lambda x: x[0])

        if not header_positions:
            segments.append(
                {
                    "text": text,
                    "page_num": page_num,
                    "section_header": None,
                }
            )
        else:
            # Text before the first header
            if header_positions[0][0] > 0:
                pre_text = text[: header_positions[0][0]].strip()
                if pre_text:
                    segments.append(
                        {
                            "text": pre_text,
                            "page_num": page_num,
                            "section_header": None,
                        }
                    )

            for idx, (start_pos, header) in enumerate(header_positions):
                end_pos = (
                    header_positions[idx + 1][0]
                    if idx + 1 < len(header_positions)
                    else len(text)
                )
                section_text = text[start_pos:end_pos].strip()
                if section_text:
                    segments.append(
                        {
                            "text": section_text,
                            "page_num": page_num,
                            "section_header": header,
                        }
                    )

    # ------------------------------------------------------------------
    # Step 2: Tokenise each segment into sentences; build a flat sentence list
    # ------------------------------------------------------------------
    flat_sentences: list[dict[str, Any]] = []
    absolute_char = 0

    for seg in segments:
        sentences = _split_into_sentences(seg["text"])
        for sent in sentences:
            flat_sentences.append(
                {
                    "text": sent,
                    "page_num": seg["page_num"],
                    "section_header": seg["section_header"],
                    "char_start": absolute_char,
                }
            )
            absolute_char += len(sent) + 1  # +1 for space separator

    if not flat_sentences:
        return []

    # ------------------------------------------------------------------
    # Step 3: Greedily build chunks respecting chunk_size and overlap
    # ------------------------------------------------------------------
    chunks: list[dict[str, Any]] = []
    chunk_index = 0
    i = 0  # sentence pointer

    while i < len(flat_sentences):
        # Start a new chunk
        chunk_sentences: list[dict[str, Any]] = []
        current_length = 0
        chunk_start_char = flat_sentences[i]["char_start"]
        chunk_page = flat_sentences[i]["page_num"]
        chunk_section = flat_sentences[i]["section_header"]

        while i < len(flat_sentences):
            sent = flat_sentences[i]
            sent_len = len(sent["text"])

            # Respect section boundaries: close the chunk before a new section
            if (
                chunk_sentences
                and sent["section_header"] is not None
                and sent["section_header"] != chunk_section
                and current_length >= chunk_size // 2
            ):
                break

            chunk_sentences.append(sent)
            current_length += sent_len + 1

            if current_length >= chunk_size:
                i += 1
                break

            i += 1

        if not chunk_sentences:
            i += 1
            continue

        content = " ".join(s["text"] for s in chunk_sentences)
        char_end = chunk_start_char + len(content)

        chunks.append(
            {
                "content": content,
                "page_number": chunk_page,
                "section_header": chunk_section,
                "char_start": chunk_start_char,
                "char_end": char_end,
                "chunk_index": chunk_index,
            }
        )
        chunk_index += 1

        # ------------------------------------------------------------------
        # Step 4: Calculate overlap — rewind `i` so the next chunk starts
        # `overlap` characters before the current chunk ended.
        # ------------------------------------------------------------------
        if overlap > 0 and i < len(flat_sentences):
            overlap_chars = 0
            rewind = i - 1
            while rewind >= 0 and overlap_chars < overlap:
                overlap_chars += len(flat_sentences[rewind]["text"]) + 1
                rewind -= 1
            # Don't rewind past the start of the current chunk to avoid infinite loops
            min_rewind = max(rewind + 1, chunk_sentences[-1]["char_start"] // max(1, len(flat_sentences[0]["text"]) + 1) if flat_sentences else 0)
            i = max(rewind + 1, i - len(chunk_sentences) + 1)

    return chunks
