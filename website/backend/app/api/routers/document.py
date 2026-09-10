"""Document upload and indexing endpoint with file type and size validation."""

from __future__ import annotations

import io
from pathlib import Path
from typing import Any, Dict, List
import pypdf
from fastapi import APIRouter, File, HTTPException, UploadFile, status

try:
    from ...core.config import settings
    from ...rag.vector_store import DocumentChunk, get_vector_store
    from ...schemas.document import UploadResponse
except (ImportError, ValueError):
    try:
        from app.core.config import settings
        from app.rag.vector_store import DocumentChunk, get_vector_store
        from app.schemas.document import UploadResponse
    except ImportError:
        from website.backend.app.core.config import settings
        from website.backend.app.rag.vector_store import DocumentChunk, get_vector_store
        from website.backend.app.schemas.document import UploadResponse

router = APIRouter(prefix="/api", tags=["Documents"])


@router.post("/upload", response_model=UploadResponse, summary="Upload and index document")
async def upload_document(file: UploadFile = File(...)) -> UploadResponse:
    """Validate, extract, and index a PDF or TXT document into the vector store."""
    filename = file.filename or "unknown_document"
    ext = Path(filename).suffix.lower()

    # 1. Validate File Extension
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Allowed types: {', '.join(settings.allowed_extensions)}",
        )

    # 2. Read content and validate size
    content = await file.read()
    size_bytes = len(content)
    max_bytes = settings.max_upload_size_mb * 1024 * 1024

    if size_bytes > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.max_upload_size_mb} MB (received {size_bytes / (1024*1024):.2f} MB).",
        )

    if size_bytes == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    # 3. Extract text into chunks
    chunks: List[DocumentChunk] = []

    if ext == ".pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            for page_num, page in enumerate(reader.pages, start=1):
                page_text = page.extract_text() or ""
                page_text = page_text.strip()
                if not page_text:
                    continue

                # Sliding window chunking
                step = 700
                overlap = 100
                for start_idx in range(0, len(page_text), step - overlap):
                    chunk_sub = page_text[start_idx : start_idx + step]
                    if len(chunk_sub) >= 40:
                        chunks.append(
                            DocumentChunk(
                                chunk_id=f"{filename}-P{page_num}-{len(chunks)+1:03d}",
                                document_name=filename,
                                section=f"Page {page_num}",
                                text=chunk_sub,
                                metadata={"page": page_num, "size_bytes": len(chunk_sub)},
                            )
                        )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse PDF document: {str(e)}",
            )

    elif ext == ".txt":
        try:
            text_data = content.decode("utf-8", errors="replace").strip()
            step = 700
            overlap = 100
            for start_idx in range(0, len(text_data), step - overlap):
                chunk_sub = text_data[start_idx : start_idx + step]
                if len(chunk_sub) >= 40:
                    chunks.append(
                        DocumentChunk(
                            chunk_id=f"{filename}-C{len(chunks)+1:03d}",
                            document_name=filename,
                            section="Text Section",
                            text=chunk_sub,
                            metadata={"size_bytes": len(chunk_sub)},
                        )
                    )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Failed to parse text document: {str(e)}",
            )

    # 4. Index chunks into Vector Store
    store = get_vector_store()
    count = store.add_chunks(chunks)

    return UploadResponse(
        status="success",
        filename=filename,
        chunks_indexed=count,
        size_bytes=size_bytes,
        message=f"Successfully processed and indexed {count} chunks from '{filename}'.",
    )


@router.get("/documents", summary="List all indexed documents")
async def list_documents() -> List[Dict[str, Any]]:
    """Return all documents currently registered in the vector store."""
    store = get_vector_store()
    return store.list_documents()
