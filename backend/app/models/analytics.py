from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from backend.app.db.session import Base


class ChatLog(Base):
    """Stores AI chat interaction logs for admin analytics."""
    __tablename__ = "chat_logs"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False)
    response = Column(String, nullable=True)
    recommended_product_ids = Column(String, nullable=True)  # comma-separated IDs
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ConversionLog(Base):
    """Tracks product-to-order conversions originating from AI recommendations."""
    __tablename__ = "conversion_logs"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True, nullable=False)
    order_id = Column(String, nullable=True)
    source = Column(String, default="ai_recommendation")  # ai_recommendation | organic
    revenue = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
