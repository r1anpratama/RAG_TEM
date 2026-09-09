"""PDF extraction and structure-aware chunking pipeline for TEM PSHA documents."""

from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Optional
import pypdf

from src.config import RAW_DATA_DIR, PROCESSED_DATA_DIR


@dataclass
class DocumentChunk:
    """A semantic chunk of scientific literature for vector indexing."""
    chunk_id: str
    source_document: str
    page_number: int
    text: str
    word_count: int


def extract_pdf_chunks(
    pdf_path: Optional[Path] = None,
    chunk_size_chars: int = 1200,
    overlap_chars: int = 200
) -> List[DocumentChunk]:
    """Extract and semantically chunk text from a PDF document."""
    target_path = pdf_path or (RAW_DATA_DIR / "TEM PSHA2025-draft.pdf")
    if not target_path.exists():
        raise FileNotFoundError(f"Target PDF does not exist: {target_path}")

    reader = pypdf.PdfReader(str(target_path))
    chunks: List[DocumentChunk] = []
    chunk_index = 0

    for page_idx, page in enumerate(reader.pages):
        page_num = page_idx + 1
        raw_text = page.extract_text() or ""
        clean_text = " ".join(raw_text.split())

        if not clean_text:
            continue

        # Sliding window chunking within page
        start = 0
        text_len = len(clean_text)

        while start < text_len:
            end = min(start + chunk_size_chars, text_len)
            chunk_text = clean_text[start:end].strip()

            if chunk_text:
                chunk_index += 1
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"TEM-P{page_num:03d}-C{chunk_index:04d}",
                        source_document=target_path.name,
                        page_number=page_num,
                        text=chunk_text,
                        word_count=len(chunk_text.split())
                    )
                )

            if end == text_len:
                break
            start += (chunk_size_chars - overlap_chars)

    return chunks
