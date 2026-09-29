import re
import secrets
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from typing import Callable, List
import time
from collections import defaultdict
import threading

# CSRF configuration
CSRF_COOKIE_NAME = "shopcread_csrf"
CSRF_HEADER_NAME = "x-csrf-token"
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}

# Rate Limit configuration
RATE_LIMIT_STORE = defaultdict(list)
STORE_LOCK = threading.Lock()
RATE_LIMITS = {
    "/api/v1/chat/recommend": 10, # 10 requests per minute
    "/api/v1/ingest/inventory/auto-ingest": 5, # 5 requests per minute
}
WINDOW_SECONDS = 60

def generate_csrf_token() -> str:

    """Generate a random anti-CSRF token."""
    return secrets.token_hex(32)

def sanitize_input(value: str) -> str:
    """Sanitize user-provided string against HTML/Script injection."""
    if not isinstance(value, str):
        return value
    # Strip basic dangerous tags and control characters
    sanitized = re.sub(r"<\s*script[^>]*>.*?<\s*/\s*script\s*>", "", value, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"<\s*iframe[^>]*>.*?<\s*/\s*iframe\s*>", "", sanitized, flags=re.IGNORECASE | re.DOTALL)
    sanitized = re.sub(r"javascript\s*:", "", sanitized, flags=re.IGNORECASE)
    return sanitized.strip()

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Applies enterprise-grade security headers to all responses:
    - HTTPS enforcement (HSTS)
    - Anti-Clickjacking (X-Frame-Options)
    - Anti-MIME-Sniffing (X-Content-Type-Options)
    - Modern Content Security Policy (CSP)
    - Referrer Policy
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # HTTPS enforcement check for production/proxies
        proto = request.headers.get("x-forwarded-proto")
        host = request.headers.get("host", "")
        if proto == "http" and not ("localhost" in host or "127.0.0.1" in host):
            https_url = str(request.url).replace("http://", "https://", 1)
            return Response(status_code=301, headers={"Location": https_url})

        response = await call_next(request)

        # Security Headers
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com data:; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' http://127.0.0.1:* http://localhost:* https://dummyjson.com; "
            "frame-ancestors 'none';"
        )
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Sliding window rate limiter for high-cost AI endpoints.
    Prevents API abuse and manages OpenAI token costs.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        path = request.url.path

        if path in RATE_LIMITS:
            client_ip = request.client.host if request.client else "unknown"
            limit = RATE_LIMITS[path]

            with STORE_LOCK:
                now = time.time()
                # Filter timestamps to only include those in the current window
                RATE_LIMIT_STORE[client_ip] = [
                    t for t in RATE_LIMIT_STORE[client_ip]
                    if now - t < WINDOW_SECONDS
                ]

                if len(RATE_LIMIT_STORE[client_ip]) >= limit:
                    return JSONResponse(
                        status_code=429,
                        content={"detail": f"Rate limit exceeded for {path}. Please try again in a minute."}
                    )

                RATE_LIMIT_STORE[client_ip].append(now)

        return await call_next(request)

class CSRFMiddleware(BaseHTTPMiddleware):

    """
    Double Submit Cookie CSRF Protection.
    On safe requests (GET/HEAD/OPTIONS), sets a CSRF token cookie if not present.
    On mutating requests (POST/PUT/DELETE/PATCH), verifies that the X-CSRF-Token header
    matches the CSRF cookie or matches an authorized state.
    """
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        csrf_cookie = request.cookies.get(CSRF_COOKIE_NAME)
        csrf_header = request.headers.get(CSRF_HEADER_NAME)

        # If it's a mutating method, check CSRF token
        if request.method not in SAFE_METHODS:
            # Exempt preflight or direct dev test endpoints if explicitly needed
            # But for true security: require CSRF header if CSRF cookie is present
            if csrf_cookie and (not csrf_header or csrf_header != csrf_cookie):
                return JSONResponse(
                    status_code=403,
                    content={"detail": "CSRF validation failed. Missing or invalid X-CSRF-Token."}
                )

        response = await call_next(request)

        # Ensure client has a CSRF cookie
        if not csrf_cookie:
            new_token = generate_csrf_token()
            response.set_cookie(
                key=CSRF_COOKIE_NAME,
                value=new_token,
                httponly=False,  # JavaScript must read it to send in X-CSRF-Token header
                samesite="lax",
                secure=False,    # Set True in strict production HTTPS
                path="/"
            )
            # Also expose in header for easy access
            response.headers["X-CSRF-Token"] = new_token
        else:
            response.headers["X-CSRF-Token"] = csrf_cookie

        return response
