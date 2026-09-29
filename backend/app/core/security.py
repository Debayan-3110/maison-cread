import os
import re
import io
import base64
import hashlib
import secrets
import datetime
import bcrypt
import jwt
import pyotp
import qrcode
from typing import Optional, Dict, Any, List, Tuple

# Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "shopcread_super_secret_production_key_2026_jwt_auth")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS_DEFAULT = 7
REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER = 30
PASSWORD_RESET_EXPIRE_HOURS = 1
EMAIL_VERIFICATION_EXPIRE_HOURS = 24
MAX_LOGIN_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_MINUTES = 15

# --- Password Security ---

def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """Validate password against strong security criteria."""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, None

def hash_password(password: str) -> str:
    """Hash password using bcrypt with work factor 12."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against bcrypt hash in constant time."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False

# --- Cryptographic Token Helpers ---

def generate_random_token(bytes_count: int = 32) -> str:
    """Generate a URL-safe cryptographically secure random token."""
    return secrets.token_urlsafe(bytes_count)

def hash_token(token: str) -> str:
    """Hash token using SHA-256 for safe database storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

# --- JWT Access & Session Tokens ---

def create_access_token(user: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Create short-lived JWT Access Token (15 mins)."""
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user["id"]),
        "email": user["email"],
        "name": user["full_name"],
        "role": user.get("role", "customer"),
        "is_verified": bool(user["is_verified"]),
        "two_factor_enabled": bool(user.get("two_factor_enabled", 0)),
        "type": "access",
        "iat": now,
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT Access Token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def create_2fa_temp_token(user_id: int, email: str) -> str:
    """Create a 5-minute temporary token for completing the 2FA challenge."""
    now = datetime.datetime.now(datetime.timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": "2fa_temp",
        "iat": now,
        "exp": now + datetime.timedelta(minutes=5)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_2fa_temp_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate temporary 2FA token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "2fa_temp":
            return None
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def create_refresh_token_pair(user_id: int, remember_me: bool = False) -> Tuple[str, str, str]:
    """
    Generate a secure random refresh token.
    Returns: (raw_refresh_token, token_hash, expires_at_iso)
    """
    raw_token = generate_random_token(48)
    token_hash = hash_token(raw_token)
    days = REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER if remember_me else REFRESH_TOKEN_EXPIRE_DAYS_DEFAULT
    expires_at = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=days)).isoformat()
    return raw_token, token_hash, expires_at

# --- Two-Factor Authentication (TOTP) ---

def generate_totp_secret() -> str:
    """Generate a Base32 TOTP secret."""
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str, issuer_name: str = "ShopCread") -> str:
    """Get standard otpauth:// provisioning URI."""
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer_name)

def generate_qr_code_data_url(uri: str) -> str:
    """Generate a Base64-encoded PNG Data URL of the TOTP QR code."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=8,
        border=2,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#4f46e5", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{img_b64}"

def verify_totp_code(secret: str, code: str) -> bool:
    """Verify TOTP 6-digit code with window tolerance for clock drift."""
    try:
        clean_code = code.strip().replace(" ", "")
        totp = pyotp.TOTP(secret)
        return totp.verify(clean_code, valid_window=1)
    except Exception:
        return False

def generate_backup_codes(count: int = 8) -> List[str]:
    """Generate human-readable backup recovery codes (XXXX-XXXX)."""
    codes = []
    for _ in range(count):
        part1 = secrets.token_hex(2).upper()
        part2 = secrets.token_hex(2).upper()
        codes.append(f"{part1}-{part2}")
    return codes

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- In-Memory Refresh Token Store (local dev / single-process) ---
# In production, replace with Redis or a DB-backed token table.
_refresh_token_store: Dict[str, Dict[str, Any]] = {}

def store_refresh_token(token_hash: str, user_id: int, expires_at: str) -> None:
    """Store a hashed refresh token with its metadata."""
    _refresh_token_store[token_hash] = {"user_id": user_id, "expires_at": expires_at}

def get_refresh_token(token_hash: str) -> Optional[Dict[str, Any]]:
    """Retrieve stored refresh token metadata by hash, or None if not found/expired."""
    entry = _refresh_token_store.get(token_hash)
    if entry is None:
        return None
    # Basic expiry check
    try:
        expires = datetime.datetime.fromisoformat(entry["expires_at"])
        if datetime.datetime.now(datetime.timezone.utc) > expires:
            _refresh_token_store.pop(token_hash, None)
            return None
    except Exception:
        pass
    return entry

def revoke_refresh_token(token_hash: str) -> None:
    """Revoke a single refresh token by hash."""
    _refresh_token_store.pop(token_hash, None)

def revoke_all_user_refresh_tokens(user_id: int) -> None:
    """Revoke all refresh tokens belonging to a user."""
    to_delete = [h for h, v in _refresh_token_store.items() if v["user_id"] == user_id]
    for h in to_delete:
        _refresh_token_store.pop(h, None)

def require_role(allowed_roles: List[str]):
    """
    Dependency that requires the user to have one of the specified roles.
    """
    async def role_checker(token: str = Depends(oauth2_scheme)):
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired authentication token"
            )

        user_role = payload.get("role", "customer")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation"
            )
        return payload
    return role_checker
