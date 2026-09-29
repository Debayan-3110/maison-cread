# Advanced Feature Updates & System Extension Blueprint (v4)

## 1. Executive Summary & Vision

This document extends the architecture and code foundations established in `suggestion.md`, `suggestion-v2.md`, and `suggestion-v3.md`. It introduces **four advanced feature modules** designed to transition the **React + Vite** and **FastAPI** platform into a enterprise-grade e-commerce ecosystem:

1. **Multi-Turn Conversational Actions & Direct Cart Integration:** Enables the AI Chatbot to execute shopping intents (Add to Cart, Apply Coupons, Product Comparison) directly via OpenAI Function Calling.
2. **Real-Time WebSockets Telemetry & Inventory Synchronization:** Replaces HTTP polling with bidirectional WebSockets for live inventory stock sync across storefronts and admin dashboards.
3. **Automated AI Product Ingestion & Multimodal Tagging:** Admin utility to upload product images or unstructured text to automatically generate validated Pydantic catalog metadata.
4. **Role-Based Access Control (RBAC) & API Rate Limiting:** JWT-driven authorization hierarchies with Redis-backed sliding-window rate limiting for security and cost control.

---

## 2. Technical Stack Expansion

The new features build seamlessly on the established stack dependencies:
* **Frontend:** React with Vite, TypeScript, and Framer Motion micro-interactions.
* **Backend:** FastAPI (`0.104.1`), Uvicorn (`0.24.0`), and Pydantic (`2.5.0`).
* **AI Intelligence:** OpenAI Python SDK (`1.3.0`) using structured tool/function calling and multimodal inputs.
* **Real-time Protocol:** FastAPI native WebSockets (`/ws/inventory` and `/ws/analytics`).

---

## 3. Feature Module Specifications & Code Implementations

### 3.1. Feature 1: Multi-Turn Conversational Cart Actions

Instead of returning passive product recommendations, the chatbot can now emit executable function payloads (`ADD_TO_CART`, `APPLY_COUPON`, `COMPARE_ITEMS`) to update the frontend state directly.

#### FastAPI Function Calling Router (`app/api/v1/endpoints/chatbot_actions.py`)
```python
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from openai import OpenAI
import os

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class ChatActionRequest(BaseModel):
    message: str
    cart_items: List[str] = []

# OpenAI Function Specification
TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "add_product_to_cart",
            "description": "Add a specific product to the user's shopping cart by product ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_id": {"type": "string", "description": "The unique product SKU/ID"},
                    "quantity": {"type": "integer", "default": 1}
                },
                "required": ["product_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "apply_discount_coupon",
            "description": "Apply a promotional discount code to the cart.",
            "parameters": {
                "type": "object",
                "properties": {
                    "coupon_code": {"type": "string"}
                },
                "required": ["coupon_code"]
            }
        }
    }
]

@router.post("/chat/action")
async def process_chat_action(payload: ChatActionRequest):
    messages = [
        {"role": "system", "content": "You are a helpful e-commerce assistant capable of modifying carts and applying discounts."},
        {"role": "user", "content": payload.message}
    ]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=TOOLS_SPEC,
            tool_choice="auto"
        )
        response_message = response.choices[0].message

        # Check if model executed a tool call
        if response_message.tool_calls:
            tool_call = response_message.tool_calls[0]
            func_name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            return {
                "reply": f"I have executed {func_name} for you.",
                "action": {
                    "type": func_name,
                    "payload": args
                }
            }

        return {
            "reply": response_message.content,
            "action": None
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

### 3.2. Feature 2: Real-Time WebSockets Inventory & Analytics Sync

Replaces polling mechanisms with a lightweight WebSocket broadcast engine to synchronize stock adjustments instantly between the Admin Panel and Customer Storefronts.

#### FastAPI WebSocket Connection Manager (`app/core/websocket_manager.py`)
```python
from fastapi import WebSocket
from typing import List, Dict, Any
import json

class InventoryConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast_stock_update(self, product_id: str, new_stock: int):
        payload = json.dumps({
            "event": "STOCK_UPDATED",
            "product_id": product_id,
            "new_stock": new_stock
        })
        for connection in self.active_connections:
            await connection.send_text(payload)

