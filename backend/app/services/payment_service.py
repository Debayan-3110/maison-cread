"""Payment capture with a deterministic sandbox gateway (E5.4, E5.5, E16.7).

No PAN is ever persisted - only brand + last4 (PCI-DSS scope reduction). Card
numbers starting 4000 0000 0000 0002 simulate a decline so failure paths are
testable offline; set PAYMENT_SECRET_KEY plus a real gateway adapter in
production.
"""
from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.logging import get_security_logger
from backend.app.models.commerce import Order
from backend.app.models.finance import Payment
from backend.app.models.status import PaymentMethod, PaymentStatus

security = get_security_logger()
DECLINE_PREFIX = "4000000000000002"
BRANDS = {"4": "visa", "5": "mastercard", "3": "amex", "6": "rupay"}


def card_brand(number: str) -> str:
    return BRANDS.get((number or "")[0:1], "card")


def verify_webhook_signature(payload: bytes, signature: str, secret: str = "") -> bool:
    expected = hmac.new((secret or settings.PAYMENT_SECRET_KEY).encode(),
                        payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, (signature or "").removeprefix("sha256="))


def _reference() -> str:
    return f"pay_{secrets.token_hex(10)}"


class PaymentService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def simulate(self, *, method: str, amount: Decimal, instrument: Dict[str, Any]) -> Tuple[bool, str, Optional[str], Optional[str], str]:
        """Return ``(ok, reference, brand, last4, failure_reason)``."""
        reference = _reference()
        if method in (PaymentMethod.UPI, PaymentMethod.NETBANKING, PaymentMethod.WALLET):
            return True, reference, None, None, ""
        if method == PaymentMethod.COD:
            return True, reference, None, None, ""
        number = "".join(ch for ch in str(instrument.get("number", "")) if ch.isdigit())
        last4 = number[-4:] if number else None
        brand = card_brand(number) if number else None
        if method in (PaymentMethod.CARD, PaymentMethod.EMI) and number.startswith(DECLINE_PREFIX):
            return False, reference, brand, last4, "Issuer declined the transaction (05)"
        if method in (PaymentMethod.CARD, PaymentMethod.EMI) and len(number) not in (15, 16):
            return False, reference, brand, last4, "Invalid card number"
        return True, reference, brand, last4, ""

    def charge(self, order: Order, *, method: str, instrument: Optional[Dict[str, Any]] = None,
               amount: Optional[Decimal] = None, emi_months: Optional[int] = None) -> Payment:
        instrument = instrument or {}
        payable = Decimal(str(amount)) if amount is not None else Decimal(str(order.total_inr or 0))
        ok, reference, brand, last4, reason = self.simulate(
            method=method, amount=payable, instrument=instrument)

        payment = Payment(order_id=order.id, user_id=order.user_id, method=method,
                         amount_inr=payable, reference=reference, card_brand=brand,
                         last4=last4, emi_months=emi_months,
                         provider_ref=reference if ok else None,
                         failure_reason=None if ok else reason,
                         status=PaymentStatus.CAPTURED if ok else PaymentStatus.FAILED,
                         captured_at=(datetime.now(timezone.utc).replace(tzinfo=None) if ok else None))
        self.db.add(payment)
        if not ok:
            security.warning("payment declined order=%s method=%s reason=%s",
                             order.id, method, reason)
            self.db.commit()
            raise HTTPException(
                status.HTTP_402_PAYMENT_REQUIRED,
                {"error": "PAYMENT_FAILED", "reference": reference, "message": reason})
        self.db.commit()
        return payment

    def refund(self, order: Order, *, amount: Decimal, mode: str = "original_payment",
               reason: str = "", return_id: Optional[int] = None) -> Dict[str, Any]:
        from backend.app.models.finance import Refund

        utr = f"UTR{secrets.randbelow(10**15):015d}"
        refund = Refund(order_id=order.id, amount_inr=amount, mode=mode, status="completed",
                        utr=utr, reason=reason, return_id=return_id,
                        processed_at=datetime.now(timezone.utc).replace(tzinfo=None))
        self.db.add(refund)
        self.db.commit()
        return {"refundId": refund.id, "utr": utr, "amount": float(amount), "mode": mode}