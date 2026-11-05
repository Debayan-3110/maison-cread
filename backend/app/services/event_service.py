"""Outbox + in-process event bus (E15.1, E15.2).

Domain events are committed in the same transaction as the state change, then
drained to registered consumers. Consumers are idempotent: each event id is
recorded per consumer, so a replay can never double-apply a side effect.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List

from sqlalchemy.orm import Session

from backend.app.core.logging import logger
from backend.app.models.marketplace import DomainEvent

_consumers: Dict[str, Callable[[DomainEvent], None]] = {}


def register_consumer(name: str, handler: Callable[[DomainEvent], None]) -> None:
    _consumers[name] = handler


def consumer_names() -> List[str]:
    return sorted(_consumers)


def emit(
    db: Session,
    event_type: str,
    *,
    payload: Dict[str, Any] | None = None,
    aggregate_type: str | None = None,
    aggregate_id: str | None = None,
    user_id: int | None = None,
    session_id: str | None = None,
    anon_id: str | None = None,
    commit: bool = False,
) -> DomainEvent:
    """Append an event to the outbox (do not commit here unless asked)."""
    event = DomainEvent(
        event_id=uuid.uuid4().hex,
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id) if aggregate_id is not None else None,
        user_id=user_id,
        session_id=session_id,
        anon_id=anon_id,
        payload=payload or {},
        status="pending",
    )
    db.add(event)
    if commit:
        db.commit()
    return event


def drain(db: Session, batch_size: int = 50) -> int:
    """Deliver pending events to every consumer. Returns events processed."""
    pending = (
        db.query(DomainEvent)
        .filter(DomainEvent.status.in_(["pending", "failed"]))
        .order_by(DomainEvent.id.asc())
        .limit(batch_size)
        .all()
    )
    processed = 0
    for event in pending:
        failures = 0
        for name, handler in _consumers.items():
            if name in (event.consumed_by or []):
                continue
            try:
                handler(event)
                event.consumed_by = [*(event.consumed_by or []), name]
            except Exception as exc:  # consumer failures never break the request
                failures += 1
                event.last_error = f"{name}: {exc}"[:400]
                logger.exception("consumer %s failed for %s", name, event.event_id)
        event.attempts = (event.attempts or 0) + 1
        if failures == 0:
            event.status = "dispatched"
            event.dispatched_at = datetime.now(timezone.utc)
        else:
            event.status = "failed"
        db.add(event)
        processed += 1
    if processed:
        db.commit()
    return processed


def pending_count(db: Session) -> int:
    return (
        db.query(DomainEvent)
        .filter(DomainEvent.status.in_(["pending", "failed"]))
        .count()
    )
