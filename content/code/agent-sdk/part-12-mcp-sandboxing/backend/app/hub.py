"""Part 9: the broadcast hub. One worker talks, N subscribers listen.

The hub is a dict of queues and four small functions; it holds nothing
durable. The event log remembers the past, the hub only fans out the
present, and a subscriber who wants both does replay-then-follow:
subscribe first, replay the log, then drain the queue, deduplicating by
seq. Subscribing before replaying is what closes the gap a message
could otherwise fall through.

Honest scope note: this hub lives in ONE process's memory. Two uvicorn
workers would mean two half-blind hubs. Production systems put the
fan-out in something shared (Redis pub/sub, Postgres LISTEN/NOTIFY);
the shape stays exactly this.
"""

import asyncio

# Every open request's subscriber queues. A queue item is (seq, event),
# or None to say "this run is over, hang up".
_subscribers: dict[str, set[asyncio.Queue]] = {}

# Requests whose worker is still running. Not in here = the log already
# holds the whole story, replay alone is enough.
_live: set[str] = set()


def open_request(request_id: str) -> None:
    _live.add(request_id)
    _subscribers.setdefault(request_id, set())


def is_live(request_id: str) -> bool:
    return request_id in _live


def publish(request_id: str, seq: int, event: dict) -> None:
    """Hand one event to every current subscriber. Fire and forget: the
    log has already committed it, so a subscriber who misses it (or shows
    up later) recovers by replaying."""
    for queue in _subscribers.get(request_id, set()):
        queue.put_nowait((seq, event))


def close_request(request_id: str) -> None:
    """The worker is done: wake every subscriber with the hang-up signal
    and forget the request. The log is the only thing that outlives this."""
    _live.discard(request_id)
    for queue in _subscribers.pop(request_id, set()):
        queue.put_nowait(None)


def subscribe(request_id: str) -> asyncio.Queue:
    queue: asyncio.Queue = asyncio.Queue()
    _subscribers.setdefault(request_id, set()).add(queue)
    return queue


def unsubscribe(request_id: str, queue: asyncio.Queue) -> None:
    _subscribers.get(request_id, set()).discard(queue)
