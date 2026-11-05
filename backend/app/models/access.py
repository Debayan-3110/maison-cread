"""Address book and auth sessions (E1.7, E1.11)."""
from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base, TimestampMixin


class Address(Base, TimestampMixin):
    __tablename__ = "user_addresses"
    __table_args__ = (UniqueConstraint("user_id", "label", name="uq_address_label"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    label = Column(String(40), default="home")
    line1 = Column(String(255), nullable=False)
    line2 = Column(String(255), default="")
    landmark = Column(String(255), default="")
    city = Column(String(80), nullable=False)
    state = Column(String(80), nullable=False)
    pincode = Column(String(12), nullable=False, index=True)
    phone = Column(String(32), nullable=False)
    lat = Column(Numeric(9, 6), nullable=True)
    lng = Column(Numeric(9, 6), nullable=True)
    is_default = Column(Boolean, default=False)
    is_serviceable = Column(Boolean, default=True)

    user = relationship("User", back_populates="addresses")

    def to_dict(self) -> dict:
        return {
            "id": self.id, "label": self.label, "line1": self.line1,
            "line2": self.line2, "landmark": self.landmark, "city": self.city,
            "state": self.state, "pincode": self.pincode, "phone": self.phone,
            "isDefault": bool(self.is_default),
            "isServiceable": bool(self.is_serviceable),
        }


class UserSession(Base, TimestampMixin):
    """Refresh-token sessions: rotation, reuse detection, per-device revoke."""

    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    refresh_token_hash = Column(String(64), unique=True, nullable=False, index=True)
    family_id = Column(String(36), nullable=False, index=True)
    device = Column(String(160), default="unknown")
    ip = Column(String(64), nullable=True)
    user_agent = Column(String(400), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    replaced_by = Column(String(64), nullable=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="login_sessions")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "device": self.device,
            "ip": self.ip,
            "userAgent": self.user_agent,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "lastSeenAt": self.last_seen_at.isoformat() if self.last_seen_at else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "revoked": self.revoked_at is not None,
            "current": False,
        }
