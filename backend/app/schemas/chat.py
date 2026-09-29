from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str

class RecommendedProduct(BaseModel):
    product_id: int
    title: str
    price: float
    reason: str
    stock_status: str

class ChatResponse(BaseModel):
    reply: str
    recommendations: List[RecommendedProduct] = []
    action: Optional[Dict[str, Any]] = None
