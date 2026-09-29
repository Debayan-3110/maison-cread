from sqlalchemy.orm import Session
from backend.app.models.order import Order, OrderItem
from typing import List, Optional

class OrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_order(self, order_data: dict, items_data: List[dict]) -> Order:
        db_order = Order(**order_data)
        self.db.add(db_order)
        self.db.flush() # Get order.id
        
        for item in items_data:
            db_item = OrderItem(order_id=db_order.id, **item)
            self.db.add(db_item)
            
        self.db.commit()
        self.db.refresh(db_order)
        return db_order

    def get_user_orders(self, user_id: Optional[int]) -> List[Order]:
        query = self.db.query(Order)
        if user_id:
            query = query.filter(Order.user_id == user_id)
        return query.all()
