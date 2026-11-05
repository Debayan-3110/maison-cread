"""Catalog core (PRD §10.2, E2).

``Product`` keeps the legacy column names (``title``, USD ``price``,
``thumbnail``, ``discount_percentage``, ``stock``) so storefront code keeps
working, and adds the trust/logistics attributes a premium catalogue needs:
weight, HSN, serialisation, open-box delivery, fragile/bulky, return policy and
cost price for the margin guardrail.
"""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, DateTime, ForeignKey, Index, Integer, Numeric, String,
    Text,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base, TimestampMixin


class ProductStatus:
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    path = Column(String(255), default="")
    hsn_code = Column(String(10), nullable=True)
    spec_schema = Column(JSON, default=dict)      # per-category spec facets (E2.3)
    low_stock_threshold = Column(Integer, nullable=True)
    return_window_days = Column(Integer, nullable=True)
    sort_order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category_ref")


class Brand(Base, TimestampMixin):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    logo = Column(String(500), nullable=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=True)
    # Counterfeit-prone brands require serial capture + OBD (E9).
    authenticity_policy = Column(String(32), default="standard")


class Product(Base, TimestampMixin):
    __tablename__ = "products"
    __table_args__ = (Index("ix_products_category_status", "category", "status"),)

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(64), unique=True, index=True, nullable=True)
    slug = Column(String(160), unique=True, index=True, nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")

    # Catalogue is seeded in USD (legacy); the storefront renders INR.
    currency = Column(String(8), default="USD", nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    mrp = Column(Numeric(10, 2), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)  # margin guardrail (E4.10)
    discount_percentage = Column(Numeric(5, 2), default=0, nullable=False)

    category = Column(String(80), index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    brand = Column(String(120), index=True)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=True)
    seller_id = Column(Integer, ForeignKey("sellers.id"), nullable=True)

    thumbnail = Column(String(500), nullable=True)
    images = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    specs = Column(JSON, default=dict)

    rating = Column(Numeric(3, 2), default=0)
    review_count = Column(Integer, default=0, nullable=False)
    stock = Column(Integer, default=0, index=True)  # denormalised available count
    status = Column(String(16), default=ProductStatus.ACTIVE, nullable=False)

    # Logistics + trust attributes
    weight_g = Column(Integer, default=500)
    dims_mm = Column(String(32), nullable=True)
    hsn_code = Column(String(10), nullable=True)
    gst_rate = Column(Numeric(5, 4), nullable=True)
    warranty_months = Column(Integer, default=12)
    is_serialized = Column(Boolean, default=False)
    is_obd_required = Column(Boolean, default=False)
    is_fragile = Column(Boolean, default=False)
    is_bulky = Column(Boolean, default=False)
    is_returnable = Column(Boolean, default=True)
    return_window_days = Column(Integer, nullable=True)
    low_stock_threshold = Column(Integer, nullable=True)
    velocity_7d = Column(Numeric(8, 2), default=0)
    published_at = Column(DateTime(timezone=True), nullable=True)

    category_ref = relationship("Category", back_populates="products")
    reviews = relationship("Review", back_populates="product",
                           cascade="all, delete-orphan")

    def to_dict(self) -> dict:
        """Storefront shape (camelCase — see ``frontend/src/types/models.d.ts``)."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": float(self.price or 0),
            "mrp": float(self.mrp or self.price or 0),
            "currency": self.currency,
            "category": self.category,
            "thumbnail": self.thumbnail,
            "images": self.images or [],
            "rating": float(self.rating or 0),
            "reviewCount": self.review_count or 0,
            "stock": self.stock or 0,
            "brand": self.brand,
            "sku": self.sku,
            "discountPercentage": float(self.discount_percentage or 0),
            "tags": self.tags or [],
            "specs": self.specs or {},
            "weight_g": self.weight_g,
            "isBulky": bool(self.is_bulky),
            "isFragile": bool(self.is_fragile),
            "isSerialized": bool(self.is_serialized),
            "isObdRequired": bool(self.is_obd_required),
            "isReturnable": bool(self.is_returnable),
            "warrantyMonths": self.warranty_months,
            "status": self.status,
        }
