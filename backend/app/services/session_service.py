"""Sessions + token rotation (E1.5, E1.7).

Refresh tokens rotate on every use and are stored only as SHA-256 hashes.
Presenting an already-rotated token revokes the whole family, which is the
reuse-detection behaviour asserted by ``backend/test_auth.py``.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core import auth
from backend.app.core.config import settings
from backend.app.core.logging import get_security_logger
from backend.app.models.access import UserSession
from backend.app.models.user import User

security = get_security_logger()


def now() -> datetime:
    return datetime.now(timezone.utc)


def naive_utc(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    return value - value.utcoffset() if value.tzinfo else value


def aware(value: Optional[datetime]) -> Optional[datetime]:
    if value is None:
        return None
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


class SessionService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def issue_session(self, user: User, *, remember: bool = False, ip: str = "unknown",
                      user_agent: str = "unknown", family_id: Optional[str] = None,
                      commit: bool = True) -> Dict[str, Any]:
        raw, token_hash, expires_at = auth.create_refresh_token(
            user.id, family_id=family_id, remember=remember)
        payload = auth.decode_refresh_token(raw) or {}
        self.db.add(UserSession(
            user_id=user.id, refresh_token_hash=token_hash,
            family_id=payload.get("family", "unknown"),
            device=(user_agent or "unknown")[:60], ip=ip,
            user_agent=(user_agent or "unknown")[:400],
            expires_at=naive_utc(expires_at), last_seen_at=naive_utc(now()),
        ))
        if commit:
            self.db.commit()
        return {
            "status": "authenticated",
            "accessToken": auth.create_access_token(user),
            "refreshToken": raw,
            "expiresIn": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user.to_public_dict(),
        }

    def complete_2fa_login(self, *, temp_token: str, code: str, ip: str,
                           user_agent: str, remember: bool = False) -> Dict[str, Any]:
        payload = auth.decode_2fa_temp_token(temp_token or "")
        if not payload:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED,
                                "2FA challenge expired. Please sign in again.")
        user = self.db.get(User, int(payload["sub"]))
        if not user or not user.two_factor_enabled:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account not found")
        verified = auth.verify_totp_code(user.two_factor_secret or "", code)
        if not verified:
            matched, remaining = auth.redeem_backup_code(user.two_factor_backup_codes, code)
            if matched:
                user.two_factor_backup_codes = remaining
                verified = True
        if not verified:
            security.warning("2FA verification failed user=%s", user.id)
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid authentication code")
        return self.issue_session(user, remember=remember, ip=ip, user_agent=user_agent)

    def refresh(self, raw_refresh: str, *, ip: str = "unknown") -> Dict[str, Any]:
        payload = auth.decode_refresh_token(raw_refresh or "")
        if not payload:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid refresh token")
        session = (self.db.query(UserSession)
                   .filter(UserSession.refresh_token_hash == auth.hash_token(raw_refresh))
                   .first())
        if not session:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown refresh token")

        if session.revoked_at is not None:
            # Token reuse: burn the whole family (E1.7 / E16.3).
            self.revoke_family(session.family_id)
            self.db.commit()
            security.warning("refresh reuse user=%s family=%s",
                             session.user_id, session.family_id)
            raise HTTPException(
                status.HTTP_401_UNAUTHORIZED,
                "Security breach detected: reused refresh token. All sessions revoked.")

        expires = aware(session.expires_at)
        if expires and expires < now():
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Refresh token expired")

        user = self.db.get(User, session.user_id)
        if not user:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Account unavailable")

        session.revoked_at = naive_utc(now())
        result = self.issue_session(user, remember=bool(payload.get("remember")), ip=ip,
                                    user_agent=session.user_agent or "unknown",
                                    family_id=session.family_id, commit=False)
        session.replaced_by = auth.hash_token(result["refreshToken"])
        self.db.commit()
        return result

    def revoke_family(self, family_id: str) -> int:
        return (self.db.query(UserSession)
                .filter(UserSession.family_id == family_id,
                        UserSession.revoked_at.is_(None))
                .update({"revoked_at": naive_utc(now())}))

    def logout(self, raw_refresh: Optional[str]) -> Dict[str, Any]:
        if raw_refresh:
            session = (self.db.query(UserSession)
                       .filter(UserSession.refresh_token_hash
                               == auth.hash_token(raw_refresh)).first())
            if session and session.revoked_at is None:
                session.revoked_at = naive_utc(now())
        self.db.commit()
        return {"success": True, "message": "Signed out"}

    def revoke_user_sessions(self, user_id: int) -> int:
        return (self.db.query(UserSession)
                .filter(UserSession.user_id == user_id, UserSession.revoked_at.is_(None))
                .update({"revoked_at": naive_utc(now())}))

    def list_sessions(self, user_id: int, current_hash: Optional[str] = None):
        rows = (self.db.query(UserSession).filter(UserSession.user_id == user_id)
                .order_by(UserSession.id.desc()).limit(50).all())
        items = []
        for row in rows:
            data = row.to_dict()
            data["current"] = bool(current_hash and row.refresh_token_hash == current_hash)
            items.append(data)
        return items

    def revoke_session(self, user_id: int, session_id: int) -> Dict[str, Any]:
        session = self.db.get(UserSession, session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Session not found")
        if session.revoked_at is None:
            session.revoked_at = naive_utc(now())
            self.db.commit()
        return {"success": True, "revoked": session_id}

