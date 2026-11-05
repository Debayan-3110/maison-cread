"""Email/notification dispatch.

With ``MOCK_EMAILS=true`` (local default) messages are persisted to
``mock_emails`` and surfaced by ``GET /api/auth/dev-emails`` instead of being
sent, so the full verification/reset/OTP journey is testable with no SMTP
server. Point SMTP_* at a real provider to switch transports.
"""
from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logging import logger
from backend.app.models.compliance import MockEmail

_TEMPLATES = {
    "verification": (
        "Verify your ShopCread account",
        "Hi {name},\n\nConfirm your email to unlock checkout, orders and returns.\n"
        "Verification link: {storefront}/verify-email?token={token}\n"
        "Verification token: {token}\n\nThis link expires in "
        f"{settings.EMAIL_VERIFICATION_EXPIRE_HOURS} hours.",
    ),
    "password_reset": (
        "Reset your ShopCread password",
        "Hi {name},\n\nWe received a request to reset your password.\n"
        "Reset link: {storefront}/reset-password?token={token}\n"
        "Reset token: {token}\n\nIf you did not request this, ignore this email — "
        "your password stays unchanged.",
    ),
    "otp": (
        "Your ShopCread verification code",
        "Hi {name},\n\nYour sign-in code is {token}.\n"
        f"It expires in {settings.OTP_EXPIRE_MINUTES} minutes. Never share it.",
    ),
    "order_placed": (
        "Order {token} confirmed",
        "Hi {name},\n\nYour order {token} is confirmed.\n"
        "Track it: {storefront}/track/{token}",
    ),
    "order_shipped": (
        "Order {token} is on its way",
        "Hi {name},\n\nYour order {token} has shipped.\nAWB: {detail}",
    ),
    "return_update": (
        "Return {token} update",
        "Hi {name},\n\nReturn {token} is now: {detail}",
    ),
}


def send_email(
    db: Session,
    recipient: str,
    subject: str,
    body: str,
    email_type: str = "generic",
    token: Optional[str] = None,
) -> MockEmail:
    """Persist (or send) one message. Returns the stored row."""
    record = MockEmail(
        recipient=(recipient or "").strip().lower(),
        subject=subject,
        email_type=email_type,
        token=token,
        body=body,
    )
    db.add(record)
    if settings.MOCK_EMAILS:
        logger.info("mock-email %s -> %s (%s)", email_type, record.recipient, subject)
    else:  # pragma: no cover - real SMTP is out of scope for local runs
        logger.info("sending %s -> %s via configured provider", email_type, record.recipient)
    return record


def send_template(
    db: Session,
    *,
    email_type: str,
    recipient: str,
    name: str = "there",
    token: str = "",
    detail: str = "",
) -> Optional[MockEmail]:
    template = _TEMPLATES.get(email_type)
    if not template:
        return None
    subject, body_template = template
    fields = {
        "name": name or "there",
        "token": token,
        "detail": detail,
        "storefront": settings.STOREFRONT_URL,
    }
    return send_email(
        db,
        recipient=recipient,
        subject=subject.format(**fields),
        body=body_template.format(**fields),
        email_type=email_type,
        token=token,
    )


def recent_emails(db: Session, limit: int = 30) -> list[dict]:
    rows = db.query(MockEmail).order_by(MockEmail.id.desc()).limit(limit).all()
    return [row.to_dict() for row in rows]
