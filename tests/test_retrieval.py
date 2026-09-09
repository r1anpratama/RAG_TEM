"""Verification tests for the HybridRetriever engine."""

from src.pipelines.retrieval import HybridRetriever

def test_hybrid_retrieval():
    retriever = HybridRetriever.from_pdf()
    assert len(retriever.chunks) > 50

    # Query 1: General hazard query
    results_hazard = retriever.search("probabilistic seismic hazard assessment GMPE logic tree", top_k=3)
    assert len(results_hazard) > 0
    assert results_hazard[0].score > 0.05
    assert results_hazard[0].chunk.page_number > 0

    # Query 2: Specific fault term
    results_fault = retriever.search("seismogenic structures multiple rupture fault", top_k=3)
    assert len(results_fault) > 0
    assert "structure" in results_fault[0].chunk.text.lower() or "fault" in results_fault[0].chunk.text.lower()

if __name__ == "__main__":
    test_hybrid_retrieval()
    print("[PASS] Hybrid retrieval test passed.")
