from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.db.session import Base

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    date = Column(String)
    status = Column(String, default="Processing")
    estimated_delivery = Column(String)
    
    # We store the structured order data as JSON for flexibility, 
    # but the item details are also tracked for reporting
    shipping_info = Column(JSON)
    payment_info = Column(JSON)
    summary = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, index=True)
    title = Column(String)
    price = Column(Float)
    quantity = Column(Integer)
    
    order = relationship("Order", back_populates="items")
