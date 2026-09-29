from pydantic import BaseModel, field_validator
from fastapi import HTTPException

class PriceAdjustmentRequest(BaseModel):
    sku: str
    base_cost: float
    current_price: float
    demand_multiplier: float  # e.g., 1.15 for +15% demand spike
    min_margin_percent: float = 20.0  # Minimum 20% profit margin required

    @field_validator("demand_multiplier")
    @classmethod
    def validate_multiplier(cls, v):
        if v < 0.5 or v > 2.0:
            raise ValueError("Multiplier must be between 0.5x and 2.0x")
        return v

def calculate_dynamic_price(req: PriceAdjustmentRequest) -> float:
    """
    Calculates a dynamic price based on demand while enforcing a
    strict profit margin floor to protect business viability.
    """
    proposed_price = req.current_price * req.demand_multiplier

    # Margin Guardrail: cost + (cost * min_margin_percent)
    cost_floor = req.base_cost * (1 + (req.min_margin_percent / 100))

    # If proposed price is below the margin floor, return the floor
    if proposed_price < cost_floor:
        return round(cost_floor, 2)

    return round(proposed_price, 2)
