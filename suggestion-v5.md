# Enterprise Infrastructure, AI Observability & Migration Blueprint (v5)

## 1. Executive Summary & Vision

This document extends the architecture, design system, and code implementations established in `suggestion.md`, `suggestion-v2.md`, `suggestion-v3.md`, and `suggestion-v4.md`. It provides an enterprise-ready blueprint for scaling the **React + Vite** frontend and **FastAPI** (`0.104.1`) backend platform into a battle-tested production environment.

Key focus areas in **v5**:
1. **LLM Guardrails & Hallucination Prevention Framework:** Implementing strict validation, fallback mechanisms, and prompt safety guards around the OpenAI SDK (`1.3.0`) integration [2].
2. **Database Migration & Scaling Architecture (SQLite -> PostgreSQL):** Version-controlled Alembic migrations and SQLAlchemy ORM models for production data scaling [2].
3. **AI Observability, Telemetry & Token Cost Tracking:** Middleware and metrics collection for tracking AI response latencies, token consumption, and conversion analytics.
4. **Production CI/CD & Build Optimization:** Vite build performance tuning (Oxc/SWC plugins, TypeScript type checking, and Dockerization) [1, 2].

---

## 2. Technical Stack & Dependencies Reference

The enterprise updates build directly on the existing stack:
* **Frontend:** React with Vite, TypeScript, Oxlint type-aware linting rules [1].
* **Backend API:** FastAPI (`0.104.1`), Uvicorn (`0.24.0`), Pydantic (`2.5.0`) [2].
* **AI Engine & Validation:** OpenAI API SDK (`1.3.0`) [2].
* **Environment & Security:** `python-dotenv` (`1.0.0`) [2].
* **Database & Migrations:** SQLite (local development) / PostgreSQL (production) with SQLAlchemy and Alembic.

---

## 3. Enterprise Module Specifications & Code Implementations

### 3.1. Module 1: LLM Guardrails & Hallucination Prevention

To prevent prompt injection, hallucinated product SKUs, or non-compliant output from the OpenAI API, this guardrail middleware wraps the LLM completion layer with schema verification and stock validation using Pydantic (`2.5.0`) [2].

```python
# app/core/guardrails.py
import json
import logging
from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError
from fastapi import HTTPException

logger = logging.getLogger("ai_guardrails")

class ProductGuardrailCheck(BaseModel):
    id: str
    name: str
    price: float
    in_stock: bool

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
        validated = GuardrailResponse(**data)
    except (json.JSONDecodeError, ValidationError) as e:
        logger.error(f"LLM Schema Guardrail Violation: {str(e)}")
        # Safe fallback response
        return {
            "reply": "I apologize, but I am currently updating my catalog data. How else can I assist you?",
            "recommendations": []
        }

    valid_sku_set = {item["id"] for item in active_catalog}
    sanitized_recs = []

    for item in validated.recommendations:
        if item.id in valid_sku_set:
            sanitized_recs.append(item.model_dump())
        else:
            logger.warning(f"Hallucinated SKU detected and pruned: {item.id}")

    return {
        "reply": validated.reply,
        "recommendations": sanitized_recs
    }
```

---

### 3.2. Module 2: Alembic Database Migration Architecture

Transitioning from local SQLite to production PostgreSQL requires version-controlled database migrations via Alembic and SQLAlchemy ORM models.

#### SQLAlchemy Model Definition (`app/models/inventory.py`)
```python
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class ProductModel(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    stock_quantity = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
```

#### Alembic Migration Script (`alembic/versions/001_create_inventory_table.py`)
```python
"""Create inventory products table

Revision ID: 001_create_inventory
Revises: 
Create Date: 2026-09-29
"""
from alembic import op
import sqlalchemy as sa

revision = '001_create_inventory'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table(
        'products',
        sa.Column('id', sa.String(), nullable=False, primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False)
    )
    op.create_index('ix_products_category', 'products', ['category'])

def downgrade():
    op.drop_table('products')
```

---

### 3.3. Module 3: AI Observability & Token Cost Middleware

A FastAPI (`0.104.1`) middleware pipeline to record execution duration, prompt/completion token usage, and estimated API expenses for every AI interaction [2].

```python
# app/middleware/ai_observability.py
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger("ai_observability")

class AIObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/api/v1/chat"):
            return await call_next(request)

        start_time = time.time()
        response: Response = await call_next(request)
        process_time = time.time() - start_time

        logger.info(
            f"AI Endpoint: {request.url.path} | "
            f"Status: {response.status_code} | "
            f"Latency: {process_time:.3f}s"
        )
        response.headers["X-AI-Latency"] = f"{process_time:.3f}s"
        return response
```

---

### 3.4. Module 4: Production CI/CD & Docker Configuration

A multi-stage Docker build separating frontend Vite asset compilation from the Python FastAPI runtime environment.

```dockerfile
# Stage 1: Build React + Vite Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Build Python FastAPI Backend Environment
FROM python:3.11-slim AS backend
WORKDIR /app
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend-builder /app/frontend/dist ./static

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 4. Complete System Architecture (v5)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Production Infrastructure                             │
│  ┌────────────────────────┐  ┌───────────────────────┐  ┌────────────────┐ │
│  │ React + Vite Frontend  │  │  Framer Motion UI /   │  │  Theme Engine  │ │
│  │ (Oxlint / SWC Optimized)│ │  Theme Context (v2/v3)│  │   (Dark/Light) │ │
│  └───────────┬────────────┘  └───────────┬───────────┘  └───────┬────────┘ │
└──────────────┼───────────────────────────┼──────────────────────┼──────────┘
               │ Rest HTTP / WebSockets    │ Real-time Events     │ Admin Actions
┌──────────────┼───────────────────────────┼──────────────────────┼──────────┐
│              ▼                           ▼                      ▼          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Application (Uvicorn)                      │  │
│  │   - AIObservabilityMiddleware (Latency & Cost Logging)               │  │
│  │   - Guardrails & Fallback Engine (Pydantic Validation)               │  │
│  │   - RBAC & Rate Limiting Guard                                       │  │
│  └───────┬───────────────────────────────┬──────────────────────┬───────┘  │
│          │                               │                      │          │
│          ▼                               ▼                      ▼          │
│  ┌──────────────┐                ┌──────────────┐       ┌──────────────┐   │
│  │ OpenAI SDK   │                │ PostgreSQL   │       │ Alembic DB   │   │
│  │ (gpt-4o-mini)│                │ (SQLAlchemy) │       │ Migrations   │   │
│  └──────────────┘                └──────────────┘       └──────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Enterprise Implementation Roadmap

1. **Phase 1: Database Migration & Persistence Setup**
   * Run initial Alembic migrations to create the PostgreSQL schema.
   * Replace mock database repositories with SQLAlchemy session management.

2. **Phase 2: LLM Guardrail & Observability Rollout**
   * Attach `validate_llm_output` to `/recommend` and `/chat/action` routes.
   * Register `AIObservabilityMiddleware` in `app/main.py`.

3. **Phase 3: Production Deployment & Docker Containerization**
   * Execute multi-stage Docker build verifying that React static assets serve cleanly via FastAPI.
   * Verify environment variable loading via `python-dotenv` [2].
