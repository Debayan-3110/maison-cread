from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.db.session import get_db
from backend.app.services.order_service import OrderService
from backend.app.repositories.order_repo import OrderRepository

router = APIRouter()

def get_order_service(db: Session = Depends(get_db)):
    return OrderService(db)

@router.post("/")
def create_order(
    order_data: Dict[str, Any], 
    user_id: int, # In production, this comes from get_current_user
    order_service: OrderService = Depends(get_order_service)
):
    return order_service.place_order(user_id, order_data)

@router.get("/")
def list_orders(
    user_id: int, 
    db: Session = Depends(get_db)
):
    repo = OrderRepository(db)
    orders = repo.get_user_orders(user_id)
    return {"orders": orders}
