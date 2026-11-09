"""
Security and CSRF middleware for ShopCread.
"""
import re
import secrets
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse

CSRF_COOKIE_NAME = "shopcread_csrf"
CSRF_HEADER_NAME = "x-csrf-token"
SAFE_METHODS = frozenset({"GET", "HEAD", "OPTIONS"})
CSRF_EXEMPT_PATHS = frozenset({
    "/api/chat",
    "/api/chat/recommend",
    "/api/chat/reset",
    "/api/donations/calculate",
    "/api/coupons/validate",
    "/api/seller/products",
    "/api/seller/inventory",
    "/api/neon/storage/upload",
    "/api/cloudinary/upload",
    "/api/support/bns/initiate",
    "/api/support/bns/verify",
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/phone/send-otp",
    "/api/auth/phone/verify-otp",
    "/api/auth/forgot-password/send-otp",
    "/api/auth/forgot-password/verify-otp",
    "/api/auth/neon/google-url",
    "/api/auth/neon/verify-session",
    "/api/auth/email/send-otp",
    "/api/auth/email/verify-otp",
    "/api/auth/smtp/test",
    "/api/orders",
    "/api/geo/scrape-stores",
    "/api/mail/send-offer",
    "/api/mail/send-tracking",
    "/api/mail/send-security-alert",
    "/api/mail/test",
    "/api/donations/pledge"
})

def generate_csrf_token() -> str:
    return secrets.token_hex(32)

def sanitize_input(value: str) -> str:
    if not isinstance(value, str):
        return value
    sanitized = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", value, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"javascript\s*:", "", sanitized, flags=re.IGNORECASE)
    return sanitized.strip()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: https:; img-src 'self' data: https:;"
        return response

class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        cookie_token = request.cookies.get(CSRF_COOKIE_NAME)
        new_token_needed = not cookie_token

        if new_token_needed:
            cookie_token = generate_csrf_token()

        # Check mutating methods
        if request.method not in SAFE_METHODS and request.url.path not in CSRF_EXEMPT_PATHS and not request.url.path.startswith("/api/admin/") and not request.url.path.startswith("/api/orders/track"):
            # Check CSRF header
            header_token = (
                request.headers.get("x-csrf-token")
                or request.headers.get("X-CSRF-Token")
            )
            # If cookie was missing in the request itself or header is missing or doesn't match
            req_cookie = request.cookies.get(CSRF_COOKIE_NAME)
            if not req_cookie or not header_token or req_cookie != header_token:
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF validation failed: missing or invalid CSRF token."}
                )

        response = await call_next(request)

        if new_token_needed:
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=cookie_token,
                httponly=False,
                samesite="lax",
                path="/"
            )
        response.headers["X-CSRF-Token"] = cookie_token
        return response
