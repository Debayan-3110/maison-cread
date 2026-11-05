"""Fulfilment + delivery evidence (E6, E7, E9.1).

``order_events`` is DB-driven — the tracking timeline is read from these rows
instead of being fabricated in code (defect D3).
"""
from __future__ import annotations

from sqlalchemy import (
    JSON, Column, DateTime, ForeignKey, Index, Integer, String,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base, TimestampMixin


class OrderEvent(Base, TimestampMixin):
    """Authoritative, append-only order/tracking timeline."""

    __tablename__ = "order_events"
    __table_args__ = (Index("ix_order_events_order_time", "order_id", "created_at"),)

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    status = Column(String(40), nullable=False)
    title = Column(String(120), default="")
    description = Column(String(400), default="")
    location = Column(String(160), nullable=True)
    actor_id = Column(Integer, nullable=True)
    actor_role = Column(String(32), nullable=True)
    reason_code = Column(String(32), nullable=True)
    eta = Column(DateTime(timezone=True), nullable=True)
    payload = Column(JSON, default=dict)

    order = relationship("Order", back_populates="events")

    def to_dict(self) -> dict:
        return {
            "status": self.status,
            "title": self.title,
            "description": self.description,
            "location": self.location,
            "reasonCode": self.reason_code,
            "date": self.created_at.strftime("%b %d, %I:%M %p") if self.created_at else "",
            "timestamp": self.created_at.isoformat() if self.created_at else None,
            "completed": True,
        }


class Shipment(Base, TimestampMixin):
    """One package (LPN) inside an order; courier adapters live in services."""

    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    lpn = Column(String(40), nullable=True)
    courier = Column(String(40), nullable=True)
    awb = Column(String(40), nullable=True, index=True)
    label_url = Column(String(500), nullable=True)
    manifest_ref = Column(String(64), nullable=True)
    status = Column(String(32), default="created")
    attempts = Column(Integer, default=0)
    ndrs = Column(JSON, default=list)  # non-delivery reports (E7.6)
    pod = Column(JSON, default=dict)   # signature / photo / geo / OTP / serials
    picked_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "orderId": self.order_id, "lpn": self.lpn,
            "courier": self.courier, "awb": self.awb, "status": self.status,
            "attempts": self.attempts or 0, "ndrs": self.ndrs or [],
            "pod": self.pod or {},
            "labelUrl": self.label_url,
            "shippedAt": self.shipped_at.isoformat() if self.shipped_at else None,
            "deliveredAt": self.delivered_at.isoformat() if self.delivered_at else None,
        }


class SerialNumber(Base, TimestampMixin):
    """Serial capture at dispatch + public authenticity verification (E9.1)."""

    __tablename__ = "serial_numbers"

    id = Column(Integer, primary_key=True)
    serial = Column(String(64), unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    order_id = Column(String(24), nullable=True, index=True)
    imei = Column(String(32), nullable=True)
    status = Column(String(24), default="in_inventory")  # in_inventory|sold|returned|flagged
    seller_id = Column(Integer, nullable=True)
    warranty_until = Column(DateTime(timezone=True), nullable=True)
    purchase_date = Column(DateTime(timezone=True), nullable=True)
    verified_count = Column(Integer, default=0)

    def to_dict(self) -> dict:
        return {
            "serial": self.serial,
            "productId": self.product_id,
            "orderId": self.order_id,
            "status": self.status,
            "genuine": self.status in {"sold", "in_inventory"},
            "warrantyUntil": (self.warranty_until.isoformat()
                              if self.warranty_until else None),
            "verifiedCount": self.verified_count or 0,
        }
