from sqlalchemy import Column, Integer, String, Float, Boolean
from backend.app.db.session import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    category = Column(String, index=True)
    thumbnail = Column(String)
    rating = Column(Float, default=0.0)
    stock = Column(Integer, default=0, index=True)
    sku = Column(String, unique=True, index=True, nullable=True)
    brand = Column(String)
    discount_percentage = Column(Float, default=0.0)
