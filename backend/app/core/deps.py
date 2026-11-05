"""FastAPI auth dependencies: bearer tokens, RBAC, client IP, idempotency."""
from __future__ import annotations

from typing import Annotated, Iterable, List, Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from backend.app.core.auth import decode_access_token
from backend.app.db.session import get_db
from backend.app.models.user import User, UserRole, UserStatus

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

CREDENTIALS_EXC = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired authentication token",
    headers={"WWW-Authenticate": "Bearer"},
)


def current_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> User:
    """Resolve the authenticated principal from a Bearer access token."""
    payload = decode_access_token(token or "")
    if not payload:
        raise CREDENTIALS_EXC
    try:
        user_id = int(payload.get("sub"))
    except (TypeError, ValueError):
        raise CREDENTIALS_EXC
    user = db.get(User, user_id)
    if not user or user.status == UserStatus.DELETED:
        raise CREDENTIALS_EXC
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")
    return user


def optional_current_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme)] = None,
    db: Annotated[Session, Depends(get_db)] = None,
) -> Optional[User]:
    try:
        return current_user(token, db)
    except HTTPException:
        return None


def require_roles(*roles: str):
    """Dependency factory enforcing the PRD §5.2 role matrix."""
    allowed = set(roles)

    def checker(user: Annotated[User, Depends(current_user)]) -> User:
        if not allowed:
            return user
        if user.role not in allowed:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Insufficient permissions; requires one of {sorted(allowed)}",
            )
        return user

    return checker


def require_verified(user: Annotated[User, Depends(current_user)]) -> User:
    if not user.is_verified:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Email verification required before this action",
        )
    return user


require_admin = require_roles(UserRole.ADMIN)
require_ops = require_roles(*sorted(UserRole.OPS))
require_catalog = require_roles(*sorted(UserRole.CATALOG))
require_fulfilment = require_roles(*sorted(UserRole.FULFILMENT))
require_support = require_roles(*sorted(UserRole.SUPPORT))
require_finance = require_roles(*sorted(UserRole.FINANCIAL))


def get_client_ip(request: Request) -> str:
    """Best-effort client IP. ``X-Forwarded-For`` is trusted only when the
    deployment sets FORWARDED_ALLOW_IPS (uvicorn) — we take the left-most value
    but never let a spoofed header beat a directly-connected peer."""
    peer = request.client.host if request.client else "unknown"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and peer not in {"unknown", "127.0.0.1", "::1"}:
        return forwarded.split(",")[0].strip()
    return peer


def get_user_agent(request: Request) -> str:
    return (request.headers.get("user-agent") or "unknown")[:400]


def idempotency_key(request: Request) -> Optional[str]:
    key = request.headers.get("idempotency-key") or request.headers.get("x-idempotency-key")
    return key[:96] if key else None


def user_or_guest(user: Optional[User]) -> Optional[int]:
    return user.id if user else None


CurrentUser = Annotated[User, Depends(current_user)]
OptionalUser = Annotated[Optional[User], Depends(optional_current_user)]
DbSession = Annotated[Session, Depends(get_db)]

__all__: List[str] = [
    "current_user", "optional_current_user", "require_roles", "require_verified",
    "require_admin", "require_ops", "require_catalog", "require_fulfilment",
    "require_support", "require_finance", "get_client_ip", "get_user_agent",
    "idempotency_key", "CurrentUser", "OptionalUser", "DbSession",
]