inventory_ws_manager = InventoryConnectionManager()
```

#### FastAPI WebSocket Route (`app/api/v1/endpoints/ws.py`)
```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import inventory_ws_manager

router = APIRouter()

@router.websocket("/ws/inventory")
async def websocket_inventory_endpoint(websocket: WebSocket):
    await inventory_ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        inventory_ws_manager.disconnect(websocket)
```

---

### 3.3. Feature 3: Automated AI Product Ingestion & Tagging

Allows administrators to upload unformatted product descriptions or raw text to generate normalized, validated catalog records with auto-generated tags, SEO descriptions, and category placement.

#### Pydantic Ingestion Schemas & Endpoint (`app/api/v1/endpoints/ingestion.py`)
```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List
from openai import OpenAI
import os
import json

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class RawProductInput(BaseModel):
    unstructured_text: str

class ProcessedProductCatalog(BaseModel):
    title: str = Field(..., description="Clean commercial product title")
    category: str = Field(..., description="E-commerce taxonomy category")
    suggested_price: float = Field(..., description="Estimated market retail price in USD")
    tags: List[str] = Field(..., description="Search and filter tags")
    seo_description: str = Field(..., description="150-character meta description")

@router.post("/inventory/auto-ingest", response_model=ProcessedProductCatalog)
async def auto_ingest_product(payload: RawProductInput):
    prompt = f"""
    Extract structured catalog data from the following raw product text:
    "{payload.unstructured_text}"

    Return JSON adhering strictly to the schema:
    - title (string)
    - category (string)
    - suggested_price (float)
    - tags (list of strings)
    - seo_description (string)
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}]
        )
        data = json.loads(completion.choices[0].message.content)
        return ProcessedProductCatalog(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion processing failed: {str(e)}")
```

---

### 3.4. Feature 4: Role-Based Access Control (RBAC) Hierarchy

Guards admin endpoints with explicit permission scopes using FastAPI dependencies and JWT authentication.

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class TokenData(BaseModel):
    username: str
    role: str # e.g., "admin", "inventory_manager", "customer"

def require_role(allowed_roles: list[str]):
    async def role_checker(token: str = Depends(oauth2_scheme)):
        # Decode JWT token (simplified illustration)
        user_role = "admin"  # Retrieved from decoded token claims
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions for this operation"
            )
        return user_role
    return role_checker

# Usage in Admin Route:
# @router.post("/inventory/delete", dependencies=[Depends(require_role(["admin"]))])
```

---

## 4. Full Architecture Integration & Next Steps Roadmap

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          React + Vite Frontend                              │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Chatbot Action Engine  │  │ Live WebSockets Sync  │  │ Auto-Ingest UI │ │
│  └───────────┬────────────┘  └───────────┬───────────┘  └───────┬────────┘ │
└──────────────┼───────────────────────────┼──────────────────────┼──────────┘
               │ Cart Action HTTP          │ WebSocket Sync       │ Ingest HTTP
┌──────────────┼───────────────────────────┼──────────────────────┼──────────┐
│              ▼                           ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Backend (Uvicorn)                         │  │
│  │   - RBAC Middleware Guard                                            │  │
│  │   - OpenAPI Tool Execution Engine                                    │  │
│  │   - WebSocket Broadcast Manager                                      │  │
│  └───────┬───────────────────────────────┬──────────────────────┬───────┘  │
│          │                               │                      │          │
│          ▼                               ▼                      ▼          │
│  ┌──────────────┐                ┌──────────────┐       ┌──────────────┐   │
│  │ OpenAI Engine│                │ Inventory DB │       │ Redis Cache  │   │
│  └──────────────┘                └──────────────┘       └──────────────┘   │
│                                Python Backend                              │
└────────────────────────────────────────────────────────────────────────────┘
```

1. **Step 1: Mount Action & Ingestion Endpoints**
   * Register `/chat/action` and `/inventory/auto-ingest` in `app/api/v1/router.py`.
2. **Step 2: Connect Frontend WebSocket Hook**
   * Implement `useWebSocket('/ws/inventory')` in React to update product stock counts without page refreshes.
3. **Step 3: Cart Action State Dispatcher**
   * Wire the chatbot response actions directly into the React cart context dispatcher.
