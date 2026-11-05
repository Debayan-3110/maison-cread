"""Lifecycle constants shared by models and services."""
from __future__ import annotations


class OrderStatus:
    PLACED = "Placed"
    CONFIRMED = "Confirmed"
    PACKED = "Packed"
    SHIPPED = "Shipped"
    OUT_FOR_DELIVERY = "Out for delivery"
    DELIVERED = "Delivered"
    CANCELLED = "Cancelled"
    RETURN_REQUESTED = "Return requested"
    RETURNED = "Returned"
    REFUNDED = "Refunded"

    CANCELLABLE = {PLACED, CONFIRMED, PACKED}  # pre-dispatch (E6.14)
    TERMINAL = {DELIVERED, CANCELLED, RETURNED, REFUNDED}


class PaymentMethod:
    CARD = "card"
    UPI = "upi"
    NETBANKING = "netbanking"
    WALLET = "wallet"
    COD = "cod"
    EMI = "emi"

    ALL = {CARD, UPI, NETBANKING, WALLET, COD, EMI}


class PaymentStatus:
    PENDING = "pending"
    AUTHORIZED = "authorized"
    CAPTURED = "captured"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"


class PromotionType:
    PERCENT = "percent"
    FLAT = "flat"
    FREE_SHIPPING = "free_shipping"


class DeliveryZone:
    LOCAL = "local"        # same metro  — 1 day
    REGIONAL = "regional"  # same region — 2-3 days
    NATIONAL = "national"  # rest of India — 4-6 days
    HARD = "hard"          # remote/undeliverable

    SLA_DAYS = {LOCAL: 1, REGIONAL: 3, NATIONAL: 5, HARD: 9}
    FREIGHT_MULTIPLIER = {LOCAL: 1.0, REGIONAL: 1.2, NATIONAL: 1.5, HARD: 2.5}


class ReturnState:
    REQUESTED = "requested"
    APPROVED = "approved"
    PICKUP_SCHEDULED = "pickup_scheduled"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    QC_DONE = "qc_done"
    REFUND_INITIATED = "refund_initiated"
    COMPLETED = "completed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"


class TicketState:
    OPEN = "open"
    PENDING_CUSTOMER = "pending_customer"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority:
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
