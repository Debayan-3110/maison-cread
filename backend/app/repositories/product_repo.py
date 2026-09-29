from sqlalchemy.orm import Session
from backend.app.models.product import Product
from typing import List, Optional

class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_all(self, limit: int = 50, skip: int = 0, category: Optional[str] = None) -> List[Product]:
        query = self.db.query(Product)
        if category and category.lower() != "all":
            query = query.filter(Product.category.ilike(category))
        return query.offset(skip).limit(limit).all()

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def search(self, query: str) -> List[Product]:
        return self.db.query(Product).filter(
            (Product.title.ilike(f"%{query}%")) |
            (Product.description.ilike(f"%{query}%")) |
            (Product.category.ilike(f"%{query}%"))
        ).all()

    def update_stock(self, product_id: int, quantity: int) -> Optional[Product]:
        product = self.get_by_id(product_id)
        if product:
            product.stock = quantity
            self.db.commit()
            self.db.refresh(product)
        return product

    def get_low_stock_items(self, threshold: int = 10) -> List[Product]:
        return self.db.query(Product).filter(Product.stock <= threshold).all()
