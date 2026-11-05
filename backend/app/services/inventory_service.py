"""Inventory: guarded decrement, ledger, alerts, reorder (E5.7, E6.6, E6.13).

Zero-oversell rule (G1): stock is decremented with a guarded UPDATE
(``WHERE stock >= qty``) inside the order transaction and the rowcount is
checked, so a lost race raises 409 instead of going negative.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy import update
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.catalog import Product
from backend.app.models.inventory import InventoryItem, InventoryLedger, LedgerReason

PREMIUM_CATEGORIES = {"womens-jewellery", "mens-watches", "laptops", "smartphones",
                      "fragrances", "sunglasses"}


def threshold_for(product: Product) -> int:
    """Per-category low-stock threshold - the flat 10 was mis-tuned (D8)."""
    if product.low_stock_threshold:
        return int(product.low_stock_threshold)
    if product.category in PREMIUM_CATEGORIES:
        return settings.LOW_STOCK_PREMIUM_THRESHOLD
    return settings.LOW_STOCK_DEFAULT_THRESHOLD


class InventoryService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def ledger(self, product: Product, delta: int, reason: str, *, ref_type: str = "",
               ref_id: str = "", actor_id: Optional[int] = None,
               idempotency_key: Optional[str] = None, note: str = "") -> None:
        self.db.add(InventoryLedger(
            product_id=product.id, delta=delta, balance_after=product.stock,
            reason_code=reason, ref_type=ref_type or None, ref_id=ref_id or None,
            actor_id=actor_id, note=note or None, idempotency_key=idempotency_key))

    def mirror(self, product: Product) -> None:
        row = (self.db.query(InventoryItem)
               .filter(InventoryItem.product_id == product.id).first())
        if not row:
            row = InventoryItem(product_id=product.id)
            self.db.add(row)
        row.on_hand = int(product.stock or 0)

    def guard(self, product: Product, qty: int) -> bool:
        result = self.db.execute(
            update(Product).where(Product.id == product.id, Product.stock >= qty)
            .values(stock=Product.stock - qty))
        return result.rowcount == 1

    def _out_of_stock(self, product: Product, requested: int) -> HTTPException:
        available = int(product.stock or 0)
        return HTTPException(
            status.HTTP_409_CONFLICT,
            {"error": "OUT_OF_STOCK", "productId": product.id, "title": product.title,
             "requested": requested, "available": available,
             "message": f"Only {available} left of {product.title}"})

    def check(self, items: List[Dict[str, Any]]) -> List[Product]:
        """Pre-flight basket stock validation (E5.3)."""
        products: List[Product] = []
        for raw in items:
            pid = int(raw.get("id") or raw.get("product_id"))
            qty = int(raw.get("quantity") or 1)
            product = self.db.get(Product, pid)
            if not product:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {pid} not found")
            if int(product.stock or 0) < qty:
                raise self._out_of_stock(product, qty)
            products.append(product)
        return products

    def decrement(self, product: Product, qty: int, *, ref_type: str = "order",
                  ref_id: str = "", actor_id: Optional[int] = None) -> None:
        """Commit stock for a paid order; 409 on a lost race (fixes D1)."""
        if not self.guard(product, qty):
            raise self._out_of_stock(product, qty)
        self.db.refresh(product)
        self.ledger(product, -qty, LedgerReason.SALE_COMMIT, ref_type=ref_type,
                    ref_id=ref_id, actor_id=actor_id)
        self.mirror(product)

    def restore(self, product: Product, qty: int, *, ref_type: str = "order",
                ref_id: str = "", actor_id: Optional[int] = None,
                reason: str = LedgerReason.RETURN_RESTOCK) -> None:
        product.stock = int(product.stock or 0) + qty
        self.db.flush()
        self.ledger(product, qty, reason, ref_type=ref_type, ref_id=ref_id,
                    actor_id=actor_id)
        self.mirror(product)

    def set_stock(self, product_id: int, quantity: int, *, actor_id: Optional[int] = None,
                  reason: str = LedgerReason.ADJUSTMENT, note: str = "") -> Product:
        """Admin absolute set (audited); callers broadcast the WS update."""
        product = self.db.get(Product, product_id)
        if not product:
            raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {product_id} not found")
        if quantity < 0:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Stock cannot be negative")
        delta = int(quantity) - int(product.stock or 0)
        product.stock = int(quantity)
        self.db.flush()
        if delta:
            self.ledger(product, delta, reason, actor_id=actor_id, note=note)
        self.mirror(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def low_stock(self, threshold: Optional[int] = None) -> List[Dict[str, Any]]:
        rows = (self.db.query(Product).filter(Product.status == "active")
                .order_by(Product.stock.asc()).all())
        alerts: List[Dict[str, Any]] = []
        for product in rows:
            limit = int(threshold) if threshold else threshold_for(product)
            stock = int(product.stock or 0)
            if stock <= limit:
                alerts.append({**product.to_dict(), "threshold": limit,
                               "soldOut": stock == 0, "fewLeft": 0 < stock <= 3})
        return alerts

    def reorder_suggestions(self) -> List[Dict[str, Any]]:
        """Velocity-aware reorder point (E6.13)."""
        rows = self.db.query(Product).filter(Product.status == "active").all()
        suggestions = []
        for product in rows:
            velocity = float(product.velocity_7d or 0) or 0.5
            need = int(round(velocity * 21)) - int(product.stock or 0)
            if need > 0:
                suggestions.append({
                    "productId": product.id, "title": product.title, "sku": product.sku,
                    "stock": int(product.stock or 0), "velocity7d": round(velocity, 2),
                    "suggestedPurchaseQty": need,
                    "estimatedRunoutDays": int(int(product.stock or 0) / velocity)})
        return sorted(suggestions, key=lambda item: item["estimatedRunoutDays"])[:10]

    def movements(self, product_id: int, limit: int = 50) -> List[Dict[str, Any]]:
        rows = (self.db.query(InventoryLedger)
                .filter(InventoryLedger.product_id == product_id)
                .order_by(InventoryLedger.id.desc()).limit(limit).all())
        return [{"id": row.id, "delta": row.delta, "balanceAfter": row.balance_after,
                 "reason": row.reason_code, "refId": row.ref_id,
                 "at": row.created_at.isoformat() if row.created_at else None}
                for row in rows]