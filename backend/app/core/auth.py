"""Authentication primitives: passwords, JWTs, TOTP, OTP, backup codes.

Deliberately framework-free (no DB, no FastAPI) so it is trivially unit-testable;
FastAPI wiring lives in ``core.deps``. Tokens are typed so a refresh token can
never be replayed as an access token.
"""
from __future__ import annotations

import hashlib
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

import bcrypt
import jwt
import pyotp

from backend.app.core.config import settings

_TOKEN_TYPE_ACCESS = "access"
_TOKEN_TYPE_REFRESH = "refresh"
_TOKEN_TYPE_2FA = "2fa_temp"

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")
_SPECIALS = r"!@#$%^&*(),.?\":{}|<>"


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """Return ``(ok, message)``; the messages are asserted by the test suite."""
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(f"[{re.escape(_SPECIALS)}]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, None


def is_valid_email(email: str) -> bool:
    return bool(email and _EMAIL_RE.match(email.strip()))


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=settings.BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"),
                              (hashed_password or "").encode("utf-8"))
    except (ValueError, TypeError):
        return False


def generate_random_token(bytes_count: int = 32) -> str:
    return secrets.token_urlsafe(bytes_count)


def hash_token(token: str) -> str:
    return hashlib.sha256((token or "").encode("utf-8")).hexdigest()


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(otp: str) -> str:
    return hash_token(str(otp))


def constant_time_equals(a: str, b: str) -> bool:
    return secrets.compare_digest(str(a or ""), str(b or ""))


def _attr(user: Any, name: str, default: Any = None) -> Any:
    if isinstance(user, dict):
        return user.get(name, default)
    return getattr(user, name, default)


def _user_claims(user: Any) -> Dict[str, Any]:
    return {
        "sub": str(_attr(user, "id", "")),
        "email": _attr(user, "email", "") or "",
        "name": _attr(user, "name", "Guest") or "Guest",
        "role": _attr(user, "role", "customer") or "customer",
        "is_verified": bool(_attr(user, "is_verified", False)),
        "two_factor_enabled": bool(_attr(user, "two_factor_enabled", False)),
        "is_guest": bool(_attr(user, "is_guest", False)),
    }


def _encode(payload: Dict[str, Any], expires: datetime) -> str:
    now = datetime.now(timezone.utc)
    body = {**payload, "iat": now, "exp": expires, "iss": settings.PROJECT_NAME}
    return jwt.encode(body, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(user: Any, expires_delta: Optional[timedelta] = None) -> str:
    expires = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return _encode({**_user_claims(user), "type": _TOKEN_TYPE_ACCESS}, expires)


def create_2fa_temp_token(user_id: int) -> str:
    """Proves the password step passed; grants no resource access by itself."""
    expires = datetime.now(timezone.utc) + timedelta(
        minutes=settings.TEMP_2FA_TOKEN_EXPIRE_MINUTES
    )
    return _encode({"sub": str(user_id), "type": _TOKEN_TYPE_2FA}, expires)


def decode_token(token: str, expected_type: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        return None
    return payload if payload.get("type") == expected_type else None


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    return decode_token(token, _TOKEN_TYPE_ACCESS)


def decode_2fa_temp_token(token: str) -> Optional[Dict[str, Any]]:
    return decode_token(token, _TOKEN_TYPE_2FA)


def create_refresh_token(user_id: int, family_id: Optional[str] = None,
                        remember: bool = False) -> Tuple[str, str, datetime]:
    """Return ``(raw, sha256_hash, expires_at)``; only the hash is persisted."""
    days = (settings.REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER if remember
            else settings.REFRESH_TOKEN_EXPIRE_DAYS)
    expires = datetime.now(timezone.utc) + timedelta(days=days)
    raw = _encode(
        {
            "sub": str(user_id),
            "type": _TOKEN_TYPE_REFRESH,
            "jti": uuid.uuid4().hex,
            "family": family_id or uuid.uuid4().hex,
            "remember": bool(remember),
        },
        expires,
    )
    return raw, hash_token(raw), expires


def decode_refresh_token(token: str) -> Optional[Dict[str, Any]]:
    return decode_token(token, _TOKEN_TYPE_REFRESH)


def generate_totp_secret() -> str:
    return pyotp.random_base32()


def get_totp_uri(secret: str, email: str, issuer: str = "ShopCread") -> str:
    return pyotp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer)


def generate_qr_code_data_url(uri: str) -> Optional[str]:
    """PNG data URL for the authenticator app; ``None`` if Pillow is absent."""
    try:
        import base64
        import io

        import qrcode
    except Exception:  # pragma: no cover - optional dependency
        return None
    try:
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M,
                           box_size=8, border=2)
        qr.add_data(uri)
        qr.make(fit=True)
        image = qr.make_image(fill_color="#0F0E0D", back_color="white")
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode()
    except Exception:  # pragma: no cover - Pillow missing at runtime
        return None


def verify_totp_code(secret: str, code: str, valid_window: int = 1) -> bool:
    try:
        return pyotp.TOTP(secret).verify((code or "").strip().replace(" ", ""),
                                        valid_window=valid_window)
    except (ValueError, TypeError):
        return False


def generate_backup_codes(count: int = 10) -> List[str]:
    return [f"{secrets.token_hex(2).upper()}-{secrets.token_hex(2).upper()}"
            for _ in range(count)]


def hash_backup_code(code: str) -> str:
    return hash_token((code or "").strip().upper())


def redeem_backup_code(codes: Optional[List[str]], code: str) -> Tuple[bool, List[str]]:
    """Consume a single-use backup code; returns ``(matched, remaining)``."""
    remaining = list(codes or [])
    wanted = hash_backup_code(code)
    if wanted in remaining:
        remaining.remove(wanted)
        return True, remaining
    return False, remaining
