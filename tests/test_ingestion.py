"""Verification test for PDF document ingestion pipeline."""

from src.pipelines.ingestion import extract_pdf_chunks

def test_pdf_chunking():
    chunks = extract_pdf_chunks()
    assert len(chunks) > 50, f"Expected > 50 chunks, got {len(chunks)}"
    first = chunks[0]
    assert first.page_number == 1
    assert first.word_count > 20
    assert "TEM" in first.chunk_id

if __name__ == "__main__":
    test_pdf_chunking()
    print("[PASS] PDF ingestion test passed.")
