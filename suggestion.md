# System Architectural Suggestions & Integration Guide

## 1. Executive Summary
This document provides a comprehensive architectural blueprint for expanding the existing **React + Vite** and **Python FastAPI** application. The proposed updates incorporate three integrated modules:
1. **AI Recommendation Chatbot System**
2. **Inventory Management System**
3. **Admin Panel Dashboard**

---

## 2. Technical Stack Alignment
The proposed modules build directly upon the existing project foundation:
* **Frontend:** React with Vite build tooling, featuring Hot Module Replacement (HMR) and Oxlint / TypeScript configuration [1].
* **Backend Framework:** FastAPI (`0.104.1`) hosted on Uvicorn (`0.24.0`) [2].
* **Data Validation & Schemas:** Pydantic (`2.5.0`) for strict input/output data validation [2].
* **AI Integration:** OpenAI API SDK (`1.3.0`) for conversational intelligence [2].
* **Configuration:** `python-dotenv` (`1.0.0`) for secure environment variable loading [2].

---

## 3. Core Subsystem Breakdown

### 3.1. AI Recommendation Chatbot System
* **Context Injection:** When a customer interacts with the chatbot, the FastAPI (`0.104.1`) backend retrieves current, active product inventory before sending prompts to `openai` (`1.3.0`) [2].
* **Structured Output:** OpenAI responses are parsed through Pydantic (`2.5.0`) schemas to ensure structured JSON output (product IDs, match explanation, price, stock status) [2].
* **Frontend Component:** An interactive chat UI component built into the React + Vite single-page application [1].

### 3.2. Inventory Management System
* **API Layer:** Dedicated FastAPI REST routes for managing catalog products, category tagging, stock levels, and SKU tracking [2].
* **Data Integrity:** Strict input validation using Pydantic schemas to prevent negative stock values or invalid product formats [2].
* **Real-time Stock Updates:** Deducts stock automatically upon order placement and flags low-stock items.

### 3.3. Admin Panel Dashboard
* **Frontend Control Center:** Dedicated administrative interface built within the React + Vite frontend [1].
* **Catalog Management:** Interactive tables to create, update, or remove inventory items and adjust stock levels.
* **AI & Sales Analytics:** Visual dashboard displaying chatbot query trends, popular recommendations, and sales conversion rates.

---

## 4. Cross-System Data Flow & Integration Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                        React + Vite Frontend                           │
│  ┌────────────────────────┐                ┌────────────────────────┐  │
│  │   Storefront Chatbot   │                │      Admin Panel       │  │
│  └───────────┬────────────┘                └───────────┬────────────┘  │
└──────────────┼─────────────────────────────────────────┼───────────────┘
               │ HTTP Requests                           │ HTTP Requests
┌──────────────┼─────────────────────────────────────────┼───────────────┐
│              ▼                                         ▼               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   FastAPI Backend (Uvicorn)                      │  │
│  └───────┬────────────────────────┬──────────────────────────┬──────┘  │
│          │                        │                          │         │
│          ▼                        ▼                          ▼         │
│  ┌──────────────┐         ┌──────────────┐           ┌──────────────┐  │
│  │ OpenAI Engine│         │ Inventory DB │           │ Analytics Log│  │
│  └──────────────┘         └──────────────┘           └──────────────┘  │
│                                Python Backend                          │
└────────────────────────────────────────────────────────────────────────┘
```

1. **AI Chatbot <---> Inventory Management**
   * Real-time stock querying prior to recommendation generation ensures out-of-stock items are excluded.
   * Purchasing an item recommended by the chatbot automatically triggers inventory reduction in the backend.

2. **Admin Panel <---> Inventory Management**
   * Administrative CRUD operations communicate with FastAPI backend endpoints, updating stock and catalog definitions.

3. **Admin Panel <---> AI Chatbot**
   * Interaction logs from chatbot sessions are aggregated by FastAPI and exposed to the Admin Panel for AI conversion analysis.

---

## 5. Implementation Roadmap

1. **Phase 1: Inventory API & Data Models**
   * Set up FastAPI routes and Pydantic schemas for product inventory CRUD operations.
   * Build the Admin Panel inventory management UI in React + Vite.

2. **Phase 2: AI Recommendation Service**
   * Implement OpenAI integration using `openai==1.3.0` with system prompts enriched by inventory context.
   * Expose a `/api/v1/chat/recommend` endpoint in FastAPI.

3. **Phase 3: Chatbot UI & Analytics Integration**
   * Build the floating storefront chatbot widget in React.
   * Add AI query logging and analytics widgets to the Admin Panel dashboard.

---

## 6. R&D Prompt Templates

### Developer / Contributor Prompt (Feature Implementation)
```text
Role: Full-Stack Software Engineer
Task: Implement the Inventory Management and AI Recommendation Chatbot modules.
Stack: React + Vite (Frontend), FastAPI + Uvicorn + Pydantic + OpenAI SDK (Backend).
Constraints: Ensure type safety in React with TypeScript/Oxlint, validate all FastAPI payloads with Pydantic, and maintain out-of-stock filtering in chatbot prompts.
```

### Architect / Analyst Prompt (Technical Audit)
```text
Role: Senior Software Architect
Task: Audit the proposed integration between FastAPI, Inventory Database, and OpenAI Chatbot API.
Deliverable: Provide a SWOT analysis, data synchronization strategy, and security review for API credentials managed via python-dotenv.
```
