from datetime import datetime, timedelta
from typing import List, Dict, Any

class TrackingService:
    @staticmethod
    def generate_timeline(order_id: str, created_at: str) -> List[Dict[str, Any]]:
        # In a real system, this would query a tracking table
        # Here we generate a realistic simulated timeline based on order date
        start_date = datetime.fromisoformat(created_at.replace(" ", "T"))
        
        return [
            {
                "status": "Order Placed",
                "date": start_date.strftime("%b %d, %I:%M %p"),
                "description": "Your order has been successfully placed and is being processed.",
                "completed": True
            },
            {
                "status": "Payment Verified",
                "date": (start_date + timedelta(hours=2)).strftime("%b %d, %I:%M %p"),
                "description": "Payment confirmed by our secure gateway.",
                "completed": True
            },
            {
                "status": "Packaging",
                "date": (start_date + timedelta(days=1)).strftime("%b %d, %I:%M %p"),
                "description": "Our team is carefully packing your luxury items.",
                "completed": True
            },
            {
                "status": "Shipped",
                "date": (start_date + timedelta(days=2)).strftime("%b %d, %I:%M %p"),
                "description": "Your package has left our warehouse and is in transit.",
                "completed": False
            },
            {
                "status": "Delivered",
                "date": (start_date + timedelta(days=3)).strftime("%b %d, %I:%M %p"),
                "description": "Your order has arrived at the destination address.",
                "completed": False
            }
        ]
