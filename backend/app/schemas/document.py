"""Pydantic schemas for document ingestion and indexing."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class UploadResponse(BaseModel):
    """Result of uploading and indexing a document."""
    status: str = Field(..., description="'success' or 'error'")
    filename: str
    chunks_indexed: int
    size_bytes: int
    message: str


class DocumentMetadata(BaseModel):
    """Metadata regarding an indexed document in the vector store."""
    doc_id: str
    filename: str
    total_chunks: int
    uploaded_at_utc: str
