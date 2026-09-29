from sqlalchemy.orm import Session
from backend.app.repositories.product_repo import ProductRepository
from backend.app.schemas.inventory import StockUpdate
from typing import List
from backend.app.models.product import Product
import asyncio
from backend.app.core.websocket_manager import inventory_ws_manager

class InventoryService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)

    async def update_product_stock(self, update_data: StockUpdate) -> Product:
        product = self.product_repo.update_stock(update_data.product_id, update_data.quantity)
        if not product:
            raise ValueError(f"Product with ID {update_data.product_id} not found")

        # Broadcast the update to all connected storefronts
        await inventory_ws_manager.broadcast_stock_update(product.id, product.stock)

        return product

    def get_inventory_alerts(self, threshold: int = 10) -> List[Product]:
        return self.product_repo.get_low_stock_items(threshold)

    def check_stock_availability(self, product_id: int, requested_quantity: int = 1) -> bool:
        product = self.product_repo.get_by_id(product_id)
        return product is not None and product.stock >= requested_quantity
