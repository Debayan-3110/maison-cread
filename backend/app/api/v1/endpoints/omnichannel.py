from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from openai import OpenAI
from backend.app.core.config import settings
from backend.app.services.recommendation_service import RecommendationService
from sqlalchemy.orm import Session
from fastapi import Depends
from backend.app.db.session import get_db

router = APIRouter()
client = OpenAI(api_key=settings.OPENAI_API_KEY)

class WebhookMessage(BaseModel):
    channel: str  # "whatsapp", "instagram", "email"
    sender_id: str
    message_body: str
    user_locale: str = "USD"

async def send_channel_response(channel: str, sender_id: str, text: str):
    """
    Async worker to send messages back to the external channel.
    In production, this calls the WhatsApp/Instagram API.
    """
    # Simulation of external API call
    print(f"[OUTBOUND {channel.upper()}] To {sender_id}: {text}")

@router.post("/webhook/channel-message")
async def handle_channel_message(
    payload: WebhookMessage,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # 1. Fetch live inventory context using existing recommendation service
    # We use a mock search to get context for the LLM
    service = RecommendationService(db)
    # In a real scenario, we'd perform a search based on the message_body
    # Here we just fetch a sample of active products for context
    products = service.get_active_inventory() if hasattr(service, 'get_active_inventory') else []

    # 2. Query OpenAI Chat Completion with channel-specific constraints
    system_prompt = (
        f"You are an AI sales assistant responding over {payload.channel}. "
        "Keep responses concise (under 160 characters) for messaging apps. "
        f"Available Products Context: {products}"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.message_body}
            ],
            max_tokens=150
        )

        ai_reply = response.choices[0].message.content

        # 3. Queue outbound message to background task
        background_tasks.add_task(send_channel_response, payload.channel, payload.sender_id, ai_reply)

        return {
            "status": "processed",
            "channel": payload.channel,
            "reply": ai_reply
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Omnichannel AI error: {str(e)}")
