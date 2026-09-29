from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.services.recommendation_service import RecommendationService
from backend.app.services.ai_orchestrator import ai_orchestrator
from backend.app.schemas.chat import ChatRequest, ChatResponse
from backend.app.core.guardrails import validate_llm_output
from typing import Any, Dict

router = APIRouter()

@router.post("/recommend", response_model=ChatResponse)
async def get_recommendation(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    # First, try using the AI Orchestrator to see if there's an executable action
    orchestrator_res = await ai_orchestrator.process_message(request.message)

    if orchestrator_res.action:
        return ChatResponse(
            reply=orchestrator_res.reply,
            action=orchestrator_res.action.dict()
        )

    # Fall back to the traditional recommendation service for product lists
    service = RecommendationService(db)
    try:
        # The recommendation service internally calls OpenAI.
        # We wrap the final output with the guardrail validator.
        result = await service.get_recommendation(request)

        # Guardrail: Validate the response against the active catalog
        # We fetch all products to ensure the LLM didn't hallucinate a product ID
        active_catalog = db.query(RecommendationService.Product).all() # simplified for logic
        # In a real implementation, we'd pass the actual catalog data

        # For the sake of this blueprint's core logic, we apply the guardrail:
        # Note: get_recommendation returns a ChatResponse, we pass its dict representation
        sanitized = validate_llm_output(
            json.dumps(result.dict()),
            [{"id": p.id, "title": p.title} for p in active_catalog]
        )

        return ChatResponse(**sanitized)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
