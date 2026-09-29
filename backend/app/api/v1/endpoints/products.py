from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.db.session import get_db
from backend.app.repositories.product_repo import ProductRepository
from backend.app.services.inventory_service import InventoryService
from backend.app.schemas.inventory import StockUpdate

router = APIRouter()

@router.get("/")
def get_products(
    category: Optional[str] = None,
    limit: int = 50,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    repo = ProductRepository(db)
    products = repo.get_all(limit=limit, skip=skip, category=category)
    return {"products": products, "total": len(products)}

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    repo = ProductRepository(db)
    product = repo.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/inventory/update")
def update_inventory(
    update_data: StockUpdate,
    db: Session = Depends(get_db)
):
    service = InventoryService(db)
    try:
        product = service.update_product_stock(update_data)
        return {"message": "Stock updated successfully", "product": product}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/inventory/low-stock")
def get_low_stock(db: Session = Depends(get_db)):
    service = InventoryService(db)
    return {"low_stock_items": service.get_inventory_alerts()}

