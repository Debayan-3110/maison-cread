"""Sliding-window rate limiting + request-id/access-log middleware."""
from __future__ import annotations

import threading
import time
import uuid
from collections import defaultdict, deque
from typing import Callable, Deque, Dict, List, Tuple

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.app.core.config import settings
from backend.app.core.http import REQUEST_ID_HEADER
from backend.app.core.logging import logger

_WINDOW_SECONDS = 60
_rate_state: Dict[Tuple[str, str], Deque[float]] = defaultdict(deque)
_rate_lock = threading.Lock()


def rate_buckets(path: str) -> List[Tuple[str, int]]:
    """Buckets that apply to this path; a request can consume several."""
    buckets: List[Tuple[str, int]] = []
    if "/chat" in path:
        buckets.append(("chat", settings.RATE_LIMIT_CHAT_PER_MIN))
    if "/ingest" in path:
        buckets.append(("ingest", settings.RATE_LIMIT_INGEST_PER_MIN))
    if any(marker in path for marker in ("/auth/otp", "/auth/forgot-password",
                                         "/auth/resend-verification")):
        buckets.append(("auth-heavy", settings.RATE_LIMIT_OTP_PER_MIN))
    buckets.append(("global", settings.RATE_LIMIT_GLOBAL_PER_MIN))
    return buckets


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Per (client IP, bucket) sliding window; 429 with Retry-After."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        for bucket, limit in rate_buckets(request.url.path):
            key = (client_ip, bucket)
            with _rate_lock:
                window = _rate_state[key]
                while window and now - window[0] > _WINDOW_SECONDS:
                    window.popleft()
                if len(window) >= limit:
                    retry_after = int(_WINDOW_SECONDS - (now - window[0])) + 1
                    logger.warning("Rate limit %s/%s exceeded by %s", bucket, limit, client_ip)
                    return JSONResponse(
                        status_code=429,
                        content={"detail": f"Rate limit exceeded for {bucket}. Try again shortly.",
                                 "error": "TOO_MANY_REQUESTS"},
                        headers={"Retry-After": str(max(retry_after, 1))},
                    )
                window.append(now)
        return await call_next(request)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Correlation id plus one structured access-log line per request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception("%s %s raised (%s)", request.method, request.url.path, request_id)
            raise
        elapsed_ms = (time.perf_counter() - started) * 1000
        response.headers[REQUEST_ID_HEADER] = request_id
        response.headers["X-Process-Time-Ms"] = f"{elapsed_ms:.1f}"
        if not request.url.path.startswith(("/ws", "/static", "/api/v1/health")):
            logger.info("%s %s -> %s in %.1fms [%s]", request.method, request.url.path,
                        response.status_code, elapsed_ms, request_id)
        return response
