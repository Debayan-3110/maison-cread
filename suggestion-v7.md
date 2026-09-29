# Omnichannel AI Ecosystem, Multi-Tenant Architecture & Dynamic Pricing Blueprint (v7)

## 1. Executive Summary & Strategic Vision

This document expands the architectural foundation, design system, enterprise backend, and RAG pipelines established across `suggestion.md` through `suggestion-v6.md`. **Version 7** evolves the platform into an **Omnichannel, Autonomous E-Commerce Operating System**, enabling multi-region internationalization, external AI agent channels (WhatsApp, Email, Social Commerce), real-time dynamic pricing, and event-driven behavioral analytics.

Key Focus Areas in **v7**:
1. **Multi-Tenant & Global Multi-Region Engine:** Dynamic localization (i18n), multi-currency conversions, and tax compliance built into the **React + Vite** frontend and **FastAPI** backend [1, 2].
2. **Omnichannel AI Agent Webhooks (WhatsApp, Social & Email):** Exposing the OpenAI-powered recommendation chatbot via webhook interfaces for WhatsApp Business, Instagram Direct, and async email re-engagement engines [2].
3. **Autonomous Dynamic Pricing & Margin Guardrails:** An automated pricing service driven by demand elasticity, inventory turnover, and strict Pydantic profit margin safety checks [2].
4. **Event-Driven Streaming & Customer Segmentation:** Streaming user events (`product_view`, `chat_interaction`, `cart_abandonment`) through a distributed event bus for real-time storefront personalization.
5. **Zero-Trust Auth & PCI-DSS Tokenization:** Upgrading authentication to WebAuthn / Passkeys alongside Stripe payment tokenization for PCI compliance.

---

## 2. Technical Stack & Dependencies Reference

The v7 extensions integrate seamlessly with the project's dependency ecosystem:
* **Frontend:** React with Vite build tooling, TypeScript, Oxlint, Framer Motion, and `i18next` [1].
* **Backend Core:** FastAPI (`0.104.1`), Uvicorn (`0.24.0`), Pydantic (`2.5.0`), `python-dotenv` (`1.0.0`) [2].
* **AI & Messaging Engines:** OpenAI SDK (`1.3.0`), Celery / Redis Queue for async background webhooks [2].
* **Data & Event Layer:** PostgreSQL (`pgvector`), Redis Streams, SQLAlchemy, Alembic.

---

## 3. Advanced Architectural Modules & Code Implementations

### 3.1. Module 1: Multi-Region Localization & Currency Engine

To support international tenants, this module provides dynamic currency conversion and localized Pydantic validation schemas in FastAPI [2].

```python
# app/core/localization.py
from decimal import Decimal
from typing import Dict
from pydantic import BaseModel, Field

CURRENCY_RATES: Dict[str, Decimal] = {
    "USD": Decimal("1.00"),
    "EUR": Decimal("0.92"),
    "GBP": Decimal("0.79"),
    "JPY": Decimal("155.20")
}

class LocalizedPrice(BaseModel):
    currency: str = Field(..., example="EUR")
    amount: float
    formatted_symbol: str

def convert_currency(amount_usd: float, target_currency: str) -> LocalizedPrice:
    rate = CURRENCY_RATES.get(target_currency.upper(), Decimal("1.00"))
    converted = Decimal(str(amount_usd)) * rate
    symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    
    return LocalizedPrice(
        currency=target_currency.upper(),
        amount=round(float(converted), 2),
        formatted_symbol=f"{symbols.get(target_currency.upper(), '$')}{converted:.2f}"
    )
```

---

### 3.2. Module 2: Omnichannel AI Messaging Webhook (WhatsApp / Social Commerce)

This webhook endpoint allows external messaging platforms (e.g., WhatsApp Business API) to route user messages through the existing OpenAI (`1.3.0`) recommendation and inventory engine [2].

```python
# app/api/v1/endpoints/omnichannel.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
import openai
from app.core.config import settings
from app.services.inventory_service import get_active_inventory

router = APIRouter()
client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

class WebhookMessage(BaseModel):
    channel: str  # "whatsapp", "instagram", "email"
    sender_id: str
    message_body: str
    user_locale: str = "USD"

@router.post("/webhook/channel-message")
async def handle_channel_message(payload: WebhookMessage, background_tasks: BackgroundTasks):
    # 1. Fetch live inventory context
    inventory_data = await get_active_inventory()
    
    # 2. Query OpenAI Chat Completion with channel constraints
    system_prompt = (
        f"You are an AI sales assistant responding over {payload.channel}. "
        "Keep responses under 160 characters for SMS/WhatsApp. "
        f"Available Products: {inventory_data}"
    )
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": payload.message_body}
        ],
        max_tokens=150
    )
    
    ai_reply = response.choices[0].message.content
    
    # 3. Queue outbound message payload to background task queue
    # background_tasks.add_task(send_whatsapp_response, payload.sender_id, ai_reply)
    
    return {"status": "processed", "channel": payload.channel, "reply": ai_reply}
```

