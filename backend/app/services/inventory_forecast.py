from fastapi import BackgroundTasks
import logging
from typing import List, Dict, Any
from pydantic import BaseModel

logger = logging.getLogger("inventory_forecast")

class ForecastResult(BaseModel):
    status: str
    days_remaining: float
    reorder_qty: int = 0

class InventoryForecastEngine:
    @staticmethod
    def calculate_runout_days(current_stock: int, daily_sales_velocity: float) -> float:
        """Calculates how many days of stock are left based on velocity."""
        if daily_sales_velocity <= 0:
            return 999.0
        return round(current_stock / daily_sales_velocity, 1)

    @classmethod
    async def trigger_automated_reorder(cls, product_id: int, reorder_qty: int):
        """
        Simulates an automated supplier API request or email generation.
        In a production system, this would call a procurement API.
        """
        logger.info(f"[AUTOMATED REORDER] 📦 Placed order for {reorder_qty} units of Product ID: {product_id}")
        # Logic for calling external supplier API would go here
        return {"status": "order_placed", "product_id": product_id, "quantity": reorder_qty}

async def evaluate_stock_and_reorder_background(
    product_id: int,
    current_stock: int,
    daily_sales: float,
    threshold_days: float,
    background_tasks: BackgroundTasks
) -> ForecastResult:
    """
    Analyzes stock health and schedules a background reorder if stock is low.
    """
    days_left = InventoryForecastEngine.calculate_runout_days(current_stock, daily_sales)

    if days_left <= threshold_days:
        # Restock for 30 days of projected sales
        reorder_amount = int(daily_sales * 30)

        # Schedule the reorder as a background task to avoid blocking the request
        background_tasks.add_task(
            InventoryForecastEngine.trigger_automated_reorder,
            product_id,
            reorder_amount
        )
        return ForecastResult(
            status="reorder_triggered",
            days_remaining=days_left,
            reorder_qty=reorder_amount
        )

    return ForecastResult(status="stock_healthy", days_remaining=days_left)
