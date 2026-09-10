"""Unit tests for Decoupled Backend REST endpoints, SSE streaming, and file uploads."""

import pytest
from fastapi.testclient import TestClient

try:
    from website.backend.app.main import app, _request_counts
    from website.backend.app.core.config import settings
except ImportError:
    from app.main import app, _request_counts
    from app.core.config import settings

client = TestClient(app)


def test_health_endpoint() -> None:
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["total_chunks_indexed"] >= 0


def test_chat_sse_streaming() -> None:
    payload = {
        "query": "What are active seismogenic faults in Taiwan?",
        "stream": True,
        "top_k": 2,
    }
    resp = client.post("/api/chat", json=payload)
    assert resp.status_code == 200
    assert "text/event-stream" in resp.headers["content-type"]

    # Read SSE stream text
    lines = resp.text.split("\n")
    data_lines = [l for l in lines if l.startswith("data: ")]
    assert len(data_lines) > 0
    # Ensure termination event is sent
    assert any("done" in l for l in data_lines)


def test_upload_invalid_extension() -> None:
    files = {"file": ("malicious_script.sh", b"echo 'hack'", "text/x-sh")}
    resp = client.post("/api/upload", files=files)
    assert resp.status_code == 400
    assert "Unsupported file type" in resp.json()["detail"]


def test_upload_valid_txt_file() -> None:
    text_content = (
        "National Central University is located in Taoyuan City, Taiwan. "
        "The E-DREaM Lab conducts research on earthquake early warning, seismology, and hazard mitigation."
    )
    files = {"file": ("ncu_info.txt", text_content.encode("utf-8"), "text/plain")}
    resp = client.post("/api/upload", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert data["filename"] == "ncu_info.txt"
    assert data["chunks_indexed"] >= 1


def test_documents_list_endpoint() -> None:
    resp = client.get("/api/documents")
    assert resp.status_code == 200
    docs = resp.json()
    assert isinstance(docs, list)


def test_rate_limiting_enforcement(monkeypatch) -> None:
    _request_counts.clear()

    # Temporarily set rate limit threshold to 3 requests
    monkeypatch.setattr(settings, "rate_limit_per_minute", 3)

    # 3 allowed requests
    for _ in range(3):
        r = client.post("/api/chat", json={"query": "ping"})
        assert r.status_code == 200

    # 4th request must trigger 429
    r_blocked = client.post("/api/chat", json={"query": "ping"})
    assert r_blocked.status_code == 429
    assert "Rate limit exceeded" in r_blocked.json()["detail"]


def test_faults_and_nearest_endpoint() -> None:
    resp = client.get("/api/faults?lat=24.968&lon=121.193")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_faults"] == 38
    assert data["nearest_query"] is not None
    assert data["nearest_query"]["nearest_fault_id"] == 2


def test_triage_dispatch_endpoint() -> None:
    payload = {
        "event_id": "TEST-TRIAGE-001",
        "elapsed_seconds": 8.0,
        "magnitude": 6.91,
        "depth_km": 8.0,
        "epicenter_lat": 24.945,
        "epicenter_lon": 121.185,
        "predicted_pgv_nc_cm_s": 72.4,
        "is_preliminary": True,
    }
    resp = client.post("/api/triage", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "track_a_reflex" in data
    assert "track_b_deliberative" in data
    assert len(data["track_b_deliberative"]["facility_triage"]) >= 3

