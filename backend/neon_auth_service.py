"""
Neon Auth & Better Auth Integration Service for ShopCread.
Handles:
1. Vercel.env bypass and root configuration fallback.
2. Dynamic OAuth backlink resolution (Google / Social).
3. JWKS public key retrieval and Ed25519 token verification.
4. Neon Auth session verification and user profile extraction.
"""
import os
import json
import time
import urllib.request
import urllib.error
from typing import Dict, Any, Optional, List
from pathlib import Path
from dotenv import load_dotenv
import jwt

# Load root .env
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

# Environment configuration
NEON_AUTH_BASE_URL = os.getenv("NEON_AUTH_BASE_URL", "https://ep-shy-mouse-b3lw7wan.neonauth.c-4.ap-southeast-1.aws.neon.tech/neondb/auth")
NEON_AUTH_JWKS_URL = os.getenv("NEON_AUTH_JWKS_URL", f"{NEON_AUTH_BASE_URL}/.well-known/jwks.json")

# In-memory JWKS cache
_cached_jwks: Optional[Dict[str, Any]] = None
_jwks_cached_at: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour

def is_vercel_env() -> bool:
    """Returns True only if running inside a genuine Vercel hosting environment."""
    return bool(os.getenv("VERCEL_ENV") or os.getenv("VERCEL"))

def get_backlink_url(request_host: Optional[str] = None, request_scheme: Optional[str] = None) -> str:
    """
    Computes the OAuth backlink redirect URI.
    In local/standalone environments (bypassing vercel.env), defaults to standard frontend origin.
    """
    if request_host:
        scheme = request_scheme or ("https" if "localhost" not in request_host and "127.0.0.1" not in request_host else "http")
        # If request came to the backend port (8000), redirect back to frontend (5173 in local dev)
        if ":8000" in request_host:
            fe_host = request_host.replace(":8000", ":5173")
            return f"{scheme}://{fe_host}/auth/callback"
        return f"{scheme}://{request_host}/auth/callback"
    
    return os.getenv("NEON_AUTH_BACKLINK_URL", "http://localhost:5173/auth/callback")

def get_neon_auth_config(request_host: Optional[str] = None, request_scheme: Optional[str] = None) -> Dict[str, Any]:
    """
    Returns public Neon Auth client configuration, explicitly declaring
    the Vercel.env bypass status and dynamic backlink URL.
    """
    backlink = get_backlink_url(request_host, request_scheme)
    vercel_detected = is_vercel_env()
    
    return {
        "status": "active",
        "provider": "neon_auth",
        "neon_auth_base_url": NEON_AUTH_BASE_URL,
        "neon_auth_jwks_url": NEON_AUTH_JWKS_URL,
        "backlink_url": backlink,
        "vercel_env_bypassed": not vercel_detected,
        "vercel_env_detected": vercel_detected,
        "env_source": "root .env" if not vercel_detected else "vercel environment",
        "supported_auth_methods": [
            "personal_gmail_google",
            "phone_sms_otp",
            "email_password",
            "otp_forgot_password"
        ]
    }

def get_neon_jwks(force_refresh: bool = False) -> Dict[str, Any]:
    """Retrieves and caches the Ed25519 JWKS keys from Neon Auth."""
    global _cached_jwks, _jwks_cached_at
    now = time.time()
    if not force_refresh and _cached_jwks and (now - _jwks_cached_at) < JWKS_CACHE_TTL:
        return _cached_jwks

    try:
        req = urllib.request.Request(
            NEON_AUTH_JWKS_URL,
            headers={"User-Agent": "ShopCread-NeonAuth/2.0", "Accept": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode("utf-8"))
            _cached_jwks = data
            _jwks_cached_at = now
            return data
    except Exception as e:
        if _cached_jwks:
            return _cached_jwks
        return {"keys": []}

def get_neon_google_auth_url(origin: Optional[str] = None) -> Dict[str, Any]:
    """
    Initiates Google Social Login via Neon Auth, providing the backlink callback URL.
    """
    backlink = f"{origin.rstrip('/')}/auth/callback" if origin else get_backlink_url()
    init_url = f"{NEON_AUTH_BASE_URL}/sign-in/social"
    payload = json.dumps({
        "provider": "google",
        "callbackURL": backlink
    }).encode("utf-8")

    try:
        req = urllib.request.Request(
            init_url,
            data=payload,
            headers={
                "User-Agent": "ShopCread-Client/2.0",
                "Content-Type": "application/json",
                "Origin": origin or "http://localhost:5173"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=8) as res:
            res_data = json.loads(res.read().decode("utf-8"))
            auth_redirect_url = res_data.get("url")
            return {
                "success": True,
                "url": auth_redirect_url,
                "backlink_url": backlink,
                "redirect": True
            }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        return {
            "success": False,
            "error": f"Neon Auth HTTP {e.code}: {err_body}",
            "backlink_url": backlink
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "backlink_url": backlink
        }

def verify_neon_token_with_jwks(token_str: str) -> Optional[Dict[str, Any]]:
    """
    Cryptographically verifies a Neon Auth JWT against the public EdDSA (Ed25519) JWKS.
    """
    try:
        unverified_headers = jwt.get_unverified_header(token_str)
        kid = unverified_headers.get("kid")
        alg_name = unverified_headers.get("alg", "EdDSA")

        jwks_data = get_neon_jwks()
        keys = jwks_data.get("keys", [])

        matching_jwk = None
        for k in keys:
            if not kid or k.get("kid") == kid:
                matching_jwk = k
                break

        if not matching_jwk:
            return None

        # Convert JWK to Ed25519 public key
        alg_handler = jwt.algorithms.get_default_algorithms().get(alg_name)
        if not alg_handler:
            return None

        public_key = alg_handler.from_jwk(matching_jwk)

        # Decode & verify signature
        payload = jwt.decode(
            token_str,
            public_key,
            algorithms=[alg_name],
            options={"verify_exp": True, "verify_aud": False}
        )
        return payload
    except Exception:
        return None

def verify_neon_session(token: Optional[str] = None, cookie_header: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Verifies a user session with Neon Auth (Better Auth) via /get-session or JWKS token decode.
    Returns standardized user profile claims:
    { "email": "...", "name": "...", "id": "...", "avatar": "..." }
    """
    # 1. First attempt: If token is a JWT, verify via JWKS
    if token and "." in token:
        claims = verify_neon_token_with_jwks(token)
        if claims and claims.get("email"):
            return {
                "email": claims.get("email"),
                "name": claims.get("name") or claims.get("full_name") or "",
                "id": str(claims.get("sub") or claims.get("id") or ""),
                "avatar": claims.get("picture") or claims.get("avatar") or "",
                "verified": True
            }

    # 2. Second attempt: Query Neon Auth /get-session endpoint
    session_url = f"{NEON_AUTH_BASE_URL}/get-session"
    headers = {"User-Agent": "ShopCread-Backend/2.0", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if cookie_header:
        headers["Cookie"] = cookie_header

    try:
        req = urllib.request.Request(session_url, headers=headers)
        with urllib.request.urlopen(req, timeout=6) as res:
            data = json.loads(res.read().decode("utf-8"))
            if not data:
                return None
            user_data = data.get("user") or data
            email = user_data.get("email")
            if not email:
                return None
            return {
                "email": email,
                "name": user_data.get("name") or "",
                "id": str(user_data.get("id") or ""),
                "avatar": user_data.get("image") or user_data.get("avatar") or "",
                "verified": bool(user_data.get("emailVerified", True))
            }
    except Exception:
        return None

