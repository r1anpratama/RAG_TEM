"""Standalone Launcher for SeismoAgent-TW Web Dashboard."""

import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import uvicorn
from src.api.server import app

if __name__ == "__main__":
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))

    print("\n" + "=" * 60)
    print("  SeismoAgent-TW Web Dashboard is ready!")
    print(f"  Open in browser: http://localhost:{port}")
    print(f"                or http://127.0.0.1:{port}")
    print("=" * 60 + "\n")

    uvicorn.run(app, host=host, port=port, reload=False)
