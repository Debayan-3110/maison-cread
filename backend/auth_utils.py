"""
Authentication and cryptographic utilities for ShopCread.
"""
import os
import re
import io
import base64
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List, Tuple
import bcrypt
import jwt
import pyotp
import qrcode

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "shopcread_super_secret_production_key_2026_jwt_auth")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

SPECIALS = r"!@#$%^&*(),.?\":{}|<>"

def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r"\d", password):
        return False, "Password must contain at least one number."
    if not re.search(f"[{re.escape(SPECIALS)}]", password):
        return False, "Password must contain at least one special character (!@#$%^&* etc.)."
    return True, None

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), (hashed_password or "").encode("utf-8"))
    except Exception:
        return False

def generate_random_token(bytes_count: int = 32) -> str:
    return secrets.token_hex(bytes_count)

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()

def create_access_token(user: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload = {
        "sub": str(user.get("id")),
        "user_id": user.get("id"),
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "role": user.get("role", "customer"),
        "type": "access",
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except jwt.PyJWTError:
        return None

def create_2fa_temp_token(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=5)
    payload = {
        "sub": str(user_id),
        "user_id": user_id,
        "email": email,
        "type": "2fa_temp",
        "exp": expire
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_2fa_temp_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "2fa_temp":
            return None
        return payload
    except jwt.PyJWTError:
        return None

def create_refresh_token_pair(user_id: int, remember_me: bool = False) -> Tuple[str, str, str]:
    raw_token = generate_random_token(32)
    token_hash = hash_token(raw_token)
    days = 30 if remember_me else 7
    expires_at = (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
    return raw_token, token_hash, expires_at

def generate_totp_secret() -> str:
    return pyotp.random_base32()

def get_totp_uri(secret: str, email: str, issuer_name: str = "ShopCread") -> str:
    return pyotp.totp.TOTP(secret).provisioning_uri(name=email, issuer_name=issuer_name)

def generate_qr_code_data_url(uri: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=2,
    )
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
    return f"data:image/png;base64,{b64_str}"

def verify_totp_code(secret: str, code: str) -> bool:
    try:
        clean_code = str(code).strip()
        totp = pyotp.TOTP(secret)
        return bool(totp.verify(clean_code, valid_window=1))
    except Exception:
        return False

def generate_backup_codes(count: int = 8) -> List[str]:
    return [secrets.token_hex(4).upper() for _ in range(count)]

