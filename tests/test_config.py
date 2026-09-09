"""Lean test for project configuration (Ponytail self-check pattern)."""

from src.config import BASE_DIR, RAW_DATA_DIR, PROCESSED_DATA_DIR

def test_directories():
    assert BASE_DIR.exists(), f"Base dir {BASE_DIR} does not exist"
    assert RAW_DATA_DIR.exists(), f"Raw data dir {RAW_DATA_DIR} does not exist"
    assert PROCESSED_DATA_DIR.exists(), f"Processed data dir {PROCESSED_DATA_DIR} does not exist"

if __name__ == "__main__":
    test_directories()
    print("[PASS] Configuration check passed.")
