"""Returns / exchange / reverse logistics, warranty and service (E8, E9)."""
from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Index, Integer, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import MONEY, Base, TimestampMixin, utcnow


class ReturnRequest(Base, TimestampMixin):
    __tablename__ = "returns"
    __table_args__ = (Index("ix_returns_order_state", "order_id", "state"),)

    id = Column(Integer, primary_key=True)
    rma_number = Column(String(24), unique=True, nullable=False, index=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    user_id = Column(Integer, nullable=True, index=True)
    type = Column(String(16), default="return")  # return | exchange | replacement
    reason = Column(String(64), default="changed_mind")
    reason_detail = Column(String(400), default="")
    state = Column(String(24), default="requested", nullable=False)
    refund_amount_inr = Column(MONEY, default=0)
    restocking_fee_inr = Column(MONEY, default=0)
    payout_mode = Column(String(24), default="original_payment")
    pickup_slot = Column(String(64), nullable=True)
    pickup_awb = Column(String(40), nullable=True)
    qc_result = Column(String(32), nullable=True)
    decided_by = Column(Integer, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)
    refund_utr = Column(String(64), nullable=True)
    exchange_product_id = Column(Integer, nullable=True)

    items = relationship("ReturnItem", back_populates="return_request",
                         cascade="all, delete-orphan", lazy="selectin")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "rmaNumber": self.rma_number,
            "orderId": self.order_id,
            "type": self.type,
            "reason": self.reason,
            "reasonDetail": self.reason_detail,
            "state": self.state,
            "refundAmount": float(self.refund_amount_inr or 0),
            "restockingFee": float(self.restocking_fee_inr or 0),
            "payoutMode": self.payout_mode,
            "pickupSlot": self.pickup_slot,
            "pickupAwb": self.pickup_awb,
            "qcResult": self.qc_result,
            "refundUtr": self.refund_utr,
            "items": [item.to_dict() for item in self.items],
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class ReturnItem(Base, TimestampMixin):
    __tablename__ = "return_items"

    id = Column(Integer, primary_key=True)
    return_id = Column(Integer, ForeignKey("returns.id", ondelete="CASCADE"), index=True)
    order_line_id = Column(Integer, nullable=False)
    product_id = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)
    refund_line_inr = Column(MONEY, default=0)
    restock = Column(Boolean, default=True)
    qc_note = Column(String(255), nullable=True)

    return_request = relationship("ReturnRequest", back_populates="items")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "orderLineId": self.order_line_id,
            "productId": self.product_id,
            "quantity": self.quantity,
            "refundAmount": float(self.refund_line_inr or 0),
            "restock": bool(self.restock),
            "qcNote": self.qc_note,
        }


class WarrantyRegistration(Base, TimestampMixin):
    __tablename__ = "warranty_registrations"
    __table_args__ = (UniqueConstraint("serial", "order_id", name="uq_warranty_serial"),)

    id = Column(Integer, primary_key=True)
    serial = Column(String(64), nullable=False, index=True)
    order_id = Column(String(24), nullable=False, index=True)
    product_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True)
    purchased_at = Column(DateTime(timezone=True), default=utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    extended_plan = Column(String(32), nullable=True)

    def to_dict(self) -> dict:
        return {
            "serial": self.serial,
            "orderId": self.order_id,
            "productId": self.product_id,
            "purchasedAt": self.purchased_at.isoformat() if self.purchased_at else None,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "extendedPlan": self.extended_plan,
        }


class ServiceRequest(Base, TimestampMixin):
    __tablename__ = "service_requests"

    id = Column(Integer, primary_key=True)
    ticket_ref = Column(String(24), unique=True, nullable=False)
    serial = Column(String(64), nullable=True, index=True)
    product_id = Column(Integer, nullable=True)
    user_id = Column(Integer, nullable=True, index=True)
    type = Column(String(24), default="repair")  # repair | install | demo
    state = Column(String(24), default="booked")
    centre = Column(String(120), nullable=True)
    slot = Column(String(64), nullable=True)
    charge_inr = Column(MONEY, default=0)
    notes = Column(Text, default="")

    def to_dict(self) -> dict:
        return {
            "ticketRef": self.ticket_ref, "serial": self.serial,
            "productId": self.product_id, "type": self.type, "state": self.state,
            "centre": self.centre, "slot": self.slot,
            "charge": float(self.charge_inr or 0), "notes": self.notes,
        }
