from __future__ import annotations

import asyncio
from collections import defaultdict

_subscribers: dict[str, set[asyncio.Queue]] = defaultdict(set)
_lock = asyncio.Lock()


async def subscribe(conversation_id: str) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    async with _lock:
        _subscribers[conversation_id].add(queue)
    return queue


async def unsubscribe(conversation_id: str, queue: asyncio.Queue) -> None:
    async with _lock:
        if conversation_id in _subscribers:
            _subscribers[conversation_id].discard(queue)
            if not _subscribers[conversation_id]:
                _subscribers.pop(conversation_id, None)


async def broadcast(conversation_id: str, event: dict) -> None:
    async with _lock:
        queues = list(_subscribers.get(conversation_id, set()))

    for q in queues:
        q.put_nowait(event)


async def reset_realtime_state() -> None:
    async with _lock:
        _subscribers.clear()
