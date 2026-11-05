"""Model registry — import this package to attach every table to ``Base``."""
from backend.app.db.base import Base, TimestampMixin  # noqa: F401
from backend.app.models.user import LoyaltyTier, User, UserRole, UserStatus
from backend.app.models.access import Address, UserSession
from backend.app.models.compliance import (
    AuditLog,
    Consent,
    LoginAttempt,
    MockEmail,
    OtpChallenge,
    WebauthnCredential,
)
from backend.app.models.catalog import Brand, Category, Product, ProductStatus
from backend.app.models.merch import Collection, CollectionProduct, Review, SearchQuery
from backend.app.models.inventory import (
    InventoryItem,
    InventoryLedger,
    LedgerReason,
    Location,
    ReservationState,
    StockReservation,
)
from backend.app.models.commerce import Order, OrderItem, Promotion
from backend.app.models.fulfilment import OrderEvent, SerialNumber, Shipment
from backend.app.models.returns import (
    ReturnItem,
    ReturnRequest,
    ServiceRequest,
    WarrantyRegistration,
)
from backend.app.models.finance import Invoice, Payment, Payout, Refund
from backend.app.models.loyalty import LoyaltyEntry, Referral, WalletTransaction
from backend.app.models.support import Ticket, TicketMessage
from backend.app.models.marketplace import ChatLog, ConversionLog, DomainEvent, Seller
from backend.app.models import status  # noqa: F401

__all__ = [
    "Base", "TimestampMixin",
    "User", "UserRole", "UserStatus", "LoyaltyTier",
    "Address", "UserSession",
    "AuditLog", "Consent", "LoginAttempt", "MockEmail", "OtpChallenge",
    "WebauthnCredential",
    "Product", "Category", "Brand", "ProductStatus",
    "Collection", "CollectionProduct", "Review", "SearchQuery",
    "Location", "InventoryItem", "InventoryLedger", "LedgerReason",
    "StockReservation", "ReservationState",
    "Order", "OrderItem", "Promotion",
    "OrderEvent", "Shipment", "SerialNumber",
    "ReturnRequest", "ReturnItem", "WarrantyRegistration", "ServiceRequest",
    "Payment", "Refund", "Invoice", "Payout",
    "LoyaltyEntry", "WalletTransaction", "Referral",
    "Ticket", "TicketMessage",
    "Seller", "ChatLog", "ConversionLog", "DomainEvent",
    "status",
]

