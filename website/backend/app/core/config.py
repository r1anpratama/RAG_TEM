"""Application configuration and settings."""

from __future__ import annotations

import os
import json
from pathlib import Path
from typing import List

try:
    from pydantic_settings import BaseSettings
    class Settings(BaseSettings):
        host: str = "127.0.0.1"
        port: int = 8000
        debug: bool = False
        cors_origins: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
        rate_limit_per_minute: int = 60
        max_upload_size_mb: int = 10
        allowed_extensions: List[str] = [".pdf", ".txt"]
        openai_api_key: str = ""
        llm_api_base: str = "http://localhost:11434/v1"
        llm_model: str = "meta-llama/Llama-3.1-8B-Instruct"
        vector_db_type: str = "in_memory"

        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"
            extra = "ignore"

except ImportError:
    # Fallback to standard dataclass / os.getenv if pydantic-settings is omitted
    from dataclasses import dataclass, field

    @dataclass
    class Settings:
        host: str = os.getenv("HOST", "127.0.0.1")
        port: int = int(os.getenv("PORT", "8000"))
        debug: bool = os.getenv("DEBUG", "false").lower() == "true"
        cors_origins: List[str] = field(default_factory=lambda: (
            json.loads(os.getenv("CORS_ORIGINS"))
            if os.getenv("CORS_ORIGINS")
            else ["http://localhost:3000", "http://127.0.0.1:3000"]
        ))
        rate_limit_per_minute: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))
        max_upload_size_mb: int = int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))
        allowed_extensions: List[str] = field(default_factory=lambda: [".pdf", ".txt"])
        openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
        llm_api_base: str = os.getenv("LLM_API_BASE", "http://localhost:11434/v1")
        llm_model: str = os.getenv("LLM_MODEL", "meta-llama/Llama-3.1-8B-Instruct")
        vector_db_type: str = os.getenv("VECTOR_DB_TYPE", "in_memory")


settings = Settings()
