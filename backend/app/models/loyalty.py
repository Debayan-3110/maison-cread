"""Loyalty ledger, wallet and referrals (E10).

The user row caches ``coins`` / ``wallet_balance`` / ``lifetime_spend``; the
ledger rows are the reconcilable history and carry an idempotency key so a
replayed event can never double-credit (E15.1).
"""
from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, ForeignKey, Integer, String, UniqueConstraint,
)

from backend.app.db.base import MONEY, Base, TimestampMixin


class LoyaltyEntry(Base, TimestampMixin):
    __tablename__ = "loyalty_ledger"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    direction = Column(String(8), default="earn")  # earn | burn | expire | adjust
    coins = Column(Integer, default=0, nullable=False)
    balance_after = Column(Integer, default=0, nullable=False)
    reason = Column(String(64), default="order")
    order_id = Column(String(24), nullable=True, index=True)
    idempotency_key = Column(String(96), nullable=True, unique=True)
    note = Column(String(255), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "direction": self.direction, "coins": self.coins,
            "balanceAfter": self.balance_after, "reason": self.reason,
            "orderId": self.order_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class WalletTransaction(Base, TimestampMixin):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                     nullable=False, index=True)
    direction = Column(String(8), default="credit")  # credit | debit
    amount_inr = Column(MONEY, default=0, nullable=False)
    balance_after = Column(MONEY, default=0, nullable=False)
    reason = Column(String(64), default="refund")
    order_id = Column(String(24), nullable=True, index=True)
    idempotency_key = Column(String(96), nullable=True, unique=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "direction": self.direction,
            "amount": float(self.amount_inr or 0),
            "balanceAfter": float(self.balance_after or 0),
            "reason": self.reason, "orderId": self.order_id,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class Referral(Base, TimestampMixin):
    __tablename__ = "referrals"
    __table_args__ = (UniqueConstraint("referee_id", name="uq_referral_referee"),)

    id = Column(Integer, primary_key=True)
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    referee_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    code = Column(String(16), nullable=False, index=True)
    state = Column(String(24), default="invited")  # invited|signed_up|first_order
    reward_coins_referrer = Column(Integer, default=0)
    reward_coins_referee = Column(Integer, default=0)
    fraud_flag = Column(Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "code": self.code, "state": self.state,
            "refereeId": self.referee_id,
            "rewardCoinsReferrer": self.reward_coins_referrer,
            "rewardCoinsReferee": self.reward_coins_referee,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
