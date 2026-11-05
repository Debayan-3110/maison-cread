"""Money math in INR using ``Decimal`` (half-up), never binary floats.

Server-side totals are authoritative: the checkout recomputes every line from
the catalog and ignores client-supplied totals (PRD E5.1 / E4.1). The frontend
mirrors these constants in ``frontend/src/utils/commerce.ts`` purely for display
before the order is placed.
"""
from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from typing import Any, Iterable

from backend.app.core.config import settings

ZERO = Decimal("0.00")
HUNDRED = Decimal("100")


def money(value: Any) -> Decimal:
    """Quantize to 2 decimals with commercial (half-up) rounding."""
    if value is None:
        return ZERO
    if isinstance(value, Decimal):
        dec = value
    else:
        try:
            dec = Decimal(str(value))
        except (InvalidOperation, ValueError):
            return ZERO
    return dec.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def to_float(value: Decimal | float | int | None) -> float:
    """JSON-friendly float for a money value."""
    return float(money(value))


def usd_to_inr(usd: Any) -> Decimal:
    """Catalog prices are stored in USD (legacy seed); storefront shows INR."""
    return money(Decimal(str(usd or 0)) * Decimal(str(settings.USD_TO_INR)))


def percent_of(amount: Any, percent: Any) -> Decimal:
    return money(money(amount) * Decimal(str(percent or 0)) / HUNDRED)


def apply_discount(amount: Any, discount_percent: Any, max_discount: Any = None) -> Decimal:
    """Discount capped at ``max_discount`` (absolute INR) when supplied."""
    raw = percent_of(amount, discount_percent)
    if max_discount is not None:
        raw = min(raw, money(max_discount))
    return money(raw)


def gst_split(taxable_inr: Any, rate: float | None = None) -> dict[str, Decimal]:
    """CGST/SGST split for intra-state supply (PRD E16.5)."""
    taxable = money(taxable_inr)
    gst_rate = Decimal(str(rate if rate is not None else settings.GST_RATE))
    gst = money(taxable * gst_rate)
    return {
        "taxable": taxable,
        "gst": gst,
        "cgst": money(gst / 2),
        "sgst": money(gst / 2),
        "gross": money(taxable + gst),
    }


def freight_inr(
    *,
    weight_g: float | int = 0,
    is_bulky: bool = False,
    is_fragile: bool = False,
    taxable_inr: Any = 0,
    zone_multiplier: Decimal | float = 1.0,
    free_shipping: bool = False,
    waive_shipping: bool = False,
) -> dict[str, Decimal]:
    """Zone- and weight-aware freight instead of the old flat ₹99 (defect D7)."""
    taxable = money(taxable_inr)
    if waive_shipping or free_shipping:
        return {"freight": ZERO, "bulk_surcharge": ZERO, "fragile_fee": ZERO, "waived": taxable}

    base = Decimal(str(settings.BASE_DELIVERY_FEE_INR))
    multiplier = Decimal(str(zone_multiplier))
    extra_kg = max(Decimal("0"), (Decimal(str(weight_g or 0)) / Decimal("1000")) - Decimal("0.5"))
    freight = base * multiplier + money(extra_kg * Decimal(str(settings.BULKY_FREIGHT_PER_KG_INR)) * multiplier)

    bulk_surcharge = money(base * multiplier * Decimal("1.5")) if is_bulky else ZERO
    fragile_fee = (
        money(Decimal(str(settings.FRAGILE_HANDLING_FEE_INR)) * multiplier) if is_fragile else ZERO
    )

    total = money(freight + bulk_surcharge + fragile_fee)
    if taxable >= Decimal(str(settings.FREE_DELIVERY_THRESHOLD_INR)) and total > 0:
        # Free-delivery threshold covers base freight only; surcharges remain.
        total = money(bulk_surcharge + fragile_fee)
    return {
        "freight": money(freight),
        "bulk_surcharge": bulk_surcharge,
        "fragile_fee": fragile_fee,
        "waived": ZERO,
        "total": total,
    }


def emi_breakdown(total_inr: Any, months: int, annual_rate: float | None = None) -> dict[str, Any]:
    """Costly EMI via amortisation; also the no-cost-variant merchant subsidy."""
    principal = money(total_inr)
    rate = Decimal(str(annual_rate if annual_rate is not None else settings.EMI_INTEREST_RATE))
    periods = int(months)
    if periods <= 0 or principal <= 0:
        return {"months": periods, "monthly": ZERO, "total_payable": principal, "interest": ZERO}

    monthly_rate = rate / Decimal("12")
    if monthly_rate == 0:
        monthly = principal / Decimal(periods)
    else:
        factor = (1 + monthly_rate) ** periods
        monthly = principal * monthly_rate * factor / (factor - 1)

    monthly = money(monthly)
    total_payable = money(monthly * periods)
    return {
        "months": periods,
        "monthly": monthly,
        "total_payable": total_payable,
        "interest": money(total_payable - principal),
    }


def sum_money(values: Iterable[Any]) -> Decimal:
    return money(sum((money(v) for v in values), ZERO))


__all__ = [
    "ZERO",
    "money",
    "to_float",
    "usd_to_inr",
    "percent_of",
    "apply_discount",
    "gst_split",
    "freight_inr",
    "emi_breakdown",
    "sum_money",
]
