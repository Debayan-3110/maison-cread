"""Server-authoritative quote/pricing engine (E4, E5.1).

Never trusts client totals: every checkout recomputes line prices from the
catalogue, applies promotions + loyalty coins, GST (CGST/SGST split) and
zone/weight-aware freight. ``frontend/src/utils/commerce.ts`` mirrors these
constants for display only.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.money import (
    ZERO, emi_breakdown, freight_inr, gst_split, money, usd_to_inr,
)
from backend.app.models.commerce import Promotion
from backend.app.models.catalog import Product
from backend.app.models.user import User


@dataclass
class QuoteLine:
    product: Product
    quantity: int
    unit_inr: Decimal
    line_mrp_inr: Decimal
    line_inr: Decimal
    weight_g: int
    is_bulky: bool
    is_fragile: bool
    tax_rate: Decimal
    tax_inr: Decimal = ZERO
    discount_inr: Decimal = ZERO
    total_inr: Decimal = ZERO

    def as_dict(self) -> Dict[str, Any]:
        return {
            "productId": self.product.id,
            "sku": self.product.sku,
            "title": self.product.title,
            "thumbnail": self.product.thumbnail,
            "category": self.product.category,
            "quantity": self.quantity,
            "unitPrice": float(self.unit_inr),
            "unitPriceUsd": float(self.product.price or 0),
            "lineTotal": float(self.line_inr),
            "tax": float(self.tax_inr),
            "weight_g": self.weight_g,
        }


@dataclass
class Quote:
    lines: List[QuoteLine] = field(default_factory=list)
    subtotal: Decimal = ZERO
    item_discount: Decimal = ZERO
    coupon_discount: Decimal = ZERO
    coin_discount: Decimal = ZERO
    discount: Decimal = ZERO
    taxable: Decimal = ZERO
    gst: Decimal = ZERO
    cgst: Decimal = ZERO
    sgst: Decimal = ZERO
    shipping: Decimal = ZERO
    cod_fee: Decimal = ZERO
    total: Decimal = ZERO
    coins_earned: int = 0
    coupon_code: Optional[str] = None
    zone: str = "national"
    errors: List[str] = field(default_factory=list)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "items": [line.as_dict() for line in self.lines],
            "currency": settings.CURRENCY,
            "subtotal": float(self.subtotal),
            "itemDiscount": float(self.item_discount),
            "discount": float(self.discount),
            "couponCode": self.coupon_code,
            "couponDiscount": float(self.coupon_discount),
            "coinDiscount": float(self.coin_discount),
            "taxable": float(self.taxable),
            "tax": float(self.gst),
            "cgst": float(self.cgst),
            "sgst": float(self.sgst),
            "shipping": float(self.shipping),
            "codFee": float(self.cod_fee),
            "total": float(self.total),
            "coinsEarned": self.coins_earned,
            "zone": self.zone,
            "errors": self.errors,
        }

class CouponError(ValueError):
    """Raised when a promotion cannot be applied to this basket."""


def percent(amount: Decimal, pct: Any) -> Decimal:
    return money(amount * Decimal(str(pct or 0)) / Decimal("100"))


class PricingService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_promotion(self, code: str) -> Promotion:
        promo = (self.db.query(Promotion)
                 .filter(Promotion.code == (code or "").strip().upper()).first())
        if not promo or not promo.is_active:
            raise CouponError("Invalid coupon code")
        moment = datetime.now(timezone.utc)
        if promo.starts_at and moment < promo.starts_at:
            raise CouponError("This offer has not started yet")
        if promo.ends_at and moment > promo.ends_at:
            raise CouponError("This offer has expired")
        return promo

    def check_eligibility(self, promo: Promotion, *, subtotal: Decimal,
                          user: Optional[User] = None) -> None:
        """Caps, windows, per-user limits and tier gating (E4.8-E4.10)."""
        from backend.app.models.commerce import Order

        if promo.min_subtotal_inr and subtotal < money(promo.min_subtotal_inr):
            gap = float(money(promo.min_subtotal_inr) - subtotal)
            raise CouponError(f"Add ₹{gap:.0f} more to use this code")
        if promo.usage_limit and (promo.redeem_count or 0) >= promo.usage_limit:
            raise CouponError("This offer has been fully redeemed")
        if promo.per_user_limit and user is not None:
            used = (self.db.query(Order)
                    .filter(Order.user_id == user.id, Order.coupon_code == promo.code).count())
            if used >= promo.per_user_limit:
                raise CouponError("You have already used this code")
        if promo.tier and user is not None and user.tier != promo.tier:
            raise CouponError(f"Exclusive for {promo.tier.title()} members")

    def quote(self, items: List[Dict[str, Any]], *, coupon_code: Optional[str] = None,
              coins_to_redeem: int = 0, payment_method: str = "card",
              pincode: Optional[str] = None, user: Optional[User] = None,
              zone_multiplier: Decimal | float = 1.0) -> Quote:
        """Authoritative quote: totals recomputed, client numbers ignored."""
        from backend.app.services.delivery_service import zone_for_pincode

        if not items:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cart is empty")

        quote = Quote()
        for raw in items:
            pid = raw.get("id") or raw.get("product_id")
            qty = int(raw.get("quantity") or 1)
            product = self.db.get(Product, int(pid)) if pid else None
            if not product:
                raise HTTPException(status.HTTP_404_NOT_FOUND, f"Product {pid} not found")
            if qty <= 0:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, "Quantity must be positive")
            if product.status != "active":
                raise HTTPException(status.HTTP_409_CONFLICT,
                                    f"{product.title} is no longer available")
            unit = usd_to_inr(product.price)
            mrp = usd_to_inr(product.mrp or product.price)
            line_gross = money(unit * qty)
            quote.lines.append(QuoteLine(
                product=product, quantity=qty, unit_inr=unit, line_mrp_inr=mrp,
                line_inr=line_gross, weight_g=int(product.weight_g or 500),
                is_bulky=bool(product.is_bulky), is_fragile=bool(product.is_fragile),
                tax_rate=Decimal(str(product.gst_rate or settings.GST_RATE))))
            quote.subtotal = money(quote.subtotal + line_gross)
            quote.item_discount = money(quote.item_discount + max(ZERO, money(mrp - line_gross)))

        if coupon_code:
            promo = self.get_promotion(coupon_code)
            self.check_eligibility(promo, subtotal=quote.subtotal, user=user)
            quote.coupon_code = promo.code
            if promo.type == "free_shipping":
                quote.shipping = ZERO
            else:
                raw = (percent(quote.subtotal, promo.value) if promo.type == "percent"
                       else money(promo.value))
                if promo.max_discount_inr:
                    raw = min(raw, money(promo.max_discount_inr))
                quote.coupon_discount = min(money(raw), quote.subtotal)

        if coins_to_redeem:
            available = int(user.coins or 0) if user else 0
            if int(coins_to_redeem) > available:
                raise HTTPException(status.HTTP_400_BAD_REQUEST,
                                    f"Only {available} coins available")
            cap = money((quote.subtotal - quote.coupon_discount)
                        * Decimal(str(settings.LOYALTY_REDEEM_MAX_PCT)) / Decimal("100"))
            quote.coin_discount = min(money(Decimal(str(int(coins_to_redeem)))
                                        * Decimal(str(settings.LOYALTY_COIN_VALUE_INR))), cap)

        quote.discount = money(quote.coupon_discount + quote.coin_discount)
        quote.taxable = money(max(ZERO, quote.subtotal - quote.discount))

        for line in quote.lines:  # GST per line using the line's HSN rate
            share = (money(quote.taxable * line.line_inr / quote.subtotal)
                     if quote.subtotal > 0 else ZERO)
            share_discount = (money(share * quote.discount / quote.subtotal)
                              if quote.subtotal > 0 else ZERO)
            line.discount_inr = share_discount
            line_net = money(share - share_discount)
            line.tax_inr = money(line_net * line.tax_rate)
            line.total_inr = money(line_net + line.tax_inr)
            quote.gst = money(quote.gst + line.tax_inr)

        split = gst_split(quote.taxable)
        quote.cgst, quote.sgst = split["cgst"], split["sgst"]

        quote.zone = zone_for_pincode(pincode) if pincode else "national"
        weight = sum(line.weight_g * line.quantity for line in quote.lines)
        freight = freight_inr(
            weight_g=weight,
            is_bulky=any(line.is_bulky for line in quote.lines),
            is_fragile=any(line.is_fragile for line in quote.lines),
            taxable_inr=quote.taxable, zone_multiplier=zone_multiplier,
            waive_shipping=(quote.coupon_code or "").upper() == "FREESHIP")
        if quote.shipping == ZERO:
            quote.shipping = money(freight.get("total", freight.get("freight", ZERO)))
        if payment_method == "cod":
            quote.cod_fee = money(Decimal(str(settings.COD_FEE_INR)))

        quote.total = money(quote.taxable + quote.gst + quote.shipping + quote.cod_fee)
        quote.coins_earned = int((quote.total // 100) * settings.LOYALTY_EARN_COINS_PER_100_INR)
        return quote

    @staticmethod
    def emi_options(total_inr: Decimal | float) -> List[Dict[str, Any]]:
        return [emi_breakdown(total_inr, months) for months in settings.EMI_PLANS_MONTHS]
