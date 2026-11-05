"""Marketplace sellers (E12) and the analytics/event tables (E14, E15.4)."""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text,
)

from backend.app.db.base import MONEY, Base, TimestampMixin


class Seller(Base, TimestampMixin):
    __tablename__ = "sellers"

    id = Column(Integer, primary_key=True)
    name = Column(String(160), nullable=False)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    owner_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    gstin = Column(String(20), nullable=True)
    kyc_status = Column(String(24), default="unverified")
    commission_pct = Column(MONEY, default=8)
    rating = Column(MONEY, default=0)
    payout_account = Column(String(120), nullable=True)
    pickup_pincode = Column(String(12), nullable=True)
    is_active = Column(Boolean, default=True)
    policy = Column(JSON, default=dict)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "name": self.name, "slug": self.slug,
            "gstin": self.gstin, "kycStatus": self.kyc_status,
            "commissionPct": float(self.commission_pct or 0),
            "rating": float(self.rating or 0),
            "isActive": bool(self.is_active),
            "pickupPincode": self.pickup_pincode,
        }


class ChatLog(Base, TimestampMixin):
    """AI concierge turn: prompt/response + tokens + cost + guardrails."""

    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True)
    session_id = Column(String(64), nullable=True, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    query = Column(String(1000), nullable=False)
    response = Column(Text, nullable=True)
    recommended_product_ids = Column(String(255), nullable=True)
    action = Column(String(48), nullable=True)
    model = Column(String(48), nullable=True)
    prompt_version = Column(String(24), nullable=True)
    provider = Column(String(24), default="deterministic")  # openai|deterministic
    tokens_in = Column(Integer, default=0)
    tokens_out = Column(Integer, default=0)
    cost_usd = Column(MONEY, default=0)
    latency_ms = Column(Integer, default=0)
    guardrail_violations = Column(Integer, default=0)
    grounded = Column(Boolean, default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "query": self.query,
            "response": self.response or "",
            "recommendedProductIds": self.recommended_product_ids or "",
            "recommended_product_ids": self.recommended_product_ids or "",
            "action": self.action,
            "model": self.model,
            "provider": self.provider,
            "tokensIn": self.tokens_in or 0,
            "tokensOut": self.tokens_out or 0,
            "costUsd": float(self.cost_usd or 0),
            "latencyMs": self.latency_ms or 0,
            "guardrailViolations": self.guardrail_violations or 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ConversionLog(Base, TimestampMixin):
    __tablename__ = "conversion_logs"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, index=True, nullable=False)
    order_id = Column(String(24), nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    source = Column(String(32), default="ai_recommendation")
    revenue = Column(MONEY, default=0.0)


class DomainEvent(Base, TimestampMixin):
    """Transactional outbox: committed with the mutation, then drained (E15.2)."""

    __tablename__ = "domain_events"
    __table_args__ = (Index("ix_events_type_time", "event_type", "created_at"),)

    id = Column(Integer, primary_key=True)
    event_id = Column(String(36), unique=True, nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)
    schema_version = Column(Integer, default=1, nullable=False)
    aggregate_type = Column(String(32), nullable=True)
    aggregate_id = Column(String(64), nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    session_id = Column(String(64), nullable=True)
    anon_id = Column(String(64), nullable=True)
    payload = Column(JSON, default=dict)
    consumed_by = Column(JSON, default=list)
    attempts = Column(Integer, default=0, nullable=False)
    status = Column(String(16), default="pending", nullable=False, index=True)
    last_error = Column(String(400), nullable=True)
    dispatched_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "eventId": self.event_id,
            "eventType": self.event_type,
            "aggregateType": self.aggregate_type,
            "aggregateId": self.aggregate_id,
            "payload": self.payload or {},
            "status": self.status,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
