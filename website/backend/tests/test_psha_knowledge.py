"""Tests for the TEM PSHA2025 grounded knowledge layer and its map dataset endpoint."""

import pytest
from fastapi.testclient import TestClient

try:
    from website.backend.app.main import app
    from website.backend.app.rag.psha_knowledge import (
        answer_from_catalog,
        build_psha_chunks,
        dataset,
    )
except ImportError:
    from app.main import app
    from app.rag.psha_knowledge import answer_from_catalog, build_psha_chunks, dataset

client = TestClient(app)


def test_dataset_counts_match_the_authoritative_catalog() -> None:
    payload = dataset()
    summary = payload["summary"]
    assert summary["total_faults"] == 38
    assert summary["multi_rupture_pairings"] == len(payload["pairings"]) > 0
    # The hazard map plots seismic sources only; no facility markers are served.
    assert "facilities" not in payload
    # Areal source zones ship with the payload but stay hidden until the user opts in.
    assert summary["area_sources"] == len(payload["area_sources"]) == 28
    assert all(len(zone["coordinates"]) >= 3 for zone in payload["area_sources"])
    # Every pairing must reference real catalog IDs and carry both published figures.
    fault_ids = {f["fault_ids"][0] for f in payload["pairings"]} | {
        f["fault_ids"][1] for f in payload["pairings"]
    }
    assert fault_ids, "pairings should reference structures"
    for pairing in payload["pairings"]:
        assert pairing["combined_mw"] > 0
        assert pairing["recurrence_interval_yr"] > 0
        assert len(pairing["fault_ids"]) == 2


def test_pairings_are_deduplicated() -> None:
    """The graph stores each pairing twice (bidirectional); the dataset must not."""
    labels = [p["pairing_label"] for p in dataset()["pairings"]]
    assert len(labels) == len(set(labels))


def test_psha_dataset_endpoint() -> None:
    resp = client.get("/api/psha/dataset")
    assert resp.status_code == 200
    body = resp.json()
    assert body["summary"]["total_faults"] == 38
    assert isinstance(body["pairings"], list)


def test_graph_topology_endpoint_serializes_real_edges() -> None:
    """Regression: this endpoint used to 500 because GeoGraph has no networkx `.graph`."""
    resp = client.get("/api/graph")
    assert resp.status_code == 200
    body = resp.json()
    assert body["summary"]["faults"] == 38
    assert body["summary"]["multi_rupture_pairings"] > 0
    assert any(e["relation"] == "RUPTURES_WITH" for e in body["edges"])
    assert any(n["type"] == "FACILITY" for n in body["nodes"])


def test_seeded_chunks_cover_structures_pairings_and_paper() -> None:
    chunks = build_psha_chunks()
    assert len(chunks) >= 38 + 13
    sections = " ".join(c["section"] for c in chunks)
    assert "Table 1 - on-land seismogenic structure ID 4" in sections
    assert "Table 2" in sections
    # Seeded fault text must quote the catalog, never an invented magnitude.
    hukou = next(c for c in chunks if c["id"] == "TEM-T1-04")
    assert "Hukou" in hukou["text"] and "mm/yr" in hukou["text"]


@pytest.mark.parametrize(
    "query, expected_id",
    [
        ("what is the slip rate of the Hukou fault?", 4),
        ("tell me about fault ID 2", 2),
        ("Chaochou fault parameters", 29),
        ("#29 card", 29),
    ],
)
def test_structured_fault_resolution(query: str, expected_id: int) -> None:
    answer = answer_from_catalog(query)
    assert answer is not None
    assert f"Fault ID {expected_id}" in answer["answer"]
    assert answer["citation"]["document_name"] == "Fault Parameters_update.xlsx"


def test_structured_pairing_and_dataset_answers() -> None:
    pairings = answer_from_catalog("list all Table 2 pairings")
    assert pairings is not None and "Combined Mw" in pairings["answer"]

    count = answer_from_catalog("how many structures are in the catalog?")
    assert count is not None and "38" in count["answer"]


def test_open_question_falls_back_to_retrieval() -> None:
    """Unstructured questions must not be answered by the exact-lookup path."""
    assert answer_from_catalog("what are the final hazard map results?") is None
