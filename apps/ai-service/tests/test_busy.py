"""Busy-mode: a second concurrent inference call returns 503, not a backlog."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import app.inference_lock as il
from app.inference_lock import INFERENCE_LOCK, inference_slot
import pytest
from fastapi import HTTPException


def test_inference_slot_raises_503_when_lock_is_held(monkeypatch):
    # Make the wait effectively instant so the test doesn't sleep.
    monkeypatch.setattr(il, "BUSY_TIMEOUT_S", 0.05)
    INFERENCE_LOCK.acquire()
    try:
        with pytest.raises(HTTPException) as exc:
            with inference_slot(timeout=0.05):
                pass
        assert exc.value.status_code == 503
        assert "busy" in exc.value.detail.lower()
    finally:
        INFERENCE_LOCK.release()


def test_inference_slot_acquires_and_releases_when_free():
    with inference_slot(timeout=0.05):
        # The lock is held inside the block...
        assert INFERENCE_LOCK.locked()
    # ...and released after it.
    assert not INFERENCE_LOCK.locked()
