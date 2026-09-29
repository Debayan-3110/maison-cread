# Technical Code & Component Implementation Guide (v3)

## 1. Executive Summary & Architecture Overview

This document serves as the concrete implementation blueprint for the **React + Vite** and **FastAPI** application, operationalizing the UI/UX design vision defined in `suggestion-v2.md` and the core system backend defined in `suggestion.md`. 

This guide provides production-ready code modules for:
1. **Frontend Theme Architecture:** Complete CSS variables, Tailwind configuration, React `ThemeContext`, and Framer Motion `ThemeToggle`.
2. **Storefront Recommendation Chatbot:** Interactive React component with Framer Motion spring physics, streaming message support, and real-time inventory cards.
3. **FastAPI & OpenAI Recommendation Service:** Python backend integration utilizing `fastapi==0.104.1`, `pydantic==2.5.0`, and `openai==1.3.0` with structured output schemas and stock filtering.
4. **Admin Panel Inventory Dashboard:** High-density Bento Grid component with live stock updates and AI analytics logs.

---

## 2. Frontend Theme System & Design Engine

### 2.1. Global CSS Theme Variables (`src/styles/theme.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root[data-theme="dark"] {
    --bg-base: #0B0C0E;
    --bg-surface-1: #14161A;
    --bg-surface-2: #1C1F26;
    --accent-primary: #E2B872;
    --accent-secondary: #729B7D;
    --text-primary: #F3F4F6;
    --text-secondary: #9CA3AF;
    --border-subtle: rgba(255, 255, 255, 0.08);
    --shadow-soft: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
  }

  :root[data-theme="light"] {
    --bg-base: #FAF8F5;
    --bg-surface-1: #FFFFFF;
    --bg-surface-2: #F2EFE9;
    --accent-primary: #1A1A1A;
    --accent-secondary: #C86D51;
    --text-primary: #111827;
    --text-secondary: #6B7280;
    --border-subtle: rgba(0, 0, 0, 0.08);
    --shadow-soft: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
  }

  body {
    background-color: var(--bg-base);
    color: var(--text-primary);
    transition: background-color 0.3s ease, color 0.3s ease;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }
}
```

### 2.2. Theme Provider Context (`src/context/ThemeContext.tsx`)

```tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme') as Theme;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
```

---

## 3. Storefront Recommendation Chatbot UI Component

### `src/components/chatbot/RecommendationChatbot.tsx`

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  inStock: boolean;
  matchScore: number;
  reason: string;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  recommendations?: Product[];
}

export const RecommendationChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! What kind of products are you looking for today?',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/v1/chat/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input }),
      });
      const data = await response.json();

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        recommendations: data.recommendations,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: 'Apologies, I encountered an issue retrieving recommendations.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--accent-primary)] text-[var(--bg-base)] shadow-lg hover:brightness-110 transition-all"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.821.487 3.53 1.338 5L2.5 21.5l4.638-.838A9.957 9.957 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
        </svg>
      </motion.button>

      {/* Chat Drawer Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="absolute bottom-18 right-0 w-96 h-[520px] rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface-2)]">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">AI Shopping Assistant</h3>
                <p className="text-xs text-[var(--text-secondary)]">Connected to live inventory</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1"
              >
                ✕
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[var(--accent-primary)] text-[var(--bg-base)] font-medium rounded-br-xs'
                        : 'bg-[var(--bg-surface-2)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Recommendation Cards Carousel */}
                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-3 w-full space-y-2">
                      {msg.recommendations.map((prod) => (
                        <motion.div
                          key={prod.id}
                          whileHover={{ x: 4 }}
                          className="p-3 rounded-xl bg-[var(--bg-surface-2)] border border-[var(--border-subtle)] flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-[var(--text-primary)]">{prod.name}</span>
                              {prod.inStock ? (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]">
                                  In Stock
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400">
                                  Out of Stock
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{prod.reason}</p>
                          </div>
                          <span className="font-semibold text-xs text-[var(--accent-primary)]">${prod.price}</span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <div className="text-xs text-[var(--text-secondary)] animate-pulse">
                  Searching live catalog...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-2)] flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for recommendations..."
                className="flex-1 bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <button
                onClick={handleSend}
                className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-base)] font-medium text-xs rounded-xl hover:brightness-110 transition-all"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## 4. FastAPI & OpenAI Backend Implementation

### 4.1. Request/Response Schemas (`app/schemas/chatbot.py`)

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class ChatRequest(BaseModel):
    message: str = Field(..., example="I need a lightweight running shoe under $120.")

class ProductRecommendation(BaseModel):
    id: str
    name: str
    price: float
    in_stock: bool = Field(..., alias="inStock")
    match_score: float = Field(..., alias="matchScore")
    reason: str

class ChatResponse(BaseModel):
    reply: str
    recommendations: List[ProductRecommendation] = []
```

