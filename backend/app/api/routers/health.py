"""Health and readiness check endpoints."""

from __future__ import annotations

import time
from typing import Any, Dict
from fastapi import APIRouter

from backend.app.rag.vector_store import get_vector_store

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", summary="System Health Status")
async def health_check() -> Dict[str, Any]:
    """Check API readiness and vector store status."""
    store = get_vector_store()
    return {
        "status": "healthy",
        "service": "RAG-Backend-FastAPI",
        "version": "1.0.0",
        "total_chunks_indexed": len(store.chunks),
        "total_documents": len(store.list_documents()),
        "timestamp": time.time(),
    }
