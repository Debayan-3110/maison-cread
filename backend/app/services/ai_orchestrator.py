import os
import json
from typing import List, Optional, Dict, Any
from openai import OpenAI
from pydantic import BaseModel, Field

_openai_client: Optional[OpenAI] = None

def _get_client() -> Optional[OpenAI]:
    """Lazy-initialize the OpenAI client so missing keys don't crash startup."""
    global _openai_client
    if _openai_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here":
            try:
                _openai_client = OpenAI(api_key=api_key)
            except Exception:
                pass
    return _openai_client


class AIAction(BaseModel):
    type: str = Field(..., description="The action type: ADD_TO_CART, CHECK_STOCK, or RECOMMEND_PRODUCTS")
    payload: Dict[str, Any] = Field(..., description="Arguments for the action")

class AIResponse(BaseModel):
    reply: str = Field(..., description="Conversational response to the user")
    action: Optional[AIAction] = None

# OpenAI Tool Definitions
TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "add_to_cart",
            "description": "Add a specific product to the user's shopping cart.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer", "description": "The unique ID of the product"},
                    "quantity": {"type": "integer", "description": "Number of items to add", "default": 1}
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "check_stock",
            "description": "Check the current availability of a product.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "integer", "description": "The unique ID of the product"}
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recommend_products",
            "description": "Suggest products based on a category or preference.",
            "parameters": {
                "type": "object",
                "properties": {
                    "category": {"type": "string", "description": "The product category to search in"},
                    "max_results": {"type": "integer", "description": "Max number of suggestions", "default": 3}
                },
                "required": ["category"]
            }
        }
    }
]

class AIOrchestrator:
    async def process_message(self, message: str, chat_history: List[Dict[str, str]] = []) -> AIResponse:
        client = _get_client()
        if client is None:
            return AIResponse(reply="AI assistant is not configured. Please set OPENAI_API_KEY to enable AI features.")

        messages = [
            {"role": "system", "content": "You are a premium e-commerce AI assistant. You can help users find products and manage their carts. Use the provided tools to perform actions. Always respond in a sophisticated, helpful tone."},
            *chat_history,
            {"role": "user", "content": message}
        ]

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=TOOLS,
                tool_choice="auto"
            )

            response_message = response.choices[0].message

            # Handle Tool Calls
            if response_message.tool_calls:
                tool_call = response_message.tool_calls[0]
                func_name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)

                # Map OpenAI function names to our Frontend Action types
                action_mapping = {
                    "add_to_cart": "ADD_TO_CART",
                    "check_stock": "CHECK_STOCK",
                    "recommend_products": "RECOMMEND_PRODUCTS"
                }

                return AIResponse(
                    reply=f"I've processed that for you. I'll {func_name.replace('_', ' ')} now.",
                    action=AIAction(type=action_mapping.get(func_name, "UNKNOWN"), payload=args)
                )

            return AIResponse(reply=response_message.content or "I'm not sure how to help with that.")

        except Exception as e:
            print(f"AI Orchestrator Error: {e}")
            return AIResponse(reply="I encountered a technical glitch. Please try again.")

ai_orchestrator = AIOrchestrator()
