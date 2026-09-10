"""Unit tests for FastAPI REST endpoints, WebSocket streaming, and GeotechnicalCopilot."""

import pytest
from fastapi.testclient import TestClient

from src.api.server import app
from src.agents.copilot import GeotechnicalCopilot

client = TestClient(app)


def test_health_endpoint() -> None:
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "online"
    assert data["fault_count"] == 38
    assert data["graph_nodes"] >= 40


def test_root_dashboard_html() -> None:
    resp = client.get("/")
    assert resp.status_code == 200
    assert "SeismoAgent-TW" in resp.text
    assert "hazard-map" in resp.text


def test_faults_list_and_nearest_query() -> None:
    resp = client.get("/api/v1/faults?lat=24.968&lon=121.193")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_faults"] == 38
    nearest = data["nearest_query"]
    assert nearest is not None
    # Nearest fault to NCU campus is Shuanglienpo (ID 2)
    assert nearest["nearest_fault_id"] == 2
    assert nearest["distance_km"] < 5.0


def test_graph_topology_endpoint() -> None:
    resp = client.get("/api/v1/graph")
    assert resp.status_code == 200
    data = resp.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) >= 40
    assert len(data["edges"]) >= 50


def test_scenarios_endpoint() -> None:
    resp = client.get("/api/v1/scenarios")
    assert resp.status_code == 200
    scenarios = resp.json()
    assert len(scenarios) >= 3
    assert any(s["id"] == "shuanglienpo_hukou_mw69" for s in scenarios)


def test_triage_post_endpoint() -> None:
    payload = {
        "event_id": "TEST-EVT-001",
        "elapsed_seconds": 8.0,
        "magnitude": 6.91,
        "depth_km": 8.0,
        "epicenter_lat": 24.945,
        "epicenter_lon": 121.185,
        "predicted_pgv_nc_cm_s": 72.4,
        "is_preliminary": True,
    }
    resp = client.post("/api/v1/triage", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["alert_reference"] == "TEST-EVT-001"
    assert "DISPATCH" in data["event_id"]
    # Track A reflex latency should be extremely fast
    assert data["execution_summary"]["track_a_latency_ms"] < 5.0
    # Track A commands present
    actions = data["track_a_reflex"]["action_commands"]
    assert any("ELEVATOR" in a for a in actions)
    assert any("GAS" in a for a in actions)

    # Track B facility triage present
    facilities = data["track_b_deliberative"]["facility_triage"]
    assert len(facilities) >= 3
    # First facility (Science B4) should be flagged RED due to high PGV and Pre-1999 era
    assert "RED" in facilities[0]["triage_tag"]


def test_copilot_chat_endpoint() -> None:
    resp = client.post("/api/v1/chat", json={"query": "What happens if Shuanglienpo and Hukou rupture together?"})
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "Shuanglienpo" in data["answer"] or "Hukou" in data["answer"] or "Mw" in data["answer"]
    assert len(data["citations"]) > 0


def test_copilot_gmpe_query() -> None:
    copilot = GeotechnicalCopilot()
    res = copilot.answer_query("Calculate GMPE ground motion for Mw 6.91 at 2.8 km")
    assert res["gmpe_estimate"] is not None
    assert res["gmpe_estimate"]["median_pgv_cm_s"] > 20.0
    assert "Lin & Lee" in res["answer"]
