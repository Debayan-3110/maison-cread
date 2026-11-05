"""Structured logging: console + rotating app log + append-only audit log.

Stdlib only (no third-party logger) so the dependency surface stays small and
the log directory is resolved from configuration instead of a hard-coded path.
``get_security_logger()`` returns a channel whose records are mirrored into
``security_audit.log`` for compliance review.
"""
from __future__ import annotations

import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Any

from backend.app.core.config import settings

_CONSOLE_FMT = (
    "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
)
_FILE_FMT = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"

_configured = False


def _rotating(handler_cls=RotatingFileHandler, filename: Path | None = None, **kwargs):
    assert filename is not None
    filename.parent.mkdir(parents=True, exist_ok=True)
    return handler_cls(
        filename=str(filename),
        maxBytes=settings.LOG_MAX_BYTES,
        backupCount=settings.LOG_BACKUP_COUNT,
        encoding="utf-8",
        **kwargs,
    )


def configure_logging() -> None:
    global _configured
    if _configured:
        return

    root = logging.getLogger("shopcread")
    root.setLevel(settings.LOG_LEVEL.upper())
    root.handlers.clear()
    root.propagate = False

    console = logging.StreamHandler()
    console.setFormatter(logging.Formatter(_CONSOLE_FMT))
    root.addHandler(console)

    app_file = _rotating(filename=Path(settings.LOG_DIR) / "app.log")
    app_file.setFormatter(logging.Formatter(_FILE_FMT))
    root.addHandler(app_file)

    security = logging.getLogger("shopcread.security")
    security.setLevel(logging.WARNING)
    security.handlers.clear()
    audit_file = _rotating(filename=Path(settings.LOG_DIR) / "security_audit.log")
    audit_file.setFormatter(logging.Formatter("%(asctime)s | SECURITY | %(message)s"))
    security.addHandler(audit_file)
    security.propagate = True  # also keep security events in app.log

    # Quiet third-party chatter
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)

    _configured = True


class Logger:
    """Tiny facade: ``logger.info(...)`` plus ``logger.bind(SECURITY=True)``."""

    def __init__(self, name: str = "shopcread") -> None:
        self._name = name
        configure_logging()

    def _resolve(self, **context: Any) -> logging.Logger:
        if context.get("SECURITY") or context.get("security"):
            return logging.getLogger(f"{self._name}.security")
        return logging.getLogger(self._name)

    def bind(self, **context: Any) -> "Logger":
        child = Logger(self._name)
        child._context = context  # type: ignore[attr-defined]
        return child

    def _emit(self, level: int, msg: str, *args: Any, **kwargs: Any) -> None:
        context = getattr(self, "_context", {})
        log = self._resolve(**context)
        if args:
            msg = msg % args
        log.log(level, msg, **kwargs)

    def debug(self, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(logging.DEBUG, msg, *args, **kwargs)

    def info(self, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(logging.INFO, msg, *args, **kwargs)

    def warning(self, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(logging.WARNING, msg, *args, **kwargs)

    def error(self, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(logging.ERROR, msg, *args, **kwargs)

    def critical(self, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(logging.CRITICAL, msg, *args, **kwargs)

    def exception(self, msg: str, *args: Any, **kwargs: Any) -> None:
        kwargs.setdefault("exc_info", True)
        self._emit(logging.ERROR, msg, *args, **kwargs)

    def log(self, level: int, msg: str, *args: Any, **kwargs: Any) -> None:
        self._emit(level, msg, *args, **kwargs)


logger = Logger()


def get_logger(name: str = "shopcread") -> Logger:
    return Logger(name)


def get_security_logger() -> Logger:
    """Security-audit channel (written to ``logs/security_audit.log``)."""
    return Logger().bind(SECURITY=True)


__all__ = ["logger", "get_logger", "get_security_logger", "configure_logging"]

