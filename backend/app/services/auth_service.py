"""Registration + login with lockout and audit (E1.1, E1.6, E1.8, E16.3).

Status codes/messages match the legacy contract asserted by
``backend/test_auth.py``: attempts 1-4 -> 401 "… N attempts remaining before
account lockout.", the 5th -> 403 "Account locked: 5 failed attempts reached…",
a correct password while locked -> 403 "… temporarily locked …".
"""
from __future__ import annotations

from datetime import timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core import auth
from backend.app.core.config import settings
from backend.app.core.logging import get_security_logger, logger
from backend.app.models.compliance import AuditLog, LoginAttempt
from backend.app.models.user import User, UserRole, UserStatus
from backend.app.services import notify_service
from backend.app.services.session_service import SessionService, naive_utc, now

security = get_security_logger()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.sessions = SessionService(db)

    def audit(self, *, actor: Optional[User], action: str, entity: str,
              entity_id: Any = None, ip: Optional[str] = None,
              after: Optional[dict] = None, reason: Optional[str] = None) -> None:
        self.db.add(AuditLog(
            actor_id=actor.id if actor else None,
            actor_role=actor.role if actor else None,
            action=action, entity=entity,
            entity_id=str(entity_id) if entity_id is not None else None,
            after=after, reason=reason, ip=ip))

    def _record_attempt(self, email: str, ip: str, success: bool, ua: str) -> None:
        self.db.add(LoginAttempt(ip=ip or "unknown", email=(email or "")[:255],
                                 success=success, user_agent=(ua or "unknown")[:400]))

    def _ip_throttled(self, ip: str) -> bool:
        since = naive_utc(now() - timedelta(minutes=settings.LOGIN_IP_WINDOW_MINUTES))
        failures = (self.db.query(LoginAttempt)
                    .filter(LoginAttempt.ip == ip, LoginAttempt.success.is_(False),
                            LoginAttempt.created_at >= since).count())
        return failures >= settings.LOGIN_IP_MAX_FAILURES

    def register(self, *, email: str, password: str, full_name: str = "",
                 address: str = "", phone: Optional[str] = None,
                 role: str = UserRole.CUSTOMER, ip: Optional[str] = None) -> Dict[str, Any]:
        email = (email or "").strip().lower()
        if not auth.is_valid_email(email):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid email address")
        ok, message = auth.validate_password_strength(password)
        if not ok:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, message)
        if self.db.query(User).filter(User.email == email).first():
            raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

        token = auth.generate_random_token(32)
        user = User(
            email=email, hashed_password=auth.hash_password(password),
            full_name=(full_name or "").strip() or email.split("@")[0],
            address=address or "", phone=phone, role=role, is_verified=False,
            verification_token=token,
            verification_token_expires_at=naive_utc(
                now() + timedelta(hours=settings.EMAIL_VERIFICATION_EXPIRE_HOURS)),
            referral_code=auth.generate_random_token(6).upper()[:8],
        )
        self.db.add(user)
        self.db.flush()
        notify_service.send_template(self.db, email_type="verification", recipient=email,
                                     name=user.full_name, token=token)
        self.audit(actor=user, action="user.registered", entity="user",
                   entity_id=user.id, ip=ip)
        self.db.commit()
        self.db.refresh(user)
        logger.info("registered %s (id=%s)", email, user.id)
        return {
            "success": True,
            "message": "Registration successful. Verify your email to unlock checkout.",
            "verificationToken": token,
            "verificationLink": f"{settings.STOREFRONT_URL}/verify-email?token={token}",
            "user": user.to_public_dict(),
        }

    def ensure_guest(self, email: Optional[str] = None) -> User:
        """Guest checkout principal, claimable later via a magic link (E1.6)."""
        token = auth.generate_random_token(8)
        user = User(
            email=(email or f"guest-{token.lower()}@guest.shopcread.local").lower(),
            hashed_password=auth.hash_password(auth.generate_random_token(24)),
            full_name="Guest", is_guest=True, is_verified=True,
            claim_token=auth.generate_random_token(16), referral_code=token.upper()[:8])
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def login(self, *, email: str, password: str, ip: str = "unknown",
              user_agent: str = "unknown", remember: bool = False) -> Dict[str, Any]:
        email = (email or "").strip().lower()
        user = self.db.query(User).filter(User.email == email).first()

        if self._ip_throttled(ip):
            raise HTTPException(status.HTTP_429_TOO_MANY_REQUESTS,
                                "Too many sign-in attempts from this network. "
                                "Try again later.")

        locked_until = None
        if user and user.lockout_until:
            locked_until = user.lockout_until
            if not locked_until.tzinfo:
                locked_until = locked_until.replace(tzinfo=timezone.utc)
        if user and locked_until and locked_until > now():
            minutes = max(1, int((locked_until - now()).total_seconds() // 60) + 1)
            self._record_attempt(email, ip, False, user_agent)
            self.db.commit()
            security.warning("login blocked (locked) email=%s ip=%s", email, ip)
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Account temporarily locked after {settings.MAX_LOGIN_FAILED_ATTEMPTS} "
                f"failed attempts. Try again in {minutes} minute(s).")

        if not user or not auth.verify_password(password, user.hashed_password):
            self._record_attempt(email, ip, False, user_agent)
            if user:
                user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
                remaining = settings.MAX_LOGIN_FAILED_ATTEMPTS - user.failed_login_attempts
                if remaining <= 0:
                    user.lockout_until = naive_utc(
                        now() + timedelta(minutes=settings.LOCKOUT_DURATION_MINUTES))
                    self.db.commit()
                    security.warning("account locked email=%s ip=%s", email, ip)
                    raise HTTPException(
                        status.HTTP_403_FORBIDDEN,
                        f"Account locked: {settings.MAX_LOGIN_FAILED_ATTEMPTS} failed "
                        "attempts reached. Locked for "
                        f"{settings.LOCKOUT_DURATION_MINUTES} minutes.")
                self.db.commit()
                raise HTTPException(
                    status.HTTP_401_UNAUTHORIZED,
                    f"Invalid email or password. {remaining} attempts remaining "
                    "before account lockout.")
            self.db.commit()
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

        if user.status == UserStatus.SUSPENDED:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")

        user.failed_login_attempts = 0
        user.lockout_until = None
        user.last_login_at = naive_utc(now())

        if user.two_factor_enabled:
            self.db.commit()
            return {"status": "2fa_required", "email": user.email,
                    "tempToken": auth.create_2fa_temp_token(user.id),
                    "message": "Two-factor authentication required"}

        result = self.sessions.issue_session(user, remember=remember, ip=ip,
                                             user_agent=user_agent, commit=False)
        self.audit(actor=user, action="user.login", entity="user",
                   entity_id=user.id, ip=ip)
        self.db.commit()
        return result
