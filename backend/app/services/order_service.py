from sqlalchemy.orm import Session
from backend.app.repositories.order_repo import OrderRepository
from backend.app.repositories.product_repo import ProductRepository
from fastapi import HTTPException
from typing import List, Dict, Any
import random

class OrderService:
    def __init__(self, db: Session):
        self.order_repo = OrderRepository(db)
        self.product_repo = ProductRepository(db)
        self.db = db

    def place_order(self, user_id: int, order_request: Dict[str, Any]) -> Dict[str, Any]:
        # 1. Validate Items and Calculate Totals
        items = order_request.get("items", [])
        validated_items = []
        subtotal = 0.0

        for item in items:
            product = self.product_repo.get_by_id(item["id"])
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item['id']} not found")
            
            quantity = item.get("quantity", 1)
            item_total = product.price * quantity
            subtotal += item_total
            
            validated_items.append({
                "product_id": product.id,
                "title": product.title,
                "price": product.price,
                "quantity": quantity
            })

        # 2. Create Order record
        order_id = f"ORD-{random.randint(100000, 999999)}"
        order_data = {
            "id": order_id,
            "user_id": user_id,
            "date": "2026-09-29", # Placeholder for date formatting logic
            "shipping_info": order_request.get("shippingInfo"),
            "payment_info": order_request.get("paymentInfo"),
            "summary": order_request.get("summary"),
            "status": "Processing"
        }

        order = self.order_repo.create_order(order_data, validated_items)
        
        return {
            "order_id": order.id,
            "status": order.status,
            "total": order.summary.get("total")
        }
