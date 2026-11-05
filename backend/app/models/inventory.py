"""Inventory ledger, reservations and locations (PRD §10.3, E5.7, E6).

``inventory_ledger`` is append-only and authoritative; ``products.stock`` is a
denormalised "available" counter maintained in the same transaction so the
storefront never has to join (and the existing admin UI keeps working).
"""
from __future__ import annotations

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Index, Integer, Numeric, String,
)

from backend.app.db.base import Base, TimestampMixin, utcnow


class LedgerReason:
    PURCHASE_ORDER = "po_receipt"
    SALE_COMMIT = "sale_commit"
    SALE_RESERVE = "sale_reserve"
    SALE_RELEASE = "sale_release"
    RETURN_RESTOCK = "return_restock"
    ADJUSTMENT = "manual_adjust"
    TRANSFER = "transfer"
    DAMAGE = "damage"
    SEED = "seed"


class ReservationState:
    HELD = "held"
    COMMITTED = "committed"
    RELEASED = "released"
    EXPIRED = "expired"


class Location(Base, TimestampMixin):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True)
    code = Column(String(24), unique=True, nullable=False)
    name = Column(String(120), nullable=False)
    type = Column(String(24), default="warehouse")  # warehouse | dark_store | store
    address = Column(String(255), default="")
    pincode = Column(String(12), index=True, default="")
    is_pickup_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)


class InventoryItem(Base, TimestampMixin):
    """One row per (product, location) with the reservation bookkeeping."""

    __tablename__ = "inventory"
    __table_args__ = (Index("ix_inventory_product_location", "product_id", "location_id", unique=True),)

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    on_hand = Column(Integer, default=0, nullable=False)
    reserved = Column(Integer, default=0, nullable=False)
    in_transit = Column(Integer, default=0, nullable=False)
    safety_stock = Column(Integer, default=0, nullable=False)
    reorder_point = Column(Integer, default=0, nullable=False)
    velocity_7d = Column(Numeric(8, 2), default=0)

    @property
    def available(self) -> int:
        return int(self.on_hand or 0) - int(self.reserved or 0)


class InventoryLedger(Base, TimestampMixin):
    """Append-only movement log — the single source of truth for stock."""

    __tablename__ = "inventory_ledger"
    __table_args__ = (Index("ix_ledger_product_time", "product_id", "created_at"),)

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    delta = Column(Integer, nullable=False)
    balance_after = Column(Integer, nullable=True)
    reason_code = Column(String(32), nullable=False, index=True)
    ref_type = Column(String(32), nullable=True)
    ref_id = Column(String(64), nullable=True)
    actor_id = Column(Integer, nullable=True)
    note = Column(String(255), nullable=True)
    idempotency_key = Column(String(96), nullable=True, unique=True)


class StockReservation(Base, TimestampMixin):
    """Soft hold during checkout, hard commitment after payment capture."""

    __tablename__ = "stock_reservations"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    state = Column(String(16), default=ReservationState.HELD, nullable=False, index=True)
    checkout_id = Column(String(64), nullable=False, index=True)
    order_id = Column(String(64), nullable=True)
    user_id = Column(Integer, nullable=True)
    expires_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    released_at = Column(DateTime(timezone=True), nullable=True)
