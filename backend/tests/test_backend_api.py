"""Unit tests for Decoupled Backend REST endpoints, SSE streaming, and file uploads."""

import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.core.config import settings

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
    from backend.app.main import _request_counts
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
