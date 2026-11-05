"""Merchandising rails, reviews and search evidence (E2.1, E2.4, E2.10)."""
from __future__ import annotations

from sqlalchemy import (
    JSON, Boolean, Column, ForeignKey, Integer, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from backend.app.db.base import Base, TimestampMixin


class Collection(Base, TimestampMixin):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True)
    slug = Column(String(80), unique=True, nullable=False, index=True)
    name = Column(String(120), nullable=False)
    type = Column(String(16), default="manual")  # manual | smart (rule-based)
    rule_json = Column(JSON, default=dict)
    sort_order = Column(Integer, default=0)

    items = relationship("CollectionProduct", back_populates="collection",
                         cascade="all, delete-orphan")


class CollectionProduct(Base, TimestampMixin):
    __tablename__ = "collection_products"
    __table_args__ = (
        UniqueConstraint("collection_id", "product_id", name="uq_collection_product"),
    )

    id = Column(Integer, primary_key=True)
    collection_id = Column(Integer, ForeignKey("collections.id", ondelete="CASCADE"), index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), index=True)
    position = Column(Integer, default=0)

    collection = relationship("Collection", back_populates="items")


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("product_id", "user_id", name="uq_review_user"),)

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"),
                        nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    order_line_id = Column(Integer, nullable=True)
    rating = Column(Integer, nullable=False)
    title = Column(String(160), default="")
    body = Column(Text, default="")
    verified_purchase = Column(Boolean, default=False, nullable=False)
    status = Column(String(16), default="published")
    helpful_count = Column(Integer, default=0)

    product = relationship("Product", back_populates="reviews")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "productId": self.product_id,
            "rating": self.rating,
            "title": self.title,
            "body": self.body,
            "verifiedPurchase": bool(self.verified_purchase),
            "helpfulCount": self.helpful_count or 0,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }


class SearchQuery(Base, TimestampMixin):
    """Search evidence: ranking tuning, personalisation, zero-result alerts."""

    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=True, index=True)
    anon_id = Column(String(64), nullable=True, index=True)
    query = Column(String(255), nullable=False, index=True)
    filters = Column(JSON, default=dict)
    result_count = Column(Integer, default=0)
    clicked_ids = Column(JSON, default=list)
