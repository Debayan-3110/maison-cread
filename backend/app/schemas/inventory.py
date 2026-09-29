from pydantic import BaseModel, Field
from typing import Optional

class StockUpdate(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=0, description="Stock quantity cannot be negative")

class InventoryStatus(BaseModel):
    product_id: int
    title: str
    current_stock: int
    sku: Optional[str]
    low_stock_warning: bool