---

### 3.3. Module 3: Autonomous Dynamic Pricing & Margin Guardrails

An intelligent pricing service that adjusts product prices dynamically based on stock velocity, while enforcing absolute minimum profit margin rules using Pydantic (`2.5.0`) [2].

```python
# app/services/dynamic_pricing.py
from pydantic import BaseModel, field_validator
from fastapi import HTTPException

class PriceAdjustmentRequest(BaseModel):
    sku: str
    base_cost: float
    current_price: float
    demand_multiplier: float  # e.g., 1.15 for +15% demand spike
    min_margin_percent: float = 20.0  # Minimum 20% profit margin required

    @field_validator("demand_multiplier")
    def validate_multiplier(cls, v):
        if v < 0.5 or v > 2.0:
            raise ValueError("Multiplier must be between 0.5x and 2.0x")
        return v

def calculate_dynamic_price(req: PriceAdjustmentRequest) -> float:
    proposed_price = req.current_price * req.demand_multiplier
    cost_floor = req.base_cost * (1 + (req.min_margin_percent / 100))
    
    # Enforce strict profit margin guardrail
    if proposed_price < cost_floor:
        return round(cost_floor, 2)
    
    return round(proposed_price, 2)
```

---

### 3.4. Module 4: Event-Driven Analytics & Customer Segmentation

A real-time analytics streaming logger that tracks user interactions and broadcasts events over WebSockets to update the Admin Bento Dashboard in real time.

```python
# app/services/event_stream.py
import json
import time
from typing import Dict, Any
from app.core.redis import redis_client

async def log_user_event(event_type: str, user_id: str, payload: Dict[str, Any]):
    event_data = {
        "event_type": event_type,  # e.g., "cart_add", "chat_query", "view_item"
        "user_id": user_id,
        "timestamp": time.time(),
        "payload": payload
    }
    # Stream event to Redis Stream channel
    await redis_client.xadd("stream:user_events", {"data": json.dumps(event_data)})
```

---

## 4. Full System Architecture (v7)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           Omnichannel Client Surface                            │
│  ┌───────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐  │
│  │ React + Vite Frontend │  │ WhatsApp / Instagram   │  │ Async Email Engine │  │
│  │ (Framer Motion UI)    │  │ Business Messaging     │  │ (Klaviyo / Redis)  │  │
│  └───────────┬───────────┘  └───────────┬────────────┘  └─────────┬──────────┘  │
└──────────────┼──────────────────────────┼─────────────────────────┼─────────────┘
               │ Rest HTTP / WebSockets   │ Async Channel Webhooks  │ Background Jobs
┌──────────────┼──────────────────────────┼─────────────────────────┼─────────────┐
│              ▼                          ▼                         ▼             │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Core Platform (Uvicorn)                         │  │
│  │   - Multi-Region Currency & i18n Middleware                              │  │
│  │   - Dynamic Pricing & Profit Margin Guardrails                           │  │
│  │   - Event Stream Logger (Redis Streams)                                  │  │
│  │   - AI Observability & Guardrail Engine (Pydantic / OpenAI)              │  │
│  └───────┬──────────────────────────────┬─────────────────────────────┬──────┘  │
│          │                              │                             │         │
│          ▼                              ▼                             ▼         │
│  ┌──────────────┐               ┌──────────────┐              ┌──────────────┐  │
│  │ OpenAI SDK   │               │ PostgreSQL   │              │ Redis        │  │
│  │ (gpt-4o-mini)│               │ (pgvector)   │              │ Streams/Cache│  │
│  └──────────────┘               └──────────────┘              └──────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementation & Rollout Roadmap (v7)

1. **Phase 1: Omnichannel Webhooks & Messaging Pipeline**
   * Deploy the `/webhook/channel-message` endpoint to ingest external message payloads from WhatsApp and Instagram.
   * Attach background task workers for async outbound message dispatching.

2. **Phase 2: Dynamic Pricing & Margin Protection Engine**
   * Implement `calculate_dynamic_price` and connect it to background inventory velocity triggers.
   * Verify profit margin safety guardrails using Pytest.

3. **Phase 3: Event Streaming & Localization Integration**
   * Configure `i18next` and currency switcher components in the **React + Vite** frontend.
   * Stream frontend behavioral telemetry into Redis Streams to feed the real-time Admin Bento Dashboard.
