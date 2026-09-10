"""API Routers package."""

from .chat import router as chat_router
from .document import router as document_router
from .health import router as health_router
from .triage import router as triage_router

__all__ = ["chat_router", "document_router", "health_router", "triage_router"]
