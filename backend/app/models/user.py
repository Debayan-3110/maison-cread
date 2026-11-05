"""Identity + roles (PRD §10.1, E1, E16).

Roles are plain strings (not DB-native enums) so adding one never requires an
enum migration; RBAC itself is enforced in ``core.deps`` from the PRD §5.2
matrix.
"""
from __future__ import annotations

from typing import Any, Dict, List

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Integer, String,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import MONEY, Base, TimestampMixin


class UserRole:
    ADMIN = "admin"
    MANAGER = "manager"
    CUSTOMER = "customer"
    SELLER = "seller"
    WAREHOUSE_OPS = "warehouse_ops"
    SUPPORT_AGENT = "support_agent"
    DELIVERY_PARTNER = "delivery_partner"
    FINANCE = "finance"

    ALL = {ADMIN, MANAGER, CUSTOMER, SELLER, WAREHOUSE_OPS, SUPPORT_AGENT,
           DELIVERY_PARTNER, FINANCE}
    OPS = {ADMIN, MANAGER, WAREHOUSE_OPS, SUPPORT_AGENT, FINANCE}
    CATALOG = {ADMIN, MANAGER}
    FULFILMENT = {ADMIN, MANAGER, WAREHOUSE_OPS}
    SUPPORT = {ADMIN, MANAGER, SUPPORT_AGENT}
    FINANCIAL = {ADMIN, FINANCE, MANAGER}


class UserStatus:
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class LoyaltyTier:
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"

    THRESHOLDS = {BRONZE: 0.0, SILVER: 100_000.0, GOLD: 500_000.0, PLATINUM: 1_500_000.0}
    # Tier perks: extra return window days and support SLA (E8.2 / E11.3).
    BENEFITS = {
        BRONZE: {"return_window_bonus_days": 0, "support_sla_hours": 24},
        SILVER: {"return_window_bonus_days": 3, "support_sla_hours": 12},
        GOLD: {"return_window_bonus_days": 7, "support_sla_hours": 6},
        PLATINUM: {"return_window_bonus_days": 14, "support_sla_hours": 2},
    }

    @classmethod
    def for_spend(cls, lifetime_spend: float) -> str:
        tier = cls.BRONZE
        for name in (cls.SILVER, cls.GOLD, cls.PLATINUM):
            if float(lifetime_spend or 0) >= cls.THRESHOLDS[name]:
                tier = name
        return tier


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(32), index=True, nullable=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(160), default="")
    address = Column(String(500), default="")
    avatar = Column(
        String(500),
        default="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
    )
    role = Column(String(32), default=UserRole.CUSTOMER, nullable=False, index=True)
    status = Column(String(24), default=UserStatus.ACTIVE, nullable=False)

    # Verification + recovery
    is_verified = Column(Boolean, default=False, nullable=False)
    verification_token = Column(String(128), nullable=True, index=True)
    verification_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String(128), nullable=True, index=True)
    reset_token_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Two-factor
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    two_factor_secret = Column(String(64), nullable=True)
    two_factor_backup_codes = Column(JSON, default=list)

    # Brute-force protection
    failed_login_attempts = Column(Integer, default=0, nullable=False)
    lockout_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Guest checkout + referrals
    is_guest = Column(Boolean, default=False, nullable=False)
    claim_token = Column(String(128), nullable=True, index=True)
    referral_code = Column(String(16), unique=True, nullable=True, index=True)
    referred_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Loyalty / wallet (INR)
    tier = Column(String(16), default=LoyaltyTier.BRONZE, nullable=False)
    coins = Column(Integer, default=0, nullable=False)
    wallet_balance = Column(MONEY, default=0, nullable=False)
    lifetime_spend = Column(MONEY, default=0, nullable=False)

    # Compliance (DPDP / GST)
    gstin = Column(String(20), nullable=True)
    kyc_status = Column(String(24), default="unverified", nullable=False)
    consent_marketing = Column(Boolean, default=False, nullable=False)
    erased_at = Column(DateTime(timezone=True), nullable=True)

    addresses = relationship("Address", back_populates="user",
                             cascade="all, delete-orphan", lazy="selectin")
    login_sessions = relationship("UserSession", back_populates="user",
                                  cascade="all, delete-orphan")

    @property
    def name(self) -> str:
        return self.full_name or (self.email.split("@")[0] if self.email else "Guest")

    def to_public_dict(self) -> Dict[str, Any]:
        """Shape consumed by the storefront (``frontend/src/types/models.d.ts``)."""
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "fullName": self.full_name,
            "address": self.address or "",
            "phone": self.phone,
            "avatar": self.avatar,
            "role": self.role,
            "isVerified": bool(self.is_verified),
            "twoFactorEnabled": bool(self.two_factor_enabled),
            "tier": self.tier,
            "coins": self.coins or 0,
            "walletBalance": float(self.wallet_balance or 0),
            "isGuest": bool(self.is_guest),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
