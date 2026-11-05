"""Cash side: payments, refunds, GST invoices, seller payouts (E5, E12, E16.5).

Card data is never stored — only brand + last4 (PCI-DSS scope reduction).
"""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Integer, String, Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import MONEY, Base, TimestampMixin
from backend.app.models.status import PaymentStatus


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    user_id = Column(Integer, nullable=True, index=True)
    gateway = Column(String(32), default="shopcread-sim", nullable=False)
    method = Column(String(24), default="card", nullable=False)
    status = Column(String(24), default=PaymentStatus.PENDING, nullable=False, index=True)
    amount_inr = Column(MONEY, default=0, nullable=False)
    currency = Column(String(8), default="INR", nullable=False)
    reference = Column(String(96), nullable=True, unique=True)
    provider_ref = Column(String(96), nullable=True)
    card_brand = Column(String(24), nullable=True)
    last4 = Column(String(4), nullable=True)
    emi_months = Column(Integer, nullable=True)
    failure_reason = Column(String(255), nullable=True)
    captured_at = Column(DateTime(timezone=True), nullable=True)

    order = relationship("Order", back_populates="payments")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "orderId": self.order_id,
            "method": self.method,
            "status": self.status,
            "amount": float(self.amount_inr or 0),
            "currency": self.currency,
            "reference": self.reference,
            "providerRef": self.provider_ref,
            "cardBrand": self.card_brand,
            "last4": self.last4,
            "emiMonths": self.emi_months,
            "failureReason": self.failure_reason,
            "capturedAt": self.captured_at.isoformat() if self.captured_at else None,
        }


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"), index=True)
    return_id = Column(Integer, nullable=True)
    amount_inr = Column(MONEY, default=0, nullable=False)
    status = Column(String(24), default="initiated", nullable=False, index=True)
    mode = Column(String(24), default="original_payment")  # original_payment|wallet
    utr = Column(String(64), nullable=True)
    reason = Column(String(255), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id, "orderId": self.order_id, "returnId": self.return_id,
            "amount": float(self.amount_inr or 0), "status": self.status,
            "mode": self.mode, "utr": self.utr, "reason": self.reason,
            "processedAt": self.processed_at.isoformat() if self.processed_at else None,
        }


class Invoice(Base, TimestampMixin):
    """GST invoice + e-invoice reference (E16.5)."""

    __tablename__ = "invoices"
    __table_args__ = (UniqueConstraint("order_id", name="uq_invoice_order"),)

    id = Column(Integer, primary_key=True)
    order_id = Column(String(24), ForeignKey("orders.id", ondelete="CASCADE"),
                      nullable=False, index=True)
    invoice_number = Column(String(40), unique=True, nullable=False)
    irn = Column(String(64), nullable=True)
    qr_code = Column(Text, nullable=True)
    seller_gstin = Column(String(20), nullable=True)
    buyer_gstin = Column(String(20), nullable=True)
    hsn_summary = Column(JSON, default=list)
    tax_breakup = Column(JSON, default=dict)
    total_inr = Column(MONEY, default=0)
    pdf_available = Column(Boolean, default=False)

    def to_dict(self) -> dict:
        return {
            "invoiceNumber": self.invoice_number,
            "orderId": self.order_id,
            "irn": self.irn,
            "gstin": self.seller_gstin,
            "hsnSummary": self.hsn_summary or [],
            "taxBreakup": self.tax_breakup or {},
            "total": float(self.total_inr or 0),
        }


class Payout(Base, TimestampMixin):
    """Seller settlement ledger (E12.6, T+2)."""

    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=False, index=True)
    order_id = Column(String(24), nullable=True, index=True)
    gross_inr = Column(MONEY, default=0)
    commission_inr = Column(MONEY, default=0)
    shipping_inr = Column(MONEY, default=0)
    tax_inr = Column(MONEY, default=0)
    net_inr = Column(MONEY, default=0)
    state = Column(String(24), default="pending")  # pending|settled|failed
    period = Column(String(10), nullable=True)
    settled_at = Column(DateTime(timezone=True), nullable=True)
    utrr = Column(String(64), nullable=True)
