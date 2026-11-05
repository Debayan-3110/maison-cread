"""Compliance + evidence tables: OTP, passkeys, consent, audit, mailbox (E1, E16)."""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint,
)

from backend.app.db.base import Base, TimestampMixin


class OtpChallenge(Base, TimestampMixin):
    """OTP sign-in. Only the SHA-256 hash is stored — never the plaintext."""

    __tablename__ = "otp_challenges"

    id = Column(Integer, primary_key=True)
    identifier = Column(String(255), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    purpose = Column(String(24), default="signin")
    otp_hash = Column(String(64), nullable=False)
    channel = Column(String(24), default="email")
    attempts = Column(Integer, default=0, nullable=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    last_sent_at = Column(DateTime(timezone=True), nullable=True)


class WebauthnCredential(Base, TimestampMixin):
    """Passkey public keys (E1.4)."""

    __tablename__ = "webauthn_credentials"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    credential_id = Column(String(255), unique=True, nullable=False)
    public_key = Column(Text, nullable=False)
    sign_count = Column(Integer, default=0, nullable=False)
    transports = Column(String(120), default="")
    nickname = Column(String(80), default="passkey")


class Consent(Base, TimestampMixin):
    """DPDP consent evidence (E1.10)."""

    __tablename__ = "consents"
    __table_args__ = (UniqueConstraint("user_id", "purpose", name="uq_consent_purpose"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    purpose = Column(String(64), nullable=False)
    granted = Column(Boolean, default=True, nullable=False)
    policy_version = Column(String(24), default="v1")
    ip = Column(String(64), nullable=True)


class AuditLog(Base, TimestampMixin):
    """Append-only audit trail (E13.9 / E16.9)."""

    __tablename__ = "audit_log"
    __table_args__ = (Index("ix_audit_entity", "entity", "entity_id"),)

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, nullable=True, index=True)
    actor_role = Column(String(32), nullable=True)
    action = Column(String(96), nullable=False, index=True)
    entity = Column(String(64), nullable=False)
    entity_id = Column(String(64), nullable=True)
    before = Column(JSON, nullable=True)
    after = Column(JSON, nullable=True)
    reason = Column(String(255), nullable=True)
    ip = Column(String(64), nullable=True)


class LoginAttempt(Base, TimestampMixin):
    """Per-IP / per-account failure evidence for lockout + anomaly review."""

    __tablename__ = "login_attempts"
    __table_args__ = (Index("ix_login_attempts_ip_time", "ip", "created_at"),)

    id = Column(Integer, primary_key=True)
    ip = Column(String(64), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    success = Column(Boolean, default=False, nullable=False)
    user_agent = Column(String(400), nullable=True)


class MockEmail(Base, TimestampMixin):
    """Dev mailbox: messages are stored instead of sent while MOCK_EMAILS=true."""

    __tablename__ = "mock_emails"

    id = Column(Integer, primary_key=True)
    recipient = Column(String(255), nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    email_type = Column(String(32), nullable=False)
    token = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)

    def to_dict(self) -> dict:
        stamp = self.created_at.isoformat() if self.created_at else None
        return {
            "id": self.id,
            "recipient": self.recipient,
            "subject": self.subject,
            "emailType": self.email_type,
            "token": self.token,
            "body": self.body,
            "createdAt": stamp,
            "created_at": stamp,
        }
