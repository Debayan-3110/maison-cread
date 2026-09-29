import openai
from sqlalchemy.orm import Session
from backend.app.repositories.product_repo import ProductRepository
from backend.app.core.config import settings
from backend.app.schemas.chat import ChatRequest, ChatResponse, RecommendedProduct
from backend.app.models.analytics import ChatLog
import json

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.product_repo = ProductRepository(db)
        openai.api_key = settings.OPENAI_API_KEY

    async def get_recommendation(self, request: ChatRequest) -> ChatResponse:
        # 1. Fetch and filter available products
        all_products = self.product_repo.get_all(limit=100)
        available_products = [
            {
                "id": p.id,
                "title": p.title,
                "price": p.price,
                "category": p.category,
                "description": p.description
            }
            for p in all_products if p.stock > 0
        ]

        # 2. Build the system prompt with real-time context
        system_prompt = (
            "You are a helpful E-commerce shopping assistant. "
            "You only recommend products that are currently in stock. "
            "Current available products: " + json.dumps(available_products) + "\n\n"
            "Respond in JSON format with the following structure: "
            "{"
            '  "reply": "Your friendly conversational response here", '
            '  "recommendations": [{"product_id": 1, "title": "Name", "price": 10.0, "reason": "Why it fits", "stock_status": "In Stock"}]'
            "}"
        )

        try:
            response = await openai.chat.completions.create(
                model="gpt-4-turbo-preview",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": request.message}
                ],
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)

            chat_response = ChatResponse(
                reply=result.get("reply", "I couldn't find any products matching your request."),
                recommendations=[RecommendedProduct(**p) for p in result.get("recommendations", [])]
            )

            # 3. Log the interaction for Admin Analytics
            rec_ids = ",".join([str(p.product_id) for p in chat_response.recommendations])
            log = ChatLog(
                query=request.message,
                response=chat_response.reply,
                recommended_product_ids=rec_ids
            )
            self.db.add(log)
            self.db.commit()

            return chat_response
        except Exception as e:
            print(f"AI Error: {e}")
            return ChatResponse(
                reply="I'm having a little trouble connecting to my brain. Please try again in a moment!",
                recommendations=[]
            )
