"""SQLAlchemy engine / session factory.

Exactly one engine per process, built from ``settings.DATABASE_URL`` — the
previous three competing SQLite paths (PRD defect D9) are gone. SQLite gets
WAL + foreign keys + busy timeout so concurrent FastAPI workers do not see
``database is locked``; PostgreSQL gets connection pooling and pre-ping.
"""
from __future__ import annotations

from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from backend.app.core.config import settings
from backend.app.db.base import Base, TimestampMixin, MONEY, RATE, utcnow  # noqa: F401

_connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

_engine_kwargs = {"echo": settings.SQL_ECHO, "connect_args": _connect_args}
if not settings.is_sqlite:
    _engine_kwargs.update(pool_pre_ping=True, pool_size=10, max_overflow=20)

engine = create_engine(settings.DATABASE_URL, **_engine_kwargs)


if settings.is_sqlite:

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, _record):  # pragma: no cover - driver hook
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=10000")
        cursor.close()


SessionLocal = sessionmaker(
    bind=engine, autocommit=False, autoflush=False, expire_on_commit=False
)


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request, always closed."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def session_scope() -> Iterator[Session]:
    """Transactional scope for background jobs / seeding."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def create_schema() -> None:
    """Create any missing tables (Alembic owns migrations in production)."""
    import backend.app.models  # noqa: F401  (registers every table on Base)

    Base.metadata.create_all(bind=engine)


def ping() -> bool:
    """Readiness probe: can we actually run a query?"""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:  # pragma: no cover - failure path
        return False


__all__ = [
    "Base",
    "TimestampMixin",
    "MONEY",
    "RATE",
    "utcnow",
    "engine",
    "SessionLocal",
    "get_db",
    "session_scope",
    "create_schema",
    "ping",
]

