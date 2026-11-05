"""Declarative base + shared column mixins.

Every table carries ``created_at`` / ``updated_at`` (PRD §10). Money columns
use ``NUMERIC(14, 2)`` — never float — with an adjacent ``currency`` column.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Numeric, func

try:  # SQLAlchemy 1.4 / 2.x
    from sqlalchemy.orm import declarative_base
except ImportError:  # pragma: no cover - SQLAlchemy 1.3 fallback
    from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


def utcnow() -> datetime:
    """Timezone-aware UTC now (SQLite has no native tz type, so we store UTC)."""
    return datetime.now(timezone.utc)


MONEY = Numeric(14, 2, asdecimal=True)
RATE = Numeric(6, 4, asdecimal=True)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=utcnow, server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, server_default=func.now()
    )
