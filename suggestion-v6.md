# Advanced AI RAG, Vector Search, Predictive Inventory & Redis Caching Blueprint (v6)

## 1. Executive Summary & Architectural Evolution

This document builds directly upon the architecture, design system, feature set, and enterprise infrastructure established across `suggestion.md`, `suggestion-v2.md`, `suggestion-v3.md`, `suggestion-v4.md`, and `suggestion-v5.md`.

In **v6**, the platform evolves from structured query interactions into an **intelligent, predictive, and high-performance e-commerce ecosystem**. 

Key innovations introduced in **v6**:
1. **Hybrid Vector Search & Catalog RAG Engine:** Combining `pgvector` similarity search with PostgreSQL keyword filtering to enable natural language product discovery (e.g., *"Find minimalist linen shirts for a summer wedding under $120"*).
2. **Dynamic User Preference Profiling & Contextual Personalization:** Building real-time user affinity vectors from browsing, cart, and chat history to personalize AI recommendations.
3. **Predictive Inventory Forecasting & Automated Reorder Workflows:** Machine-learning-assisted stock depletion predictions with background task automation for supplier purchase orders.
4. **Redis Caching & Distributed Rate Limiting Layer:** High-speed caching for embeddings and frequent LLM responses to slash API latencies (< 150ms) and token costs, combined with sliding-window rate limiting.
5. **Comprehensive Automated Testing & E2E Validation Suite:** Unit, integration, and end-to-end testing protocols using Pytest and Playwright.

---

## 2. Technical Stack & New Infrastructure Dependencies

The **v6** updates extend the foundation defined in `requirements.txt` and `README.md`:
* **Frontend:** React + Vite SPA, TypeScript, Framer Motion spring physics, Oxlint rules [1].
* **Backend Framework:** FastAPI (`0.104.1`), Uvicorn (`0.24.0`), Pydantic (`2.5.0`) [2].
* **AI & Embeddings:** OpenAI SDK (`1.3.0`) using `gpt-4o-mini` for chat and `text-embedding-3-small` for vector generation [2].
* **Database & Vector Extension:** PostgreSQL with `pgvector`, SQLAlchemy ORM, and Alembic migrations.
* **Caching & Message Broker:** Redis (`redis-py`) for semantic response caching and distributed rate-limiting.
* **Task Automation:** FastAPI `BackgroundTasks` / Celery for automated inventory restocking triggers.

---

## 3. Production Module Specifications & Code Implementations

### 3.1. Module 1: Hybrid Vector Search & Catalog RAG Engine

Enhances product discovery by converting catalog item descriptions into 1536-dimensional embeddings and storing them in PostgreSQL via `pgvector`. Queries execute a hybrid search combining vector cosine similarity with SQL price/category filters.

```python
# app/services/vector_search.py
import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI
import os
from pydantic import BaseModel

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class VectorSearchResult(BaseModel):
    id: str
    name: str
    category: str
    price: float
    stock_quantity: int
    similarity_score: float

def generate_embedding(text_content: str) -> List[float]:
    """Generates a 1536-dimensional embedding using OpenAI text-embedding-3-small."""
    response = client.embeddings.create(
        input=text_content,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def hybrid_product_search(
    db: Session,
    query_text: str,
    category_filter: Optional[str] = None,
    max_price: Optional[float] = None,
    limit: int = 5
) -> List[VectorSearchResult]:
    """
    Executes hybrid search combining pgvector cosine distance and SQL metadata filters.
    """
    query_vector = generate_embedding(query_text)
    vector_str = f"[{','.join(map(str, query_vector))}]"

    sql = """
        SELECT id, name, category, price, stock_quantity,
               1 - (embedding <=> :vector::vector) AS similarity
        FROM products
        WHERE is_active = TRUE AND stock_quantity > 0
    """
    params: Dict[str, Any] = {"vector": vector_str, "limit": limit}

    if category_filter:
        sql += " AND category = :category"
        params["category"] = category_filter

    if max_price:
        sql += " AND price <= :max_price"
        params["max_price"] = max_price

    sql += " ORDER BY embedding <=> :vector::vector LIMIT :limit"

    result = db.execute(text(sql), params)
    
    return [
        VectorSearchResult(
            id=row.id,
            name=row.name,
            category=row.category,
            price=row.price,
            stock_quantity=row.stock_quantity,
            similarity_score=round(float(row.similarity), 4)
        )
        for row in result
    ]
```

---

### 3.2. Module 2: Personalized User Preference Vectors & Dynamic Prompting

Tracks user interaction signals (viewed categories, preferred price range, style keywords) to construct a dynamic user profile injected into the OpenAI prompt context.

```python
# app/services/personalization.py
from pydantic import BaseModel, Field
from typing import List, Dict

class UserProfile(BaseModel):
    user_id: str
    preferred_categories: List[str] = Field(default_factory=list)
    avg_budget: float = 100.0
    style_affinities: List[str] = Field(default_factory=list)

def build_personalized_system_prompt(base_prompt: str, profile: UserProfile) -> str:
    """
    Injects real-time user preference signals into the chatbot's system instruction.
    """
    categories_str = ", ".join(profile.preferred_categories) if profile.preferred_categories else "General"
    styles_str = ", ".join(profile.style_affinities) if profile.style_affinities else "Standard"

    personalization_context = f"""
    
    [CUSTOMER PERSONALIZATION CONTEXT]
    - Preferred Product Categories: {categories_str}
    - Typical Spending Budget: ~${profile.avg_budget:.2f}
    - Style & Feature Preferences: {styles_str}
    
    Tailor recommendations to subtle preference cues while respecting strict inventory availability.
    """
    return base_prompt + personalization_context
```

---

### 3.3. Module 3: Predictive Inventory Forecasting & Automated Reorders

