"""Delivery promise: pincode serviceability, zones, SLA, AWB, tracking (E7).

Timelines are read from ``order_events`` rows - never fabricated (defect D3).
Zones are data, so a real pincode master can replace this heuristic without
touching call sites.
"""
from __future__ import annotations

import random
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from backend.app.models.commerce import Order, OrderStatus
from backend.app.models.fulfilment import OrderEvent, Shipment
from backend.app.models.status import DeliveryZone

_METRO = (
    "110 121 124 131 140 160 181 201 203 208 226 241 281 302 332 380 390 400 401 "
    "411 440 462 500 515 518 530 551 560 570 580 600 601 604 608 610 620 624 627 "
    "631 641 671 680 691 700 711 731 741"
).split()
METRO_PREFIXES = set(_METRO)
REGIONAL_PREFIXES = {"56", "57", "58", "59", "60", "61", "62", "63", "68", "69"}
HARD_LEADING_DIGITS = {"9", "8"}  # remote / currently undeliverable

COURIERS = {
    "blue-dart": "Blue Dart Express",
    "delhivery": "Delhivery",
    "ekart": "Ecom Express",
    "bluedart-bulky": "Bluedart Surface (Bulky)",
}
COURIER_FOR_CATEGORY = {
    "furniture": "bluedart-bulky", "womens-jewellery": "blue-dart",
    "mens-watches": "blue-dart", "laptops": "blue-dart", "smartphones": "blue-dart",
}
NDR_REASONS = {
    "NC": "Customer not available at the address",
    "NE": "Address incomplete or incorrect",
    "LW": "COD cash not collected",
    "DB": "Damaged or banned consignment",
    "RR": "Receiver refused the shipment",
    "CH": "Customer asked to reschedule",
}


def now() -> datetime:
    return datetime.now(timezone.utc)


def is_valid_pincode(pincode: Optional[str]) -> bool:
    value = (pincode or "").strip()
    return len(value) == 6 and value.isdigit()


def zone_for_pincode(pincode: Optional[str]) -> str:
    if not is_valid_pincode(pincode):
        return DeliveryZone.NATIONAL
    value = pincode.strip()
    if value[0] in HARD_LEADING_DIGITS:
        return DeliveryZone.HARD
    if value[:3] in METRO_PREFIXES:
        return DeliveryZone.LOCAL
    if value[:2] in REGIONAL_PREFIXES:
        return DeliveryZone.REGIONAL
    return DeliveryZone.NATIONAL


def freight_multiplier(pincode: Optional[str]) -> float:
    return float(DeliveryZone.FREIGHT_MULTIPLIER.get(zone_for_pincode(pincode), 1.5))


def serviceability(pincode: Optional[str], *, is_bulky: bool = False) -> Dict[str, Any]:
    """Pincode check used by the PDP and checkout (E7.1)."""
    zone = zone_for_pincode(pincode)
    if not is_valid_pincode(pincode):
        return {"serviceable": False, "zone": DeliveryZone.NATIONAL, "slaDays": None,
                "reason": "Enter a valid 6-digit pincode", "cashOnDelivery": False}
    if zone == DeliveryZone.HARD:
        return {"serviceable": False, "zone": zone, "slaDays": None,
                "reason": "We do not deliver to this pincode yet", "cashOnDelivery": False}
    days = DeliveryZone.SLA_DAYS.get(zone, 5) + (2 if is_bulky else 0)
    return {"serviceable": True, "zone": zone, "slaDays": days, "reason": None,
            "cashOnDelivery": True}


def promise(pincode: Optional[str], *, is_bulky: bool = False, is_fragile: bool = False,
            start: Optional[datetime] = None) -> Tuple[datetime, str]:
    """Computable delivery promise (G2) instead of hard-coded estimates."""
    zone = zone_for_pincode(pincode)
    days = DeliveryZone.SLA_DAYS.get(zone, 5) + (2 if is_bulky else 0) + (1 if is_fragile else 0)
    moment = start or now()
    promised = moment + timedelta(days=days)
    return promised, promised.strftime("%d %b %Y")


def choose_courier(categories: List[str], is_bulky: bool = False) -> str:
    if is_bulky:
        return "bluedart-bulky"
    for category in categories:
        if category in COURIER_FOR_CATEGORY:
            return COURIER_FOR_CATEGORY[category]
    return random.choice(["delhivery", "ekart"])


def generate_awb(courier: str) -> str:
    return f"{courier[:2].upper()}{secrets.randbelow(10**9):09d}IN"


def add_event(db: Session, order_id: str, status: str, *, title: str = "",
              description: str = "", location: Optional[str] = None,
              actor_id: Optional[int] = None, actor_role: Optional[str] = None,
              reason_code: Optional[str] = None, commit: bool = False) -> OrderEvent:
    event = OrderEvent(order_id=order_id, status=status, title=title or status,
                       description=description, location=location, actor_id=actor_id,
                       actor_role=actor_role, reason_code=reason_code)
    db.add(event)
    if commit:
        db.commit()
    return event


def timeline(db: Session, order: Order) -> List[Dict[str, Any]]:
    """Read-only projection of persisted events - no synthesis (fixes D3)."""
    events = (db.query(OrderEvent).filter(OrderEvent.order_id == order.id)
              .order_by(OrderEvent.created_at.asc(), OrderEvent.id.asc()).all())
    items = [event.to_dict() for event in events]
    if order.estimated_delivery:
        items.append({"status": "Delivery window", "title": "Expected delivery",
                      "description": f"Promise: {order.estimated_delivery}",
                      "location": None, "date": "", "timestamp": None, "completed": False})
    return items


def apply_carrier_event(db: Session, *, awb: str, provider: str, status: str,
                        location: Optional[str] = None, reason_code: Optional[str] = None,
                        note: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Normalised inbound carrier webhook (E7.5)."""
    order = db.query(Order).filter(Order.awb == awb).first()
    if not order:
        return None
    shipment = db.query(Shipment).filter(Shipment.awb == awb).first()
    lowered = (status or "").lower()

    if lowered == "ndr":
        ndrs = list(shipment.ndrs or []) if shipment else []
        ndrs.append({"reason": reason_code or "NC",
                     "note": NDR_REASONS.get(reason_code or "", note or "Attempt failed"),
                     "at": now().isoformat(), "location": location})
        if shipment:
            shipment.ndrs = ndrs
            shipment.attempts = (shipment.attempts or 0) + 1
        add_event(db, order.id, "NDR", title="Delivery attempt failed",
                  description=NDR_REASONS.get(reason_code or "", note or "Attempt failed"),
                  location=location, reason_code=reason_code)
    else:
        mapping = {"in_transit": OrderStatus.SHIPPED, "shipped": OrderStatus.SHIPPED,
                   "out_for_delivery": OrderStatus.OUT_FOR_DELIVERY,
                   "delivered": OrderStatus.DELIVERED}
        new_status = mapping.get(lowered)
        if new_status:
            order.status = new_status
        add_event(db, order.id, new_status or lowered, title=new_status or lowered,
                  description=note or f"Scan event from {provider}",
                  location=location, reason_code=reason_code)
        if lowered == "delivered" and shipment:
            shipment.delivered_at = now().replace(tzinfo=None)

    db.commit()
    return {"orderId": order.id, "status": order.status, "awb": awb}