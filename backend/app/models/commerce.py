"""Promotions, orders and order lines (PRD §10.4, E4, E5).

Orders keep the legacy JSON payload columns (``shipping_info`` /
``payment_info`` / ``summary``) for storefront compatibility **and** normalised
INR money columns for analytics and finance. Money is ``NUMERIC(14,2)`` INR.
"""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, Numeric, String,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import MONEY, Base, TimestampMixin, utcnow
from backend.app.models.status import OrderStatus


class Promotion(Base, TimestampMixin):
    """Coupons as data: stacking rules, caps and validity windows."""

    __tablename__ = "promotions"

    id = Column(Integer, primary_key=True)
    code = Column(String(40), unique=True, nullable=False, index=True)
    name = Column(String(120), default="")
    type = Column(String(20), default="percent", nullable=False)
    value = Column(Numeric(12, 2), default=0, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    min_subtotal_inr = Column(MONEY, default=0)
    max_discount_inr = Column(MONEY, nullable=True)
    usage_limit = Column(Integer, nullable=True)
    per_user_limit = Column(Integer, nullable=True)
    redeem_count = Column(Integer, default=0, nullable=False)
    stackable = Column(Boolean, default=False, nullable=False)
    channel = Column(String(24), default="any")
    tier = Column(String(16), nullable=True)
    starts_at = Column(DateTime(timezone=True), nullable=True)
    ends_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    free_shipping_level = Column(String(16), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "code": self.code, "name": self.name, "type": self.type,
            "value": float(self.value or 0),
            "minSubtotal": float(self.min_subtotal_inr or 0),
            "maxDiscount": float(self.max_discount_inr) if self.max_discount_inr else None,
            "stackable": bool(self.stackable),
            "startsAt": self.starts_at.isoformat() if self.starts_at else None,
            "endsAt": self.ends_at.isoformat() if self.ends_at else None,
            "isActive": bool(self.is_active),
            "redeemCount": self.redeem_count or 0,
        }


class Order(Base, TimestampMixin):
    __tablename__ = "orders"
    __table_args__ = (
        Index("ix_orders_user_created", "user_id", "created_at"),
        Index("ix_orders_status_created", "status", "created_at"),
    )

    id = Column(String(24), primary_key=True)  # e.g. ORD-2026-000123
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"),
                     nullable=True, index=True)

    # Legacy payload columns consumed verbatim by the storefront.
    date = Column(String(24), nullable=True)
    shipping_info = Column(JSON, default=dict)
    payment_info = Column(JSON, default=dict)
    summary = Column(JSON, default=dict)

    status = Column(String(32), default=OrderStatus.PLACED, nullable=False, index=True)
    estimated_delivery = Column(String(40), nullable=True)
    promised_by = Column(DateTime(timezone=True), nullable=True)
    placed_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    subtotal_inr = Column(MONEY, default=0, nullable=False)
    discount_inr = Column(MONEY, default=0, nullable=False)
    tax_inr = Column(MONEY, default=0, nullable=False)
    shipping_inr = Column(MONEY, default=0, nullable=False)
    cod_fee_inr = Column(MONEY, default=0, nullable=False)
    coins_redeemed = Column(Integer, default=0, nullable=False)
    coins_earned = Column(Integer, default=0, nullable=False)
    total_inr = Column(MONEY, default=0, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)

    awb = Column(String(40), nullable=True, index=True)
    courier = Column(String(40), nullable=True)
    tracking_token = Column(String(48), nullable=True, index=True)
    pincode = Column(String(12), nullable=True, index=True)
    zone = Column(String(24), nullable=True)
    coupon_code = Column(String(40), nullable=True)
    idempotency_key = Column(String(96), nullable=True, unique=True)
    attribution = Column(String(24), default="organic", nullable=False)
    session_id = Column(String(64), nullable=True, index=True)
    gift_wrap = Column(Boolean, default=False)
    delivery_instruction = Column(String(255), nullable=True)
    cancel_reason = Column(String(255), nullable=True)

    items = relationship("OrderItem", back_populates="order",
                         cascade="all, delete-orphan", lazy="selectin")
    events = relationship("OrderEvent", back_populates="order",
                          cascade="all, delete-orphan", lazy="selectin",
                          order_by="OrderEvent.created_at")
    payments = relationship("Payment", back_populates="order",
                            cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Contract consumed by ``types/models.d.ts`` (Order)."""
        return {
            "id": self.id,
            "userId": self.user_id,
            "date": self.date,
            "items": [item.to_dict() for item in self.items],
            "shippingInfo": self.shipping_info or {},
            "paymentInfo": self.payment_info or {},
            "summary": self.summary or {},
            "status": self.status,
            "estimatedDelivery": self.estimated_delivery,
            "awb": self.awb,
            "courier": self.courier,
            "couponCode": self.coupon_code,
            "attribution": self.attribution,
            "trackingToken": self.tracking_token,
            "totals": {
                "subtotal": float(self.subtotal_inr or 0),
                "discount": float(self.discount_inr or 0),
                "tax": float(self.tax_inr or 0),
                "shipping": float(self.shipping_inr or 0),
                "total": float(self.total_inr or 0),
                "currency": self.currency,
            },
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    product_id = Column(Integer, index=True)
    sku = Column(String(64), nullable=True)
    title = Column(String(255), default="")
    thumbnail = Column(String(500), nullable=True)
    category = Column(String(80), nullable=True)
    quantity = Column(Integer, default=1, nullable=False)
    unit_price = Column(Numeric(10, 2), default=0)  # catalogue currency (USD)
    unit_price_inr = Column(MONEY, default=0)
    discount_inr = Column(MONEY, default=0)
    tax_rate = Column(Numeric(5, 4), default=0)
    tax_inr = Column(MONEY, default=0)
    line_total_inr = Column(MONEY, default=0)
    serial_number = Column(String(64), nullable=True)
    fulfillment_status = Column(String(24), default="pending")

    order = relationship("Order", back_populates="items")

    def to_dict(self) -> dict:
        return {
            "id": self.product_id,
            "lineId": self.id,
            "productId": self.product_id,
            "sku": self.sku,
            "title": self.title,
            "thumbnail": self.thumbnail,
            "category": self.category,
            "price": float(self.unit_price_inr or 0),
            "priceInr": float(self.unit_price_inr or 0),
            "unitPriceUsd": float(self.unit_price or 0),
            "quantity": self.quantity,
            "discount": float(self.discount_inr or 0),
            "tax": float(self.tax_inr or 0),
            "lineTotal": float(self.line_total_inr or 0),
            "serialNumber": self.serial_number,
            "fulfillmentStatus": self.fulfillment_status,
        }