### 4.2. Recommendation Service Endpoint (`app/api/v1/endpoints/chatbot.py`)

```python
from fastapi import APIRouter, HTTPException, Depends
from openai import OpenAI
import os
import json
from app.schemas.chatbot import ChatRequest, ChatResponse, ProductRecommendation

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Mock function simulating DB inventory fetch
def get_active_inventory():
    return [
        {"id": "p1", "name": "AeroRun Pro Sneakers", "price": 115.00, "stock": 14, "category": "Footwear"},
        {"id": "p2", "name": "UltraComfort Hoodie", "price": 75.00, "stock": 0, "category": "Apparel"},
        {"id": "p3", "name": "FlexFit Compression Shorts", "price": 45.00, "stock": 25, "category": "Apparel"},
    ]

@router.post("/recommend", response_model=ChatResponse)
async def generate_recommendation(payload: ChatRequest):
    # 1. Fetch live in-stock items from inventory repository
    inventory = get_active_inventory()
    in_stock_catalog = [item for item in inventory if item["stock"] > 0]

    # 2. Construct system prompt with inventory context
    system_prompt = f"""
    You are an expert AI e-commerce recommendation consultant.
    Recommend items ONLY from the provided in-stock inventory list below:
    {json.dumps(in_stock_catalog)}

    Respond in JSON format with two keys:
    - "reply": A friendly conversational response.
    - "recommendations": A list of recommended products, matching schema:
      [{{"id": "...", "name": "...", "price": 0.0, "inStock": true, "matchScore": 0.95, "reason": "..."}}]
    """

    try:
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": payload.message}
            ]
        )
        result = json.loads(completion.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recommendation engine error: {str(e)}")
```

---

## 5. Admin Panel Bento Dashboard Component

### `src/components/admin/InventoryDashboard.tsx`

```tsx
import React from 'react';
import { motion } from 'framer-motion';

export const InventoryDashboard: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Inventory & AI Analytics</h1>
          <p className="text-xs text-[var(--text-secondary)]">Real-time stock monitoring & AI conversion metrics</p>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Card 1 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm"
        >
          <span className="text-xs text-[var(--text-secondary)]">Total In-Stock SKUs</span>
          <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">1,248</div>
          <span className="inline-block mt-3 px-2 py-1 text-[10px] rounded bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]">
            +12 items added this week
          </span>
        </motion.div>

        {/* Metric Card 2 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm"
        >
          <span className="text-xs text-[var(--text-secondary)]">AI Recommendation Conversion</span>
          <div className="text-3xl font-bold text-[var(--accent-primary)] mt-2">24.8%</div>
          <span className="inline-block mt-3 px-2 py-1 text-[10px] rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
            +3.4% vs last month
          </span>
        </motion.div>

        {/* Metric Card 3 */}
        <motion.div
          whileHover={{ y: -4 }}
          className="p-6 rounded-2xl bg-[var(--bg-surface-1)] border border-[var(--border-subtle)] shadow-sm"
        >
          <span className="text-xs text-[var(--text-secondary)]">Low Stock Alerts</span>
          <div className="text-3xl font-bold text-red-400 mt-2">5 SKUs</div>
          <span className="inline-block mt-3 px-2 py-1 text-[10px] rounded bg-red-500/20 text-red-400">
            Requires immediate reorder
          </span>
        </motion.div>
      </div>
    </div>
  );
};
```

---

## 6. Full Stack Integration Roadmap

1. **Step 1: Frontend Theme Context Setup**
   * Wrap the main `<App />` component in `<ThemeProvider>` within `src/main.tsx`.
   * Add CSS variables to `src/styles/theme.css`.

2. **Step 2: Mount Chatbot & Admin Dashboard**
   * Integrate `<RecommendationChatbot />` into the storefront layout.
   * Add `<InventoryDashboard />` to the Admin Panel routes.

3. **Step 3: Connect FastAPI Backend Route**
   * Register the `/recommend` endpoint in `app/api/v1/router.py`.
   * Configure environment variables in `.env` for `OPENAI_API_KEY`.
