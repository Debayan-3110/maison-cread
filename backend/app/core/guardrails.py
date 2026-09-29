import json
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException

logger = logging.getLogger("ai_guardrails")

class ProductGuardrailCheck(BaseModel):
    product_id: int
    title: str
    price: float
    stock_status: str

class GuardrailResponse(BaseModel):
    reply: str
    recommendations: List[ProductGuardrailCheck]

def validate_llm_output(raw_output: str, active_catalog: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Validates that the OpenAI response conforms to Pydantic schemas
    and ensures recommended product IDs strictly exist in the active catalog.
    """
    try:
        data = json.loads(raw_output)
        # Note: We map to the actual schema used in our app
        validated = GuardrailResponse(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.error(f"LLM Schema Guardrail Violation: {str(e)}")
        return {
            "reply": "I apologize, but I am currently updating my catalog data. How else can I assist you?",
            "recommendations": []
        }

    valid_id_set = {item["id"] for item in active_catalog}
    sanitized_recs = []

    for item in validated.recommendations:
        if item.product_id in valid_id_set:
            sanitized_recs.append(item.model_dump())
        else:
            logger.warning(f"Hallucinated Product ID detected and pruned: {item.product_id}")

    return {
        "reply": validated.reply,
        "recommendations": sanitized_recs
    }
