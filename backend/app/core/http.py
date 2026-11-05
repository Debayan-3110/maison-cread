"""Security headers + CSRF middleware.

Middleware order in ``main.py`` matters: FastAPI applies the last-added
middleware first (outermost), so CORS is registered last.
"""
from __future__ import annotations

import re
import secrets
from typing import Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from backend.app.core.config import settings
from backend.app.core.logging import get_security_logger

CSRF_COOKIE_NAME = "shopcread_csrf"
CSRF_HEADER_NAME = "x-csrf-token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS", "TRACE"}
REQUEST_ID_HEADER = "X-Request-Id"


def generate_csrf_token() -> str:
    return secrets.token_hex(32)


def sanitize_input(value):
    """Strip obvious script injection from user-supplied strings."""
    if not isinstance(value, str):
        return value
    cleaned = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", value,
                     flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", cleaned,
                     flags=re.IGNORECASE | re.DOTALL)
    cleaned = re.sub(r"javascript\s*:", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """CSP, HSTS, anti-clickjacking, anti-MIME-sniffing, referrer policy."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if settings.ENABLE_HTTPS_REDIRECT:
            proto = request.headers.get("x-forwarded-proto")
            host = request.headers.get("host", "")
            if proto == "http" and "localhost" not in host and "127.0.0.1" not in host:
                return Response(status_code=301, headers={"Location": str(request.url)
                                                          .replace("http://", "https://", 1)})

        response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Cross-Origin-Resource-Policy"] = "same-site"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' ws: wss: http://127.0.0.1:* http://localhost:*; "
            "frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
        )
        if settings.HSTS_ENABLED or settings.is_production:
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        return response


class CSRFMiddleware(BaseHTTPMiddleware):
    """Double-submit cookie CSRF protection.

    A mutating request is rejected only when a CSRF cookie is present and the
    header does not match it, so the first cookie-less call bootstraps the
    token — exactly the flow the storefront client uses.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
        header_token = request.headers.get(CSRF_HEADER_NAME)

        if request.method not in SAFE_METHODS and cookie_token:
            if not header_token or not secrets.compare_digest(header_token, cookie_token):
                get_security_logger().warning(
                    "CSRF rejection %s %s", request.method, request.url.path)
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF validation failed. Missing or invalid X-CSRF-Token.",
                             "error": "CSRF_FAILED"},
                )

        response = await call_next(request)
        token = cookie_token or generate_csrf_token()
        if not cookie_token:
            response.set_cookie(
                key=CSRF_COOKIE_NAME, value=token, httponly=False,
                samesite="lax", secure=settings.is_production, path="/",
            )
        response.headers[CSRF_HEADER_NAME] = token
        return response
