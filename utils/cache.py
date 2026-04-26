import time
from typing import Any, Optional

TTL = 60  # seconds

_store: dict[str, tuple[Any, float]] = {}


def get(key: str) -> Optional[Any]:
    entry = _store.get(key)
    if entry is None:
        return None
    value, stored_at = entry
    if time.monotonic() - stored_at > TTL:
        del _store[key]
        return None
    return value


def set(key: str, value: Any) -> None:
    _store[key] = (value, time.monotonic())