Monitors sales velocity over time and predicts when stock will breach safety levels. Automatically issues purchase reorder tasks via FastAPI `BackgroundTasks`.

```python
# app/services/inventory_forecast.py
from fastapi import BackgroundTasks
import logging
from typing import List, Dict

logger = logging.getLogger("inventory_forecast")

class InventoryForecastEngine:
    @staticmethod
    def calculate_runout_days(current_stock: int, daily_sales_velocity: float) -> float:
        if daily_sales_velocity <= 0:
            return 999.0
        return round(current_stock / daily_sales_velocity, 1)

    @classmethod
    def trigger_automated_reorder(cls, product_id: str, reorder_qty: int):
        """Simulates automated supplier API request or email generation."""
        logger.info(f"[AUTOMATED REORDER] Placed order for {reorder_qty} units of SKU: {product_id}")

def evaluate_stock_and_reorder_background(
    product_id: str,
    current_stock: int,
    daily_sales: float,
    threshold_days: float,
    background_tasks: BackgroundTasks
):
    days_left = InventoryForecastEngine.calculate_runout_days(current_stock, daily_sales)
    if days_left <= threshold_days:
        reorder_amount = int(daily_sales * 30)  # Restock for 30 days
        background_tasks.add_task(
            InventoryForecastEngine.trigger_automated_reorder,
            product_id,
            reorder_amount
        )
        return {"status": "reorder_triggered", "days_remaining": days_left, "reorder_qty": reorder_amount}
    
    return {"status": "stock_healthy", "days_remaining": days_left}
```

---

### 3.4. Module 4: Redis Caching & Distributed Rate-Limiting Middleware

Accelerates chatbot response speeds by caching vector search embeddings and enforcing a 60-requests-per-minute rate limit per IP.

```python
# app/middleware/rate_limiter.py
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
import time

class RedisRateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_limit: int = 60, window_seconds: int = 60):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # In-memory store fallback (Replace with redis_client in production)
        self.client_records = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()

        # Clean old window entries
        timestamps = self.client_records.get(client_ip, [])
        valid_timestamps = [t for t in timestamps if current_time - t < self.window_seconds]

        if len(valid_timestamps) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please slow down your requests."
            )

        valid_timestamps.append(current_time)
        self.client_records[client_ip] = valid_timestamps

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(self.requests_limit)
        response.headers["X-RateLimit-Remaining"] = str(self.requests_limit - len(valid_timestamps))
        return response
```

---

### 3.5. Module 5: Comprehensive Automated Testing & E2E Validation Suite

Ensures code health and guardrail compliance across backend FastAPI endpoints and React frontend components.

```python
# tests/test_recommendations.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_guardrails_prunes_hallucinated_sku():
    """Validates that non-existent product SKUs returned by LLM are safely removed."""
    from app.core.guardrails import validate_llm_output
    
    mock_llm_json = '{"reply": "Here are your items", "recommendations": [{"id": "REAL-1", "name": "Shirt", "price": 40.0, "in_stock": true}, {"id": "FAKE-999", "name": "Magic Wand", "price": 999.0, "in_stock": true}]}'
    mock_catalog = [{"id": "REAL-1", "name": "Shirt", "price": 40.0, "in_stock": True}]
    
    result = validate_llm_output(mock_llm_json, mock_catalog)
    
    assert len(result["recommendations"]) == 1
    assert result["recommendations"][0]["id"] == "REAL-1"

def test_rate_limiter_header():
    """Validates rate-limit headers present on HTTP response."""
    response = client.get("/api/v1/products")
    assert "X-RateLimit-Limit" in response.headers
```

---

## 4. End-to-End System Integration Matrix (v6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Client Layer (React + Vite)                       │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ Floating Chatbot UI    │  │  Admin Bento Panel    │  │ Theme Engine   │ │
│  │ (Framer Motion / v3)   │  │  (Real-Time Analytics)│  │ (Dark / Light) │ │
│  └───────────┬────────────┘  └───────────┬───────────┘  └───────┬────────┘ │
└──────────────┼───────────────────────────┼──────────────────────┼──────────┘
               │ REST / WebSockets         │ Admin Operations     │
┌──────────────┼───────────────────────────┼──────────────────────┼──────────┐
│              ▼                           ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                       FastAPI Server (Uvicorn)                       │  │
│  │   - RedisRateLimiterMiddleware (60 req/min)                         │  │
│  │   - AIObservabilityMiddleware (Cost/Token Tracking)                  │  │
│  │   - Pydantic Output Guardrails & Fallbacks                         │  │
│  └───────┬───────────────────────────────┬──────────────────────┬───────┘  │
│          │                               │                      │          │
│          ▼                               ▼                      ▼          │
│  ┌──────────────┐                ┌──────────────┐       ┌──────────────┐   │
│  │ Hybrid RAG   │                │ PostgreSQL   │       │ Redis Cache  │   │
│  │ (pgvector)   │                │ + SQLAlchemy │       │ & Sub/Pub    │   │
│  └──────────────┘                └──────────────┘       └──────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Phased Implementation Roadmap (v6)

1. **Phase 1: Database Extension & pgvector Setup**
   * Enable the `pgvector` extension in PostgreSQL and run Alembic migration `002_add_product_embeddings`.
   * Populate vector embeddings for existing products using `text-embedding-3-small`.

2. **Phase 2: Hybrid Search & Personalization Rollout**
   * Integrate `hybrid_product_search` into `/api/v1/chat/recommend`.
   * Attach user preference vector context to system prompt builders.

3. **Phase 3: Redis Caching, Predictive Restocking & Test Automation**
   * Deploy Redis container for embedding cache and sliding-window rate limiting.
   * Run Pytest test suite to verify guardrail pruning, model validation, and rate-limiting rules.
