# Product Requirements Document — ShopCread Commerce OS

**"From Sign-In to Delivery, and back again."**

A Shopify + Flipkart parity commerce platform for premium, low-volume, high-value catalog retail — built on the open-source stack already present in this repository plus battle-tested OSS infrastructure.

| Field | Value |
|---|---|
| **Document** | `prd.md` |
| **Product** | ShopCread Commerce OS (Storefront + Seller OS + Ops Console) |
| **Version** | 1.0 (baseline) |
| **Status** | Draft for review |
| **Date** | 30 September 2026 |
| **Owner** | Product / Architecture (repo owner) |
| **Reviewers** | Engineering, Merchandising, Fulfillment Ops, Finance, Security & Compliance |
| **Review cadence** | Bi-weekly until Phase 2 exit, then monthly |
| **Scope** | Customer app (Web/PWA), Seller portal, Admin/Ops console, Platform services |
| **Reference platforms** | Shopify (Checkout, Shop Pay, Markets, Flow, Sidekick, Fulfillment Network) and Flipkart (Plus, F-Assured, OMNI Cart, Transact, Ekart-style logistics, Open Box Delivery) |
| **Source of truth for "as-is"** | Actual code in this repo (`backend/`, `frontend/`, `suggestion*.md`) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision & Positioning](#2-product-vision--positioning)
3. [The Real Problem We Must Solve](#3-the-real-problem-we-must-solve)
4. [Current State Audit (As-Is)](#4-current-state-audit-as-is)
5. [Personas, Roles & Permissions](#5-personas-roles--permissions)
6. [Goals, Non-Goals & Success Metrics](#6-goals-non-goals--success-metrics)
7. [The Sign-In → Delivery Journey Map + Parity Matrix](#7-the-sign-in--delivery-journey-map--parity-matrix)
8. [Functional Requirements (Epics E1–E16)](#8-functional-requirements-epics-e1e16)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Data Model](#10-data-model)
11. [API Surface Index](#11-api-surface-index)
12. [Open-Source Technology Stack Map](#12-open-source-technology-stack-map)
13. [System Architecture](#13-system-architecture)
14. [Rollout Roadmap & Milestones](#14-rollout-roadmap--milestones)
15. [Risks, Assumptions, Dependencies](#15-risks-assumptions-dependencies)
16. [Release Checklist & Exit Criteria](#16-release-checklist--exit-criteria)
17. [Appendix](#17-appendix)

---

## 1. Executive Summary

ShopCread today is a **working but shallow** premium storefront: a React 19 + Vite + Tailwind 4 SPA talking to a FastAPI backend, with 13 seeded premium SKUs, JWT + TOTP 2FA auth, a persistent cart, a 3-step checkout, a simulated courier timeline, an AI recommendation chatbot, an AI product-ingestion screen, and an admin analytics dashboard.

It is a **good prototype** and a **bad shop**. It cannot currently answer the three questions every premium buyer asks, and it cannot protect the merchant from the three ways premium retail loses money:

- **"Will it actually come, and when?"** — delivery dates are hardcoded to `created_at + 3 days`; there is no pincode serviceability check and no shipping-fee logic beyond a flat ₹99 under ₹1,999.
- **"Is this genuine?"** — no serial/IMEI capture, no authenticity proof, no warranty registry. Every product is unverifiable.
- **"Can I afford it / return it?"** — no EMI, no COD, no bank offers, **no returns flow at all**.

On the merchant side: **placing an order does not decrement stock** (`OrderService.place_order` validates items but never calls `ProductRepository.update_stock`), so a 7-unit Lounge Armchair and a 9-unit Diamond Pendant can be oversold indefinitely. There is no invoice, no GST compliance, no reverse logistics, and the AI chatbot's recommendations are not grounded in a vector index.

**This PRD** defines the full "sign-in to delivery and back" platform: 16 epics, ~150 numbered functional requirements, a concrete data model, an API index, an explicit open-source component map, and a 6-phase rollout. The thesis is:

> **Be trust-first and inventory-truth-first.** Premium, low-velocity, high-AOV commerce is won on certainty — of availability, of authenticity, of price, of arrival time, and of return. Everything else (speed of UI, breadth of catalog) is secondary.

### 1.1 What "done" looks like (one paragraph)

A shopper signs in with an email OTP or passkey, sees pincode-accurate delivery promises and EMI from ₹X/month on the product page, adds to cart, sees all promotions and loyalty credit applied **in the cart, before checkout**, pays via UPI / card / No-Cost-EMI / COD through a tokenized payment orchestrator that holds an inventory soft-reservation for their item, receives a GST-compliant invoice, watches a real tracking timeline driven by WMS scan events (packed → shipped → out for delivery → delivered with OTP), accepts an **Open Box Delivery**, keeps a warranty registration tied to the device serial, and — if unhappy — initiates a pickup-based return from the app with a refund that lands on a defined SLA.

---

## 2. Product Vision & Positioning

### 2.1 Vision statement

> To make buying an expensive thing online feel as safe, certain and simple as buying a cheap thing — and to make selling one profitable.

### 2.2 Positioning against reference platforms

| Dimension | Shopify | Flipkart | **ShopCread (target)** |
|---|---|---|---|
| Core strength | Merchant tooling + conversion-optimized checkout | Marketplace scale + supply chain + affordability | **Certainty layer for premium/low-volume goods** |
| Catalog model | Long-tail, high SKU count, thin margins | Massive, price-led | **13 → low hundreds of high-AOV SKUs, margin-led** |
| Payment approach | Shop Pay, wallets, installments via providers | COD-first, No-Cost EMI, Pay Later, UPI | **Hyperswitch-orchestrated: UPI, cards, No-Cost EMI, COD with pincode rules** |
| Trust proof | Reviews, verified buyers | F-Assured, Flipkart Advantage, Open Box Delivery | **Serialized authenticity + Open Box Delivery + warranty registry** |
| Delivery | Shopify Shipping + Fulfillment Network | Ekart, hyperlocal, same-day | **Pincode SLA engine + 3PL aggregation + white-glove for bulky** |
| Loyalty | Shop Cash, Shop App | Flipkart Plus / SuperCoins | **ShopCread Plus with coins + scarce-drop early access** |
| AI | Sidekick (merchant ops) | Recommendations + search ranking | **Grounded storefront concierge + merchant-ops copilot** |
| Open source | Liquid, Hydrogen, Oxygen | Flipkart Commerce Cloud (closed) | **OSS-first: Hyperswitch, Karrio, Keycloak, Meilisearch, Chatwoot, ERPNext, PostHog, pgvector** |

### 2.3 Product pillars

1. **Certainty** — real inventory, real ETAs, real prices, real refunds.
2. **Trust** — verifiable authenticity, transparent returns, honest AI.
3. **Affordability** — EMI, bank offers, coins, wallet — visible from the product card.
4. **Operational truth** — every customer-facing promise is backed by a system event, never a template string.
5. **Open by default** — every capability is delivered by a permissively-licensed OSS component where one exists.

---

## 3. The Real Problem We Must Solve

### 3.1 The framing

ShopCread's catalog is not a marketplace catalog. It is a **premium, low-velocity, high-ticket catalog**, and its economics are the opposite of Flipkart's:

| Metric (computed from the seeded catalog) | Value |
|---|---|
| SKUs | **13** |
| Total units in stock | **350** |
| Total catalog value | **≈ $216,451 (≈ ₹1.79 Cr @ ₹83/USD)** |
| Average unit value | **≈ ₹51,330** |
| Highest-value SKU | Aura Ultra Slim Book 16" — $2,999.99 ≈ **₹2.49 L** |
| Lowest stock SKU | Mid-Century Modern Lounge Armchair — **7 units** |
| Second lowest | Luxe Diamond Halo Pendant Necklace — **9 units** |
| High-value + fragile / bulky | Ceramic Sculptural Vase (fragile), Lounge Armchair (bulky), Galaxy Z Fold 5G (₹2.07 L) |

**The real-time problem statement:**

> A store carrying ~₹1.8 crore of inventory across 350 high-value units cannot afford **one** oversell, **one** damaged-in-transit luxury item, **one** disputed authenticity claim, or **one** unexplained delivery delay — yet the current system fabricates its delivery dates, never decrements stock on order placement, has no pincode check, no invoice, no serial capture and no returns process. Buyers of ₹50,000+ goods abandon because the app does not answer *"is it in stock, is it genuine, can I pay monthly, when exactly will it arrive, and what if I don't like it?"* — the five questions that decide premium conversion.

### 3.2 Why this is genuinely real-time (not theoretical)

| Real problem | Mechanism in the current system | Business impact |
|---|---|---|
| **Oversell on scarce SKUs** | `OrderService.place_order()` validates items and writes an order but never decrements `product.stock`. `InventoryService.update_product_stock()` is `async def` but is invoked **without `await`** in `products.py`, so the admin stock update returns a coroutine and never persists. | Selling a 7-unit armchair 40 times; refund penalties, NPS collapse |
| **Unknowable delivery dates** | `TrackingService.generate_timeline()` synthesises `start_date + 1d/2d/3d`; `Order.estimated_delivery` is a formatted string; no pincode, weight, zone or 3PL data is consulted — and the service is not wired to any route anyway. | "Where is my ₹2.5 L laptop?" support load |
| **No authenticity proof in counterfeit-prone categories** | No serial/IMEI/batch columns on `products` or `order_items`; no warranty entity. Watches, jewellery, fragrance and sunglasses — four of the most-counterfeited categories — are all in the catalog. | Return disputes, chargebacks, brand dilution |
| **Price-shock abandonment on high AOV** | No EMI, no bank offers, no COD, no wallet. `discountPercentage` is stored but **never applied** to price math (`calculateCartTotals` uses raw `price`), so promo badges are cosmetic. | ~85–90% abandonment risk on ₹1 L+ items |
| **Freight economics are wrong** | Flat `DELIVERY_FEE = 99` with `FREE_DELIVERY_THRESHOLD = 1999`. A bulky armchair and a 90 g serum bottle cost the same to ship. No insurance, no white-glove, no open-box verification. | Margin erosion + damage write-offs |
| **Zero reverse logistics** | No returns table, no RMA, no pickup scheduling, no refund state machine. "Returns" exist only as static marketing copy. | Consumer-law exposure, disputes |
| **AI recommendations not grounded** | `recommendation_service.py` stuffs up to 100 products into a prompt; `chat.py` calls `db.query(RecommendationService.Product)` — an attribute that does not exist on the class — and uses `json` without importing it. | Hallucinated SKUs, wrong stock claims |
| **Unreproducible, duplicated backend** | `backend/main.py` exists only as bytecode (`main.pyc`); the live `/api/*` contract is defined by compiled bytecode while `backend/app/**` implements a *different* `/api/v1/*` contract. Three SQLite paths disagree (`./backend/ecommerce.db`, `ecommerce.db`, and `backend/app/repositories/ecommerce.db` — the last does not exist). | Cannot safely change the API; cannot onboard engineers |

### 3.3 The fix, stated as an engineering thesis

1. **Inventory truth first:** every sellable unit gets a ledger entry; every state change (reserve → commit → release) is atomic and event-sourced. No code path may show stock the ledger does not have.
2. **Promises are computed, never templated:** delivery date, shipping fee, COD eligibility and EMI are all *computed* from pincode + weight + zone + 3PL SLA + margin guardrails.
3. **Trust is physical and verifiable:** serial capture at inbound (GRN) and outbound (pick), authenticity certificate, warranty registry, Open-Box-Delivery OTP.
4. **Money must be visible early:** EMI from ₹X/month, bank offers, coins and coupon savings are shown **on the product card and in the cart**, mirroring Flipkart Commerce Cloud's *"Evaluate Before Commit"* principle.
5. **Everything above is delivered with OSS:** see §12.

### 3.4 Target outcomes (measurable)

| KPI | Today (est.) | Phase 2 | Phase 4 | Phase 6 |
|---|---|---|---|---|
| Order-induced oversell incidents / month | unbounded | **0** | 0 | 0 |
| Delivery-promise accuracy | n/a (fabricated) | ±1 day on 80% | ≥95% on-time | ≥98% |
| Cart abandonment (₹50k+ carts) | est. 85–90% | ≤70% | ≤55% | ≤45% |
| Return → refund TAT | n/a | ≤7 days | ≤4 days | ≤48 h |
| Serialized (authenticity-tracked) units shipped | 0% | 100% | 100% | 100% |
| AI recommendation precision @5 (grounded) | unknown | ≥80% | ≥90% | ≥93% |
| Paid-conversion rate (AI-assisted, instrumented) | not measured | instrumented | ≥12% | ≥18% |

---

## 4. Current State Audit (As-Is)

### 4.1 What genuinely works today

| Capability | Where | Notes |
|---|---|---|
| Email + password auth with bcrypt(12) | `backend/app/core/security.py`, legacy `/api/auth/*` | Strong password policy; lockout after 5 failures / 15 min |
| JWT access tokens (15 min) + refresh rotation | `core/security.py` | Reuse detection revokes all sessions |
| TOTP 2FA + QR provisioning + backup codes | `core/security.py` (`pyotp`, `qrcode`) | `/api/auth/2fa/setup|enable|disable` |
| Email verification & password reset with mock mailbox | `mock_emails` table + `/api/auth/dev-emails` | `DevMailboxModal.tsx` renders them |
| Security headers, CSP, HSTS, CSRF double-submit, rate limiting | `core/middleware.py` | Limits: chat 10/min, ingest 5/min |
| Catalog read APIs (list, detail, filter, sort, paginate) | legacy `/api/products` | Filtering/sorting duplicated in `ShopContext` |
| Persistent cart + wishlist (localStorage) | `ShopContext.tsx` | Survives reload |
| 3-step checkout + confetti + order confirmation | `CheckoutModal.tsx` | Shipping → Payment → Success |
| GST + free-shipping math (₹83/USD, 18% GST, ₹1,999 threshold) | `utils/commerce.ts` | Deterministic |
| Order-history modal with timeline UI | `OrderHistoryModal.tsx` | Timeline synthesised client-side |
| AI recommendation chat widget | `ChatbotWidget.tsx` → `/api/chat/recommend` | OpenAI `gpt-4o-mini` + tool-calling orchestrator |
| AI product ingestion (unstructured → catalog) | `/api/ingest/inventory/auto-ingest` | Pydantic-validated schema |
| Omnichannel webhook (WhatsApp / IG / email) | `/api/v1/omnichannel/webhook/channel-message` | Background task dispatch |
| Admin inventory + AI analytics bento dashboard | `pages/admin/*` | Chat logs, conversions, conversion rate |
| Real-time stock broadcast (WebSocket) | `core/websocket_manager.py`, `useInventorySocket.ts` | Present; wired to `InventoryService` |
| Dynamic pricing, vector search, personalization, forecast, event-stream services | `backend/app/services/*` | Scaffolded; **not yet wired to routers** |
| Docker + Alembic scaffolding | `docker/`, `backend/alembic/` | `alembic/versions/` is empty |

### 4.2 Defects that block the premium use case (must-fix)

| # | Defect | Location | Severity |
|---|---|---|---|
| D1 | Order placement never decrements stock | `services/order_service.py` | **Blocker** |
| D2 | `await` missing on async stock update → endpoint returns a coroutine | `api/v1/endpoints/products.py:37` | **Blocker** |
| D3 | Delivery timeline fabricated and not wired to any route | `services/tracking_service.py` | **Blocker** |
| D4 | `db.query(RecommendationService.Product)` — invalid attribute; `json` not imported | `api/v1/endpoints/chat.py:35-42` | High |
| D5 | `discountPercentage` never applied to price math | `utils/commerce.ts` | High |
| D6 | Sort-by-discount comparator is a no-op (`b.x - b.x`) | `context/ShopContext.tsx:520` | Medium |
| D7 | Flat ₹99 shipping for all weights and zones | `utils/commerce.ts` | High |
| D8 | Low-stock alert threshold (10) mis-tuned for this catalog | `inventory_service.py` | Medium |
| D9 | Three conflicting DB paths; `repositories/base.py` path does not exist | `repositories/base.py:9`, `core/config.py:18` | **Blocker** |
| D10 | Legacy API exists only as `.pyc`; contract diverges from `app/api/v1` | `backend/main.pyc` | **Blocker** |
| D11 | Order `date` hardcoded to `"2026-09-29"` | `services/order_service.py:41` | Medium |
| D12 | `orders.user_id` comes from a query param, not the auth principal | `api/v1/endpoints/orders.py:16` | **Blocker** |
| D13 | Duplicate root `main.py` chatbot app (dead code) | `main.py` | Low |
| D14 | `auth.py` register/login take query params, not JSON → breaks the SPA contract | `api/v1/endpoints/auth.py:21,26` | High |

### 4.3 Gap analysis vs. Shopify / Flipkart (the build list)

| Journey stage | Shopify parity | Flipkart parity | ShopCread today | Gap to close |
|---|---|---|---|---|
| Sign-in | Email / passkey / Shop | OTP, Plus, SSO | Email+pw, 2FA, mocked email | OTP, passkey, social, guest |
| Discovery | Collections, Search & Discovery | Facets, ranking, personalisation | Category chips, price slider, sort | Facets, collections, ranking |
| PDP | Metafields, variants, media, reviews | Reviews, Q&A, bank offers, EMI, pincode | Basic modal + thumbnails | Variants, reviews, Q&A, EMI, pincode, AR |
| Cart | Multi-currency, discounts, upsell | OMNI cart, coupons, loyalty in cart | 3 hardcoded coupons | Promotions engine, loyalty, offers |
| Checkout | Shopify Checkout, Shop Pay | Transact, soft reservation | 3 steps, simulated payment | Real PSP, reservations, idempotency |
| Payments | Cards, wallets, installments | UPI, COD, No-Cost EMI, Pay Later | Card form + UPI field only | Hyperswitch orchestration |
| Fulfilment | Fulfillment Network, WMS | Ekart hub-and-spoke | None | WMS, picking, packing, GRN, invoices |
| Delivery | Tracking + notifications | Live tracking, Open Box Delivery, slots | Fabricated timeline | SLA engine, 3PL, OBD, OTP |
| Returns | Returns Management | Pickup-based reverse + exchange | **None** | Full RMA + reverse logistics |
| Support | Inbox, Shopify Chat | Chat + call + AI | Chatbot only | Chatwoot, ticketing, SLAs |
| Loyalty | Shop Cash / Shop App | Plus + SuperCoins | None | ShopCread Plus + coins |
| Seller OS | Multi-vendor, payouts, Flow | Seller Hub, commissions, SLA | None | Marketplace + payouts |
| Analytics | Reports, Analytics, Cohorts | Growth analytics | Chat-log counters | Event pipeline, funnels, cohorts, A/B |
| Compliance | Taxes, GDPR | GST invoice, e-invoice | None | GST/e-invoice, DPDP, PCI |

---

## 5. Personas, Roles & Permissions

### 5.1 Personas

| ID | Persona | Primary job-to-be-done | Success feels like |
|---|---|---|---|
| P1 | **Premium Shopper ("Aarav, 34")** | Buy a ₹1–2.5 L device or gift with certainty | "It arrived when it said, sealed, genuine, and I could pay monthly." |
| P2 | **Gift Buyer ("Meera, 41")** | Buy jewellery/watches/fragrance for an occasion, on a deadline | Gift wrap, scheduled delivery date, hidden price slip |
| P3 | **Frugal Researcher ("Rohit, 26")** | Compare with AI help; wait for a drop | AI explains trade-offs; alert when the 9-unit pendant restocks |
| P4 | **Repeat Loyalist ("Nisha, 38")** | Earn and burn coins; get early access | Early access to scarce drops; coins applied in cart |
| P5 | **Seller / Vendor** | List, price, fulfil, get paid on SLA | Listing live in <10 min; predictable payouts |
| P6 | **Category Manager** | Curate collections, run promos, protect margin | Guardrails block loss-making price changes |
| P7 | **Warehouse Ops** | Receive, pick, pack, dispatch with zero mis-ship | Barcode-driven, serial-captured, label-printed |
| P8 | **Support Agent** | Resolve order/return issues on first contact | One console, full order timeline, macros |
| P9 | **Delivery Partner** | Deliver, verify OTP, collect COD, handle OBD | App-driven route, no phone calls |
| P10 | **Finance / Compliance** | Reconcile payments, file GST, manage refunds | Daily auto-reconciliation, e-invoice export |
| P11 | **Store Admin (super-user)** | Configure catalog, rules, roles, integrations | Everything above without code changes |

### 5.2 RBAC matrix (role → scope)

| Scope | Guest | Customer | Delivery Partner | Support | Ops/Warehouse | Category Mgr | Seller | Finance | Admin |
|---|---|---|---|---|---|---|---|---|---|
| Browse catalog, search, cart | ✅ | ✅ | – | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Place order, manage address | ➖ guest checkout | ✅ | – | ✅ on behalf | – | – | – | – | ✅ |
| View own order tracking | ➖ token link | ✅ | assigned only | ✅ all | ✅ all | ✅ all | own SKUs | ✅ financial view | ✅ |
| Initiate return / refund | – | ✅ | pickup confirm | ✅ | ✅ | – | – | approve > ₹50k | ✅ |
| Manage catalog & pricing | – | – | – | – | receive only | ✅ | own SKUs | – | ✅ |
| Stock / GRN / pick / pack / dispatch | – | – | – | – | ✅ | ✅ | own SKUs | – | ✅ |
| Analytics dashboards | – | own spend | – | – | ops KPIs | merch KPIs | seller KPIs | finance KPIs | ✅ all |
| Manage users & roles | – | – | – | – | – | – | – | – | ✅ |
| Configure promotions & guardrails | – | – | – | – | – | ✅ within limits | request | approve | ✅ |
| Configure integrations / webhooks | – | – | – | – | – | – | – | – | ✅ |

The existing `UserRole` enum (`admin`, `manager`, `customer` in `models/user.py`) extends to: `admin`, `manager`, `customer`, `seller`, `warehouse_ops`, `support_agent`, `delivery_partner`, `finance`. Enforcement continues through the existing `require_role([...])` dependency in `core/security.py`, extended with attribute checks (e.g. a seller may only mutate own SKUs).

---

## 6. Goals, Non-Goals & Success Metrics

### 6.1 Goals (in priority order)

| # | Goal | Why first |
|---|---|---|
| G1 | **Zero oversell.** Atomic inventory ledger with reserve/commit/release | Protects ~₹1.8 Cr of inventory and the brand |
| G2 | **Computable delivery promise.** Pincode serviceability, zone SLA, weight-based freight | Directly drives conversion and support cost |
| G3 | **Trust pack.** Serial capture, authenticity certificate, Open-Box Delivery, warranty registry | Unlocks ₹50k+ categories |
| G4 | **Affordability at first glance.** EMI + bank offers + coins + coupons on card, PDP and cart | Attacks the #1 abandonment cause for this catalog |
| G5 | **Complete post-purchase loop.** Invoice → tracking → delivery → returns → refund | Turns a demo into a business |
| G6 | **Grounded AI.** Vector-grounded recommendations, honest stock/ETA claims, guardrailed output | Protects trust; removes hallucination risk |
| G7 | **Merchant control.** PIM, promotions, margin guardrails, RBAC, audit log | Scales the catalog beyond 13 SKUs |
| G8 | **Marketplace readiness.** Seller onboarding, commissions, payouts | Path to 10× catalog without holding stock |

### 6.2 Non-goals (explicitly out of scope for v1)

- Physical-retail POS / offline store billing (Shopify POS parity) — Phase 7+.
- Hyperlocal 10-minute delivery / dark stores.
- Full B2B wholesale tiers, RFQ and net-terms credit (Shopify B2B parity) — Phase 7+.
- Building our own payment gateway, card-network integration or bank underwriting.
- Native iOS/Android apps (PWA first; React Native later).
- Own-fleet logistics (3PL aggregation first; own fleet only if volume justifies).
- Multi-country selling and multi-currency settlement (Shopify Markets parity) — Phase 7+.

### 6.3 North Star & metric tree

**North Star Metric:** *Certainty-Weighted GMV (CW-GMV)* = Σ(order value × promise-kept factor), where promise-kept = 1 when the order is delivered inside the promised window **and** accepted at open-box inspection, else 0.

| Level | Metric | Definition | Phase 6 target |
|---|---|---|---|
| Acquisition | New verified accounts / week | Email-verified or passkey-created | +25% MoM |
| Acquisition | Sign-in success rate | Successful logins / attempts | ≥97% |
| Engagement | PDP → cart rate | Adds / PDP views | ≥18% |
| Engagement | AI-assisted session share | Sessions with ≥1 concierge turn | ≥30% |
| Monetisation | Paid conversion (AOV ≥ ₹50k) | Orders / checkouts started | ≥45% |
| Monetisation | EMI attach rate | EMI orders / EMI-eligible orders | ≥22% |
| Monetisation | COD attach rate | COD orders / eligible orders | 8–15% (capped) |
| Fulfilment | Inventory accuracy | Cycle-count variance | ≤0.5% |
| Fulfilment | On-time delivery (promise-kept) | Delivered within promise / shipped | ≥98% |
| Fulfilment | Perfect-order rate | No damage, no mis-ship, no NDR | ≥96% |
| Fulfilment | Cost-to-serve per order | Logistics + packaging + support / order | −20% vs. Phase 2 |
| Trust | OBD refusal rate | Refusals at open-box / OBD deliveries | ≤2% |
| Trust | Authenticity disputes per 1,000 orders | Warranty or fake-goods claims | ≤3 |
| Retention | 90-day repeat purchase | Customers with 2+ orders / 90 days | ≥15% |
| Retention | Plus membership penetration | Plus members / active customers | ≥25% |
| Returns | Return rate by category | Returned units / shipped units | Jewellery ≤6% |
| Returns | Refund TAT (P90) | Return picked up → refund credited | ≤48 h |
| Support | First-contact resolution | Tickets closed in one contact | ≥75% |
| Support | AI containment rate | Chats resolved without a human | ≥55% |
| Ops | Margin per order | Net revenue after freight/discount/fee | ≥18% |
| Reliability | API P95 latency | All `/api/*` reads | ≤300 ms |
| Reliability | Checkout availability | Successful checkout calls / attempts | ≥99.9% |

---

## 7. The Sign-In → Delivery Journey Map + Parity Matrix

### 7.1 End-to-end journey (every stage, every system)

| # | Stage | Shopper action | Systems engaged | Writes / state change | Events emitted | OSS component | FRs |
|---|---|---|---|---|---|---|---|
| 1 | **Land** | Opens storefront / PWA | CDN, `imgproxy`, React SPA | page_view | `page_viewed` | imgproxy, PostHog | E2.1 |
| 2 | **Sign in** | Email + OTP, password, passkey, or social | Identity service, session store | `users`, `sessions`, `otp_challenges` | `user_signed_in` | Keycloak / Ory Kratos | E1.1–E1.9 |
| 3 | **Discover** | Home rails, collections, search, facets | Search service, personalisation | `search_queries`, impression logs | `search_performed`, `item_impression` | Meilisearch, pgvector | E2.2–E2.8 |
| 4 | **Evaluate PDP** | Opens product, reads reviews/Q&A, checks EMI & pincode | Catalog, pricing, reviews, promise engine | impressions, `pincode_checks` | `item_viewed`, `pincode_checked` | Meilisearch, pgvector, Nominatim/OSRM | E2.9–E2.16, E4.1–E4.4 |
| 5 | **Ask AI** | "Which 2-in-1 under ₹2 L is worth it?" | Concierge (RAG + tools), guardrails | `chat_logs`, `chat_citations` | `concierge_turn` | Ollama/vLLM, pgvector, LangChain | E3.1–E3.9 |
| 6 | **Add to cart** | Adds item; sees all discounts, coins, EMI | Cart service, promotions, loyalty | `carts`, `cart_lines` | `cart_updated` | Custom promo engine | E4.5–E4.14 |
| 7 | **Checkout – address** | Picks/creates address; sees serviceability | Address book, promise engine | `addresses`, `serviceability_checks` | `address_selected` | Nominatim, Valhalla/OSRM | E5.1–E5.6 |
| 8 | **Checkout – reservation** | (implicit) starts payment | Inventory ledger | `stock_reservations` (soft, TTL) | `stock_reserved` | Custom ledger + Redis TTL | E5.7–E5.10 |
| 9 | **Pay** | UPI / card / No-Cost EMI / COD / net-banking / wallet | Payment orchestrator, PSP, 3DS | `payments`, `payment_attempts`, `emi_plans` | `payment_initiated`, `payment_succeeded` | **Hyperswitch** | E5.11–E5.22 |
| 10 | **Order confirm** | Sees order ID + promise | Order service, notifications | `orders`, `order_lines`, hard reservation | `order_placed` | Novu, Temporal | E5.23–E5.27 |
| 11 | **Invoice** | Downloads GST invoice | Billing / ERP | `invoices`, `invoice_lines`, IRN | `invoice_generated` | **ERPNext** | E6.1–E6.5 |
| 12 | **Allocation & pick** | (invisible) | OMS, WMS | `pick_lists`, `picks`, serial capture | `order_picked` | Custom WMS UI | E6.6–E6.14 |
| 13 | **Pack & label** | – | Packing, label service | `packages`, `shipment_labels`, `lpns` | `order_packed` | **Karrio** | E6.15–E6.20 |
| 14 | **Dispatch** | Gets tracking link | 3PL aggregator, TMS | `shipments`, `tracking_events` | `shipment_dispatched` | **Karrio** + 3PL webhooks | E7.1–E7.5 |
| 15 | **In transit** | Live tracking, ETA changes | Tracking, notifications | `tracking_events` | `tracking_updated` | Karrio, Novu | E7.6–E7.12 |
| 16 | **Out for delivery** | OTP / OBD verification | Field app, OTP service | `delivery_attempts`, `otp_verifications` | `out_for_delivery` | Custom field PWA | E7.13–E7.19 |
| 17 | **Delivered** | Open-box inspects & accepts | Proof-of-delivery, ledger | `proof_of_delivery`, stock commit | `order_delivered` | Custom + MinIO | E7.20–E7.25 |
| 18 | **Warranty** | Registers device serial | Warranty registry | `warranty_registrations` | `warranty_registered` | ERPNext / custom | E9.1–E9.5 |
| 19 | **Return** | Requests return/exchange in app | RMA, reverse logistics, refunds | `return_requests`, `reverse_shipments`, `refunds` | `return_requested` | Karrio, Temporal | E8.1–E8.16 |
| 20 | **Refund** | Receives refund to source / wallet | Payments, finance, ledger | `refunds`, `wallets`, GL entries | `refund_completed` | Hyperswitch, ERPNext | E8.17–E8.24 |
| 21 | **Loyalty** | Earns coins; redeems next time | Loyalty ledger | `coin_ledger`, `tier_history` | `coins_earned` | Custom ledger + Temporal | E10.1–E10.10 |
| 22 | **Support** | Chats/calls about anything | Chatwoot, ticketing, macros | `conversations`, `tickets` | `ticket_created` | **Chatwoot** | E11.1–E11.8 |
| 23 | **Post-purchase ops** | – | Analytics, experimentation | `funnel_events`, `experiments` | `experiment_exposed` | **PostHog**, Metabase | E14.1–E14.10 |

### 7.2 Parity checklist (the features we must have)

**Shopify-derived features adopted**

- [ ] Conversion-optimised checkout: guest + account, progressive single page, address autocomplete, inline validation — E5
- [ ] Shop Pay–style saved payment methods + 1-tap re-buy — E5.14
- [ ] Discount engine: percentage, fixed amount, BXGY, free shipping, first-order, tiered cart, **combinability rules** — E4.8
- [ ] Collections & merchandising rails (manual + smart/rule-based) — E2.4
- [ ] Metafields for category-specific specs (screen size, metal purity, lens type, volume) — E2.10
- [ ] Multi-currency display + FX rates (INR base) — E4.4
- [ ] Order editing before fulfilment + support-created draft orders — E6.4
- [ ] Flow-style workflow automation over commerce events — E13.9
- [ ] Sidekick-style merchant copilot ("why did sales dip last week?") — E13.10
- [ ] Merchandising/campaign page editor without deploys — E13.7

**Flipkart-derived features adopted**

- [ ] **Open Box Delivery** with OTP + refusal path — E7.18
- [ ] **No-Cost EMI**, bank offers and exchange offers visible **before** cart — E4.2, E5.16
- [ ] **COD with pincode + order-value rules** and COD-fee handling — E5.18
- [ ] **Plus / SuperCoins-style loyalty** with early access to scarce drops — E10
- [ ] **F-Assured-style trust badges**: Verified Genuine, 2-day replacement, seller rating — E2.14
- [ ] **OMNI cart**: delivery + store-pickup items in one cart, per-item fulfilment type — E4.11
- [ ] **Evaluate Before Commit**: promotions, loyalty and delivery promise surfaced in the cart — E4.6
- [ ] **Soft reservation on checkout entry, hard reservation on payment confirmation** — E5.7, E5.21
- [ ] **Order record created at payment initiation, not payment success** (full traceability) — E5.23
- [ ] **Resumable checkout** — state fetchable at any point without re-initialisation — E5.10
- [ ] **NDR workflow** with reattempt / reschedule / RTO — E7.21
- [ ] **Seller Hub**: onboarding, commissions, SLA scorecard, payouts — E12
- [ ] **GST invoice + e-invoice (IRN)**, HSN codes, e-way bill for consignments > ₹50,000 — E6.3

---

## 8. Functional Requirements (Epics E1–E16)

Priority key: **P0** = launch blocker, **P1** = needed within 90 days of launch, **P2** = later.

### E1. Identity, Access & Trust (Sign-in)

**Objective:** get the shopper authenticated in under 20 seconds on the first attempt, on any device, without ever making a ₹2.5 L purchase feel insecure.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E1.1 | Email + password sign-in retained, moved to JSON bodies (fixes D14) | P0 | `POST /api/v1/auth/login` accepts `{email, password, rememberMe}`; returns access + refresh pair |
| E1.2 | **Email/passwordless OTP sign-in** (6-digit, 5-min TTL, 3 attempts, 60 s resend cooldown) | P0 | Correct OTP → session issued; 3 wrong attempts → challenge invalidated |
| E1.3 | Passwordless + SMS/WhatsApp OTP delivery via Novu templates | P1 | OTP delivered on chosen channel; OTP never stored or logged in plaintext |
| E1.4 | **Passkeys / WebAuthn** (register + authenticate) with password fallback | P1 | Passkey registration + login succeed on Chrome/Safari/Firefox; credential stored server-side |
| E1.5 | TOTP 2FA (existing) + backup codes; mandatory for high-risk accounts | P1 | Setup returns QR + 10 codes; code verified within the drift tolerance window |
| E1.6 | **Guest checkout** with post-order account claim via emailed magic link | P0 | Guest completes checkout; link converts guest → registered without re-entering data |
| E1.7 | Session & device management ("Sign out of all devices", active-session list) | P1 | Revoking one session invalidates only that refresh token; UI lists device + last seen |
| E1.8 | Brute-force protection: IP + account lockout, backoff, audit log | P0 | 5 failures → 15-min lock; `login_attempts` rows written; admin can inspect |
| E1.9 | OIDC federation (Google, Apple) via Keycloak/Ory Kratos | P2 | OIDC login creates/links a local user; roles mapped from claims |
| E1.10 | **DPDP compliance**: granular consent capture, data export, delete-my-account self-service | P0 | User can export data (JSON) and request erasure with documented retention carve-outs |
| E1.11 | Profile & address book (≤10 addresses, default, labels, GPS-pinned) | P0 | Default address auto-selected at checkout; address validated against pincode |

**OSS:** Keycloak (Apache-2.0) or Ory Kratos (Apache-2.0); Novu (MIT) for OTP/notifications; `pyotp` + `qrcode` (already present); `pyjwt` (already present).
**Dependencies:** E15 (event bus for `user_signed_in`), E16 (secrets, key management).

---

### E2. Discovery & Merchandising (Land → Evaluate)

**Objective:** make a 13-SKU premium catalog discoverable and comparable — a shopper should be able to answer *"which of these two laptops should I buy?"* without leaving the app.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E2.1 | Home with merchandising rails: Hero, New arrivals, Editor's picks, **Low stock — few left**, Complete the look, Recently viewed | P0 | Rails admin-configurable; each renders ≤12 items with lazy images |
| E2.2 | **Instant search** (typo-tolerant, prefix, synonyms) over title, description, brand, category, tags | P0 | P95 ≤120 ms; "tiwtanium" matches "Titanium design" |
| E2.3 | **Faceted filtering**: category, brand, price (₹), rating, availability, discount %, colour/material, per-category spec facets | P0 | Facet counts update live; URL is shareable and restores full state |
| E2.4 | **Collections** (manual + smart/rule-based: "Under ₹1 L", "Gift-ready", "Fragile-care") | P1 | Rule-based collection recomputes membership within 60 s |
| E2.5 | Ranking & sorting: relevance, price ↑/↓, rating, discount %, newest, best-selling, personalised | P0 | Sort-by-discount defect (D6) fixed and covered by a unit test |
| E2.6 | Search suggestions (autocomplete), recent searches, "no results" recovery rail | P1 | 3 chars typed → ≤8 suggestions in ≤80 ms |
| E2.7 | **Personalisation**: "For you" rail and PDP recommendations from embeddings + behaviour | P1 | Cold start falls back to popularity; warm users show ≥30% CTR lift in A/B |
| E2.8 | Recently viewed / continue browsing, session- and account-scoped | P1 | Persists across devices when signed in |
| E2.9 | **PDP v2**: gallery with zoom + video, sticky buy-box, price breakdown (MRP, discount, GST-inclusive), delivery promise, EMI, offers, pincode check | P0 | Blocks are server-driven; sticky buy-box appears after 200 px scroll |
| E2.10 | **Metafields / specs** per category (chip, RAM, display; metal purity, carat, certification; lens type; volume; wood type, dimensions, weight) | P0 | Specs stored as key/value JSON with unit metadata; rendered in a spec table |
| E2.11 | **Variants** (colour/size/capacity) with per-variant SKU, stock, price, media | P1 | Variant switch swaps media + stock + price atomically |
| E2.12 | **Ratings & reviews**: verified-purchase badge, photo/video reviews, helpful votes, sort/filter, merchant replies | P0 | Only delivered-order customers may review; review hidden until moderated |
| E2.13 | **Q&A**: customer questions, merchant answers, AI-drafted answer requiring merchant approval | P1 | Question notifies merchant ≤5 min; 24 h SLA tracked |
| E2.14 | **Trust badges**: Verified Genuine, Sealed & Serialized, 7-day easy return, 2-day replacement, seller rating, warranty length | P0 | A badge renders **only** when backing data exists (never decorative — the D5 lesson) |
| E2.15 | **AR / visual try-on** for sunglasses, watches, jewellery | P2 | `<model-viewer>` loads on supported devices; graceful 360° fallback |
| E2.16 | Wishlist + **back-in-stock & price-drop alerts** | P1 | Alert fires ≤5 min after restock; one alert per user per SKU per event |
| E2.17 | Comparison view (≤4 products, spec-diff highlighting) | P2 | Best value per attribute is highlighted |
| E2.18 | SEO: structured data (`Product`, `Offer`, `AggregateRating`, `BreadcrumbList`), sitemaps, canonical URLs | P0 | Rich-result validator passes; sitemap lists every SKU |

**OSS:** Meilisearch (MIT) for instant search/facets; pgvector + `sentence-transformers` (Apache-2.0) for semantic ranking; imgproxy (Apache-2.0) for image transforms; MinIO (AGPL-3.0) for media; `<model-viewer>` (Apache-2.0) for AR.
**Dependencies:** E13.2 (PIM), E14 (impression events), E4 (pricing/EMI in the buy-box).

---

### E3. AI Shopping Concierge (Grounded, Honest, Useful)

**Objective:** replace a generic chatbot with a *product advisor* that only cites real SKUs, real stock and real prices — and can act (add to cart, compare, set alerts).

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E3.1 | **RAG grounding**: hybrid retrieve top-k SKUs (pgvector + Meilisearch) before generating | P0 | Every recommendation cites a `product_id` that exists in the catalog |
| E3.2 | **Hallucination guardrail**: post-generation validation of IDs, prices, stock against the live catalog | P0 | A response referencing an unknown ID is rejected and regenerated or replaced by fallback |
| E3.3 | **Tool-calling actions**: `add_to_cart`, `check_stock`, `compare_products`, `get_emi_plan`, `check_pincode`, `set_stock_alert`, `open_pdp` | P0 | Tool call produces a UI action in the widget and an audit-log row |
| E3.4 | **Budget-aware advisor**: "Set up a home office under ₹2 L" → bundle across laptop + accessory + furniture with running total | P1 | Bundle total computed from live prices with a single "Add all" action |
| E3.5 | **EMI negotiator**: given a monthly budget, return the plan (tenure × EMI) that fits, distinguishing No-Cost from interest-bearing | P1 | Plans sourced from the EMI/payments service, never invented |
| E3.6 | **Honest availability**: when stock ≤5, say so and offer a stock alert instead of overselling | P0 | A recommendation for the 7-unit armchair includes "only N left" |
| E3.7 | **Self-hosted LLM option** (Ollama / vLLM + Llama 3.x or Mistral) with OpenAI-compatible fallback | P1 | Same prompts/tools run on either provider; cost + latency tracked per provider |
| E3.8 | **Multilingual** responses (English, Hindi, locale-detected regional) | P1 | A Hindi query returns a Hindi reply with identical SKU grounding |
| E3.9 | Conversation memory + reset, persisted per user, with PII redaction before storage | P0 | Reset clears context; stored transcripts contain no card or OTP data |
| E3.10 | Concierge analytics: containment, deflection, assisted conversion, cost per conversation | P1 | Dashboard shows all four; AI-assisted orders attributable end-to-end |
| E3.11 | Omnichannel reuse: the same grounded engine serves WhatsApp/Instagram/email webhooks | P2 | Webhook replies cite real SKUs; channel length limits enforced |

**OSS:** Ollama (MIT) / vLLM (Apache-2.0) + Llama 3.x or Mistral; LangChain or LlamaIndex (MIT); pgvector (PostgreSQL license); PostHog (MIT) for LLM analytics.
**Dependencies:** E2.9 (offers data), E5.16 (EMI plans), E6 (stock ledger), E16.5 (PII redaction).

---

### E4. Cart, Pricing & Promotions (Evaluate Before Commit)

**Objective:** show the *true, final* price — including EMI, offers, coins and delivery — **in the cart**, so checkout never surprises anyone.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E4.1 | Server-authoritative **price engine**: MRP, selling price, **applied** discount %, GST breakdown (CGST/SGST/IGST, HSN) | P0 | Client never computes the final price; `discountPercentage` genuinely reduces the selling price (fixes D5) |
| E4.2 | **Offers block** on card, PDP and cart: bank offers, No-Cost EMI, exchange bonus, coupon eligibility | P0 | Each offer shows its computed saving in ₹ for *this* cart |
| E4.3 | **Price lock** for the session (15 min) so cart price cannot silently drift mid-session | P1 | A mid-checkout price change blocks the order with a clear "price updated" prompt |
| E4.4 | Multi-currency display (INR base + USD/EUR/AED) with FX from a free source | P2 | Display converts consistently; INR remains the settlement currency |
| E4.5 | Persistent cart: signed-in (server) + guest (device) with merge-on-login (quantities summed, no duplicates) | P0 | Guest cart merges into the account cart on login without losing lines |
| E4.6 | **Cart as the full evaluation surface**: subtotal, discount, GST, per-line delivery promise, coins to earn, coins to burn, payable total | P0 | All six blocks render in the cart drawer before checkout opens |
| E4.7 | Quantity validation, max-per-customer limits for scarce SKUs (jewellery = 1), MOQ rules | P0 | Adding 2 of a max-1 SKU is rejected with an explanation |
| E4.8 | **Promotions engine**: percentage, fixed, BXGY, free shipping, first-order, tiered cart, bundle, category/brand scoped, **combinability + stacking rules**, usage caps | P0 | Legacy coupons (DISCOUNT10, FLASH20, FREESHIP) migrate to data; stacking rules unit-tested |
| E4.9 | Coupon UX: apply, auto-apply best, invalid reasons, "better coupon available" nudge | P0 | Best-coupon nudge names the exact extra ₹ saved |
| E4.10 | **Margin guardrail**: promotions/pricing cannot push an order below the configured floor margin | P0 | Over-stacking is blocked with an audit entry |
| E4.11 | **OMNI cart**: delivery + store-pickup lines in one cart, per-line fulfilment type | P2 | Each line shows its own fulfilment method and ETA |
| E4.12 | Free-delivery nudge using the **zone-aware** threshold | P0 | Nudge math matches the checkout shipping fee exactly |
| E4.13 | Cart recovery: abandonment detection (1 h / 24 h / 72 h) with email/push nudges and a deep link | P1 | Three nudges maximum, respecting consent preferences |
| E4.14 | Save-for-later, move-to-wishlist, "frequently bought together" upsell | P1 | Upsell-attributed conversions visible in E14 analytics |

**OSS:** Custom promotions engine on PostgreSQL + Redis, using **Medusa** (MIT) promotion module as the reference model; Redis (BSD) for cart + price-lock TTL.
**Dependencies:** E13.4 (promotions admin), E5.16 (EMI), E10 (coins), E6 (stock per line).

---

### E5. Checkout, Payments & Inventory Reservation

**Objective:** convert a ₹2.5 L cart without a single moment of doubt — about price, availability, payment safety or arrival date. Modelled directly on Flipkart Commerce Cloud's Transact pattern (*evaluate before commit, decouple payment from order, soft-reserve then hard-reserve*).

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E5.1 | Single-page progressive checkout (address → delivery → payment → review) with guest support | P0 | Guest completes in ≤5 fields beyond address; validation inline |
| E5.2 | Address capture with pincode autocomplete, landmark, address type, phone verification | P0 | Pincode resolves city/state; phone verified by OTP for COD/OBD orders |
| E5.3 | **Pincode serviceability check** returning deliverable/not, SLA days, COD allowed, OBD allowed, installation required | P0 | Non-serviceable pincode blocks checkout with a "notify me" capture |
| E5.4 | **Delivery promise**: computed date range + slot option (standard / express / scheduled date / Sunday), from zone + weight + 3PL calendar | P0 | Promise is stored on the order and is the source of truth for tracking |
| E5.5 | **Zone & weight-based shipping charge** with free-shipping threshold and white-glove surcharge for bulky/fragile items | P0 | A 30 kg armchair and a 90 g serum are priced differently (fixes D7) |
| E5.6 | Gift options: message, gift wrap, hide price on the slip, scheduled delivery date | P1 | Gift wrap appears as a line on the invoice and in the pack list |
| E5.7 | **Soft inventory reservation** on checkout entry, with TTL (10–15 min) and automatic release | P0 | Reserved units are not sellable; TTL expiry releases them and notifies the shopper |
| E5.8 | **Resumable checkout**: `GET /checkout/{id}` returns the full state at any point without re-initialising | P0 | Refresh, app restore or support lookup all resume without data loss |
| E5.9 | Idempotency keys on every mutating checkout call | P0 | Duplicate submit (double-click/retry) creates exactly one order |
| E5.10 | Cart–checkout sync: cart is re-validated at checkout init so stale prices/stock cannot be ordered | P0 | Price/stock drift surfaces a diff and requires confirmation |
| E5.11 | **Payment orchestration via Hyperswitch** (single API across PSPs) with routing rules (success rate, cost, method) | P0 | One integration; PSP switchable by config; fallback routing on failure |
| E5.12 | UPI (intent + collect), cards (with 3DS2), net banking, wallets | P0 | Each method completes a sandbox end-to-end order |
| E5.13 | **Tokenized cards (RBI-compliant)** with card-not-present consent; raw PAN never touches our servers (PCI SAQ-A) | P0 | Only token + last4 + network stored; audit confirms no PAN in logs/DB |
| E5.14 | Saved payment methods + 1-tap re-buy for returning customers | P1 | Repeat purchase in ≤2 taps using a vaulted token |
| E5.15 | Payment retry & alternate-method recovery on failure, without losing the reservation | P0 | Failed payment keeps reservation until TTL and offers another method |
| E5.16 | **No-Cost EMI** (card/issuer + Pay-Later) and interest-bearing EMI with plan table (3/6/9/12/18/24 months) | P0 | EMI amount computed server-side; No-Cost subvention shown as a discount line |
| E5.17 | **Bank offers** (instant discount, cashback) as first-class offer objects | P1 | Offer applies automatically when the BIN/method matches and shows saving |
| E5.18 | **COD with rules**: pincode allow-list, max order value, COD fee, prepaid-only categories (jewellery), OTP on delivery | P0 | COD hidden when ineligible; COD fee and limits visible pre-payment |
| E5.19 | Partial payment / pay-now-pay-later deposit for high-value orders | P2 | Deposit + balance schedule stored on the order |
| E5.20 | **Order created at payment initiation** so every attempt is traceable, then linked to the payment on success | P0 | Order exists in `pending_payment` before the PSP redirect |
| E5.21 | **Hard reservation on payment confirmation** (inventory committed only after success) | P0 | Stock ledger shows reserve → commit transition with timestamps |
| E5.22 | Async payment reconciliation + retry/sideline queues using Temporal workflows | P0 | Delayed webhook resolves within 5 min; unmatched attempts land in a sideline queue |
| E5.23 | Order confirmation page + email/SMS/WhatsApp with order ID, promise, invoice, tracking link | P0 | All channels dispatched ≤60 s after payment success |
| E5.24 | Fraud checks: velocity, address/device mismatch, high-value manual review queue | P1 | Orders > ₹2 L with risk score above threshold route to review; SLA 30 min |
| E5.25 | Order editing before fulfilment (address, phone, gift note) with audit trail | P1 | Address change blocked after dispatch with an explanatory message |
| E5.26 | Support-created draft orders (phone/WhatsApp sales) | P2 | Draft converts to a real order with the same reservation semantics |
| E5.27 | Failure taxonomy + RTO prevention: insufficient stock after commit triggers auto-refund + apology credit | P0 | Any post-payment unfulfillable order is refunded within 24 h and flagged in ops |

**OSS:** **Hyperswitch** (Apache-2.0, Juspay) for payment orchestration + token vault; **Temporal** (MIT) for reservation/reconciliation workflows; Redis (BSD) for TTL reservations; ERPNext (GPL-3.0) for the ledger of record.
**Dependencies:** E6 (stock ledger), E4 (pricing), E8 (refund path), E16.3 (PCI scope).

---

### E6. Order Management, Inventory & Fulfilment (Merchant Side)

**Objective:** make every customer promise physically true. This epic is what fixes the oversell defect (D1/D2) permanently.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E6.1 | **Inventory ledger** as the single source of truth: on-hand, reserved, available, in-transit, damaged, QC-hold, per SKU **per location** | P0 | `available = on_hand − reserved − hold`; every mutation is an append-only ledger row |
| E6.2 | Atomic stock operations: `reserve`, `commit`, `release`, `adjust`, `transfer`, with row-level locking | P0 | Concurrency test: 100 parallel orders for 1 unit → exactly 1 success |
| E6.3 | **Invoicing**: GST-compliant tax invoice (HSN, GSTIN, place of supply, CGST/SGST/IGST), credit notes, e-invoice IRN, e-way bill > ₹50k | P0 | Invoice PDF downloadable; IRN returned for B2B; numbering gap-free per series |
| E6.4 | Order lifecycle state machine: `pending_payment → confirmed → allocated → picked → packed → shipped → out_for_delivery → delivered → closed` (+ `cancelled`, `returned`, `rto`, `on_hold`) | P0 | Illegal transitions rejected; every transition timestamped + attributed |
| E6.5 | Split & merge orders: ship from multiple locations; hold a line when sibling stock is short | P0 | Partial shipment supported with per-shipment tracking |
| E6.6 | **GRN (Goods Receipt Note)**: receive stock from a supplier with serial/IMEI/batch capture, QC pass/fail, damage write-off | P0 | Serial duplicates rejected; damaged units land in QC-hold, never sellable |
| E6.7 | **Serialized unit registry**: every high-value unit (phone, laptop, watch, jewellery, sunglasses) gets a serial, warranty start date and its own history | P0 | Serial sold twice is impossible (unique constraint + ledger) |
| E6.8 | **Picking**: wave/batch pick lists, barcode scan-to-confirm, **serial scan on pick**, shortage handling | P0 | Wrong-item scan blocks progress; pick accuracy measured per operator |
| E6.9 | **Packing**: pack station, LPN/box mapping, protective packaging rules per category (fragile ceramic, bulky furniture, tamper-evident seal for jewellery) | P0 | Pack rules enforced by category; box + seal photo stored in MinIO |
| E6.10 | **Label & manifest**: shipping label, packing slip, GST invoice, LPN barcode, manifest per courier | P0 | Label generated via Karrio; manifest closes daily |
| E6.11 | Dispatch QC: weight/dimension check against expected (catches mis-picks and empty-box fraud) | P1 | Weight variance >5% blocks dispatch with an ops alert |
| E6.12 | Cycle counting & stock audit with variance approval workflow | P0 | Variance > ₹10,000 requires manager approval; inventory accuracy KPI fed |
| E6.13 | **Inventory forecast & auto-reorder**: runout days from velocity, reorder point, supplier lead time, safety stock (extends the existing `inventory_forecast.py`) | P1 | Alert 15 days before runout at current velocity; PO draft generated |
| E6.14 | Multi-location inventory (warehouse, dark store, store-as-warehouse) with transfer orders | P1 | Transfer moves stock atomically between locations |
| E6.15 | Low-stock thresholds **per category/SKU** (not a global 10) driven by velocity + lead time | P0 | Jewelry (9 units) and Serum (60 units) get different thresholds and alerts |
| E6.16 | **Returns intake (reverse GRN)**: inspect, grade (resellable / refurb / write-off), restock decision | P0 | Graded units move to the right bucket; journal entry recorded |
| E6.17 | Ops console: queue views (to-allocate, to-pick, to-pack, to-dispatch, exceptions), SLA timers, ageing | P0 | Every queue shows SLA breach count; ops can act in one click |
| E6.18 | Warehouse KPIs: pick/pack TAT, mis-ship rate, damage rate, cost per shipment | P1 | Dashboard refreshes every 5 min |
| E6.19 | **PIM integration** (Akeneo) or in-house PIM: product attributes, media, taxonomy, lifecycle status, channel readiness | P1 | Publish to storefront + Meilisearch + marketplace channels in one action |
| E6.20 | Barcode/QR toolchain (generate + print) for SKU, serial and LPN labels | P0 | Labels scan correctly on the standard 2-inch printer |

**OSS:** **ERPNext** (GPL-3.0) for inventory/finance/invoicing, or **Odoo Community** (LGPL-3.0) as an alternative; custom FastAPI WMS service for scan-driven ops; **Akeneo CE** (OSL-3.0) for PIM; **Karrio** (MIT) for labels/manifests; MinIO (AGPL-3.0) for media/photos; PostgreSQL row locks + `SELECT … FOR UPDATE` for atomicity.
**Dependencies:** E5 (reservations), E7 (dispatch), E8 (reverse intake), E13 (admin UI).

---

### E7. Delivery, Tracking & Last Mile

**Objective:** replace the fabricated timeline with a real, event-driven, trustworthy delivery experience — including **Open Box Delivery** and OTP proof, the strongest trust signals available for this catalog.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E7.1 | **Courier / 3PL aggregation** (rate + serviceability + label + pickup) behind one abstraction | P0 | ≥2 providers live in sandbox; adding a provider requires no order-flow change |
| E7.2 | Courier allocation rules by pincode, weight, value, service level, cost and past performance | P0 | Rules evaluated per shipment; chosen courier + reason stored on the shipment |
| E7.3 | Shipment creation with AWB, label, pickup request and manifest handover | P0 | AWB stored; label reprintable; pickup request acknowledged |
| E7.4 | **Real tracking events** ingested from 3PL webhooks **and** a poller fallback, normalised to a canonical event set | P0 | Timeline renders from DB events, not templates (fixes D3) |
| E7.5 | **Tracking page** (signed token, no login): map, ETA, courier contact, reschedule, cancel-if-not-shipped | P0 | Page reflects the latest event ≤60 s after receipt |
| E7.6 | Proactive milestone notifications via Novu (email + SMS + WhatsApp + push) | P0 | ≥6 milestone messages, each carrying the current ETA |
| E7.7 | **ETA recomputation** as events arrive; notify **before** the customer notices a slip | P0 | Promise-at-risk flagged when projected delivery slips >4 h |
| E7.8 | **Delivery slots**: standard, express, scheduled date, Sunday, night (metro) | P0 | Slots sourced from the serviceability engine; the chosen slot is honoured |
| E7.9 | **Open Box Delivery (OBD)**: sealed box opened by the partner in front of the customer, serial verified, then acceptance or refusal | P0 | OBD flag per SKU; the delivery app enforces the flow; refusal captured with reason |
| E7.10 | **OTP-verified delivery** for COD, OBD and orders > ₹50,000 | P0 | 4–6 digit OTP to the registered phone; wrong OTP blocks handover |
| E7.11 | **Proof of delivery**: signature, photo, geo-stamp, timestamp, scanned serial — stored immutably | P0 | POD retrievable from the order timeline and write-once |
| E7.12 | **Delivery-partner field app** (PWA): route list, navigate, call/message, scan, OTP, POD, COD collect, OBD checklist | P0 | Works offline and syncs when connectivity returns |
| E7.13 | **COD collection & remittance**: cash/UPI-on-delivery, daily reconciliation, deposit tracking | P0 | Collected COD matches remittance; variance flagged |
| E7.14 | **NDR workflow**: reason codes (customer unavailable, address issue, refused, COD not ready), auto reattempt ≤3, then RTO | P0 | NDR auto-recovery ≥40%; RTO triggers refund for prepaid orders |
| E7.15 | Reschedule and change address/phone pre-dispatch from the tracking page | P1 | Changes allowed only in valid order states |
| E7.16 | **White-glove delivery** for bulky/fragile items: 2-person handling, scheduled slot, unboxing, placement, packaging takeaway | P0 | Applied automatically by category rule to furniture and fragile decor |
| E7.17 | **Installation & demo** for eligible products, with partner scheduling | P1 | Slot booked at order time or post-delivery; completion recorded |
| E7.18 | Delivery insurance / declared value for shipments > ₹50,000 | P0 | Insurance applied automatically; claim workflow exists for damage |
| E7.19 | Damage-in-transit workflow: photo evidence, claim, replacement dispatch or refund | P0 | Claim raised ≤24 h of POD; replacement prioritised in allocation |
| E7.20 | **Serviceability master**: pincode → zone, SLA days, COD allowed, OBD allowed, white-glove allowed, cutoff time | P0 | Maintainable in admin; drives both PDP promise and checkout |
| E7.21 | Zone/route optimisation using an OSS routing engine for ETAs | P2 | ETA derived from real distance/duration, not a constant |
| E7.22 | Delivery quality scorecards: on-time %, NDR %, damage %, OBD compliance %, per courier and partner | P1 | Scorecards automatically reweight courier allocation |
| E7.23 | **Live delivery map** (customer view) with geofenced status | P2 | Map shown only while the partner shares location |
| E7.24 | Post-delivery feedback: NPS + delivery rating with closed-loop follow-up on detractors | P1 | A detractor raises a support ticket within 5 min |
| E7.25 | Missed-ETA credit: auto-issue coins when we break our promise | P2 | Credit rule configurable per service level |

**OSS:** **Karrio** (MIT) as the shipping/3PL abstraction; **Nominatim/Photon** (OSM, ODbL/GPL) for geocoding; **OSRM** or **Valhalla** (BSD-2/Apache-2.0) for routing + ETA; **Novu** (MIT) for notifications; MinIO for POD media; Uptime Kuma (MIT) for webhook health.
**Dependencies:** E5.4 (promise), E6 (dispatch + POD), E8 (RTO), E14 (delivery analytics).

---

### E8. Returns, Exchange, Refunds & Reverse Logistics

**Objective:** make returning an expensive item as trustworthy as buying it — for premium goods, the return policy *is* the purchase decision.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E8.1 | Category-specific **return policies** (jewellery: 7-day prepaid-only; electronics: 7-day replacement; beauty: non-returnable once opened; furniture: 10-day), with the policy version stored on the order line | P0 | Policy shown on PDP before purchase and on the order; version captured at purchase |
| E8.2 | Self-service return initiation from the order (reason code + photo/video evidence upload) | P0 | Request created ≤60 s; auto-approval for eligible reasons |
| E8.3 | **Eligibility engine**: window, condition, tamper-seal integrity, serial match, non-returnable flags | P0 | Ineligible requests blocked with a specific, human-readable reason |
| E8.4 | **Exchange** flow (size/colour/variant swap) with price-difference handling | P1 | Exchange rate ≥35% of total returns; difference settled automatically |
| E8.5 | **Pickup-based reverse logistics** scheduled at the customer's convenience via the same 3PL abstraction | P0 | Slot booking works for serviceable pincodes; reverse AWB generated |
| E8.6 | Doorstep QC at pickup (photos, seal check, accessories checklist) | P1 | Failed doorstep QC blocks pickup with guidance to contact support |
| E8.7 | **Reverse tracking** mirroring forward statuses | P0 | Customer sees pickup → in transit → received → QC → refund |
| E8.8 | **Warehouse reverse GRN** with grading (A: resell, B: refurb, C: write-off) and automatic restock of grade-A units | P0 | Grade-A units re-enter sellable stock within 24 h |
| E8.9 | Refund methods: original source, wallet (instant), bank transfer, replacement — with eligibility rules | P0 | Method chosen at request; wallet credit ≤5 min |
| E8.10 | **Refund SLA engine** with clock-stopping on customer-caused delays | P0 | Prepaid refund ≤48 h after QC; COD refund via bank transfer ≤72 h |
| E8.11 | **Return-fraud protection**: return-rate scoring, serial-mismatch detection, empty-box/weight evidence, repeat-offender flags, COD-refusal scoring | P0 | High-risk returns routed to manual review; false-positive review SLA 24 h |
| E8.12 | Refund and credit-note accounting entries (GST credit note for the returned value) | P0 | Credit note number generated; GST reports stay consistent |
| E8.13 | Cancellation: self-service before dispatch, partial-line cancellation, auto-refund | P0 | Cancel → refund initiated ≤5 min; reservation released immediately |
| E8.14 | **RTO for COD** (refusal at the door): reverse pickup, restock, two-way freight attributed in the order P&L | P0 | RTO reason captured; freight cost visible per order |
| E8.15 | Warranty claims routed as a separate service flow, not a return | P1 | Warranty claim reuses tracking but not the refund path |
| E8.16 | Returns analytics: rate by SKU/category/reason, refund-TAT distribution, fraud-cluster detection | P1 | Report surfaces the top 3 return-driving SKUs each month |
| E8.17 | Bulk returns for B2B/corporate orders | P2 | Multi-line return in a single request |
| E8.18 | Deposit/advance refunds for partial-payment orders | P2 | Deposit refunded proportionally with an audit trail |
| E8.19 | Customer-visible **refund ledger** ("₹X credited to HDFC ••1234 on 12 Oct, UTR …") | P1 | UTR visible; support can trace any refund on one screen |
| E8.20 | Goodwill credits and price-protection refunds (price drop within N days) | P2 | Claim window configurable per category |

**OSS:** **Karrio** (MIT) for reverse labels; **Temporal** (MIT) for refund/RTO orchestration with retries; ERPNext (GPL-3.0) for credit notes and accounting; PostgreSQL refund ledger; **Metabase** (AGPL-3.0) for return analytics.
**Dependencies:** E5 (payments/refunds), E6 (reverse GRN), E7 (tracking), E11 (support escalation).

---

### E9. Warranty, Authenticity & Service

**Objective:** convert "is this genuine?" from a fear into a feature — and turn after-sales into repeat revenue.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E9.1 | **Authenticity certificate** per serialized unit: brand, model, serial/IMEI, import/batch details, warranty start, QR that resolves to a public verification page | P0 | Scanning the QR on a delivered unit resolves to a valid, immutable record |
| E9.2 | **Public serial verification** (`/verify/{serial}`) — anyone can confirm a serial is genuinely ours and see its status (in stock / sold / returned / blocked) | P0 | Returned or counterfeit-listed serials show as invalid; no PII exposed |
| E9.3 | **Warranty registry** auto-populated at delivery (start date = POD date), with brand warranty length from the catalog | P0 | Warranty visible in the customer account and in admin |
| E9.4 | **Service requests**: book a repair/service appointment, pickup logistics, status tracking, estimate approval | P1 | Service request reuses the reverse-logistics abstraction |
| E9.5 | Extended warranty / AMC sold as an attach product at checkout | P2 | AMC attaches as a line; entitlement created on delivery |
| E9.6 | Blocklist / grey-market detection: flag serials from unapproved suppliers | P1 | Blocked serial cannot be sold or verified as valid |
| E9.7 | Counterfeit-report intake from customers with refund/credit path | P2 | Report creates a case and freezes the SKU if the cluster threshold is hit |

**OSS:** Custom FastAPI service (`warranty`, `serial_registry`) on PostgreSQL; QR generation via `qrcode` (already present); ERPNext for AMC/service billing.

---

### E10. Loyalty, Wallet & Growth

**Objective:** turn one-time ₹2 L buyers into repeat customers, and use scarce stock (7–9 unit SKUs) as a loyalty lever rather than an availability problem.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E10.1 | **ShopCread Plus** membership (paid/free tier) with benefits: free delivery, early access to drops, extended returns, priority support | P0 | Tier stored on the user; benefits applied automatically at cart/checkout |
| E10.2 | **Coins (SuperCoin-style)**: earn on orders/reviews/referrals, burn at checkout with caps (e.g. max 10% of order value) | P0 | Immutable coin ledger; burning reduces payable total and is visible pre-payment |
| E10.3 | **Wallet**: refunds, goodwill credits, referral bonuses; usable at checkout; never refundable to bank | P0 | Wallet balance and ledger visible; reconciliation report exports daily |
| E10.4 | Tiers (Bronze/Silver/Gold/Platinum) driven by trailing-12-month spend, with published benefit tables | P1 | Tier recomputed nightly; change notified to the customer |
| E10.5 | **Referral programme**: give-₹X-get-₹Y, fraud-guarded (device/address dedupe) | P1 | Bonus credited after the referee's order is delivered and past the return window |
| E10.6 | **Early access / drop mechanics** for scarce SKUs (e.g. 9-unit Diamond Pendant) — Plus members get a 24 h window | P0 | Non-members see "Plus early access" with a join CTA; members can buy immediately |
| E10.7 | Waitlist + lottery for high-demand limited stock (fairness, no bots) | P1 | Entries capped per user; winners notified with a purchase window |
| E10.8 | Personalised offers: birthday, anniversary of first purchase, category affinity | P1 | Offer delivered via Novu; conversion tracked |
| E10.9 | Gamified milestones (profile completion, first review, 5th order) | P2 | Milestones surface in the account page |
| E10.10 | Loyalty liability accounting: outstanding coins/wallet tracked as a liability in ERP | P0 | Finance report shows outstanding liability to the rupee |

**OSS:** Custom coin/wallet ledger (PostgreSQL, append-only) orchestrated by Temporal; **Novu** (MIT) for campaign/triggered messaging; **n8n** (Sustainable Use License) or **Apache Airflow** (Apache-2.0) for scheduled loyalty jobs; ERPNext for liability accounting.

---

### E11. Customer Support & CX

**Objective:** one console, complete context, AI-first triage — so a ₹2.5 L delivery complaint never gets "please share your order ID".

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E11.1 | **Unified inbox** for email, web chat, WhatsApp, Instagram DM and in-app chat | P0 | All channels land in one queue with the customer's order context attached |
| E11.2 | **Order-aware agent console**: timeline, payments, shipments, returns, loyalty, past tickets, lifetime value on one screen | P0 | Agent resolves without switching tools; P95 context load ≤1.5 s |
| E11.3 | **AI-first triage**: concierge handles WISMO ("where is my order"), returns initiation, invoice resend, address change | P0 | ≥55% containment; every hand-off carries a summary |
| E11.4 | SLA + escalation matrix by issue type and customer tier (Plus = priority) | P0 | Breach alarms fire at 80% of SLA; escalations routed automatically |
| E11.5 | Macros, canned responses, multilingual replies, tone guardrails | P1 | Macros reduce average handle time by ≥25% |
| E11.6 | **Proactive support**: detect stuck shipments, payment mismatches and delayed refunds and open a ticket before the customer complains | P1 | ≥30% of "stuck" cases self-detected |
| E11.7 | CSAT/NPS capture after resolution with closed-loop follow-up | P0 | Detractors trigger a supervisor callback within 4 h |
| E11.8 | Support analytics: volume by reason, FCR, AHT, reopen rate, cost per contact | P1 | Dashboard updated hourly |
| E11.9 | Voice/IVR integration with call logging and click-to-call from the console | P2 | Call recording linked to the ticket |

**OSS:** **Chatwoot** (MIT) for omnichannel inbox + agent console + WhatsApp integration; the existing grounded concierge (E3) as the AI layer; Novu for notifications; Metabase for support analytics.

---

### E12. Marketplace & Seller OS

**Objective:** scale from 13 first-party SKUs to hundreds without owning the inventory — with the same trust guarantees.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E12.1 | **Seller onboarding**: application, KYC (GSTIN, PAN, bank), document upload, agreement e-sign, approval workflow | P1 | Onboarding in ≤3 days; approval gates listing rights |
| E12.2 | **Seller Hub**: self-service listing creation (single + CSV/bulk), media upload, metafields, category mapping | P1 | Bulk upload of 50 SKUs in one file; errors reported per row |
| E12.3 | Commission & fee engine: category commission, payment fee, shipping fee (forward + reverse), fixed fee | P1 | Fee breakup visible per order; settlement statement generated |
| E12.4 | **Payouts & reconciliation**: T+7 payout cycle, holdback for return window, settlement reports, GST TCS/TDS handling | P1 | Seller sees order-level settlement; disputes resolvable in-app |
| E12.5 | **Seller SLA scorecard**: dispatch TAT, cancellation rate, return rate, ratings, OBD compliance — with penalties/visibility throttling | P1 | SLA breach reduces search ranking automatically |
| E12.6 | Seller-fulfilled vs. marketplace-fulfilled (our warehouse) | P2 | Fulfilment mode per SKU; promises differ accordingly |
| E12.7 | Price competitiveness & minimum/maximum price guardrails per SKU | P2 | Seller cannot price below the configured floor |
| E12.8 | Seller support: dedicated queue, SLA, dispute resolution for buyer claims | P1 | Every claim has a decision SLA and an appeal path |
| E12.9 | Ratings for sellers surfaced on PDP and PDP trust badges | P1 | Rating shown only above a minimum order count |
| E12.10 | Catalog quality enforcement: spec completeness, image count, return-policy assignment before publish | P1 | Publishing blocked until quality gates pass |

**OSS:** **Saleor** (BSD-3) or **Medusa** (MIT) as architectural reference for multi-channel/vendor models; **Odoo Community** (LGPL-3.0) or ERPNext for seller accounting/payouts; **OpenBoxes** (EPL-1.0) as a WMS/MRP reference; n8n for seller onboarding automation.

---

### E13. Admin, Ops & Merchant Tooling

**Objective:** give the merchant the same leverage Shopify gives — merchandising, pricing, promotions, automation and AI — without a deploy.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E13.1 | **RBAC + audit log**: every privileged action recorded (actor, before/after, IP, reason) | P0 | Immutable, exportable trail; no action possible without an attributable actor |
| E13.2 | **PIM / Catalog admin**: CRUD, drafts, versioning, bulk edit, media library, variants, metafields, lifecycle status, scheduled publish/unpublish | P0 | Bulk edit 50 SKUs; scheduling works to the minute |
| E13.3 | **Inventory admin**: on-hand by location, adjustments with reason codes, transfers, GRN, cycle count, low-stock alerts | P0 | Adjustments > ₹10,000 need approval; every change carries a reason code |
| E13.4 | **Promotions & pricing admin**: campaign builder (rules, eligibility, stacking, caps), price lists, scheduled flash sales, price A/B tests | P0 | Invalid rule combinations rejected at save time with an explanation |
| E13.5 | **Order admin**: search by anything (order ID, email, phone, AWB, serial), state overrides with reasons, refunds, reshipments, notes | P0 | Any order traceable in ≤3 clicks; overrides logged |
| E13.6 | **Customer admin**: profile, lifetime value, order history, risk flags, consent, communication preferences, block/unblock | P0 | PII masked by default; unmasking requires a reason |
| E13.7 | **Content & campaign builder**: landing pages, banners, offer strips, collection rules, gift guides — drag-and-drop, no code | P1 | A new campaign page ships in <15 min without engineering |
| E13.8 | **Notifications admin**: template editor (email/SMS/WhatsApp/push), preview, test-send, channel routing rules | P1 | Templates versioned; test-send to a chosen number |
| E13.9 | **Workflow automation (Flow-style)**: trigger (order placed, stock low, return requested, promise at risk) → condition → action (notify, tag, credit, assign, hold, webhook) | P1 | Merchant builds "if promise slips > 4 h then credit ₹500 coins + notify" without code |
| E13.10 | **Merchant AI copilot (Sidekick-style)**: "Why did revenue drop last week?", "Which SKUs stock out in 14 days?", "Draft a Diwali campaign for jewellery" — grounded and actionable | P1 | Every answer cites the underlying query/report; actions need confirmation |
| E13.11 | Global search across orders/products/customers/tickets from one bar | P1 | Results in ≤300 ms with type grouping |
| E13.12 | Settings: taxes, GSTIN, zones, serviceability, fees, return windows, payment providers, courier accounts, feature flags | P0 | All configurable without code; changes audited |
| E13.13 | **Real-time ops wallboard** for warehouse/dispatch (queue depth, SLA breaches, couriers en route) | P2 | Auto-refreshing and readable from 3 m |
| E13.14 | Reporting centre with CSV/XLSX export: orders, inventory, GST, settlements, returns | P0 | Scheduled exports to email or MinIO |

**OSS:** React admin console (existing `pages/admin/*` extended) + FastAPI admin API; **Strapi** (MIT) or **Payload** (MIT) as optional headless CMS; **Unleash** (Apache-2.0) or **Flagsmith** (BSD-3) for feature flags; **Metabase** (AGPL-3.0) for ad-hoc reporting; the existing grounded AI layer for the copilot.

---

### E14. Analytics, Experimentation & Personalisation

**Objective:** instrument the whole funnel so every KPI in §6.3 is reported automatically and every change can be measured.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E14.1 | **Event pipeline** with a canonical schema (`page_viewed`, `item_viewed`, `search_performed`, `cart_updated`, `checkout_started`, `payment_succeeded`, `order_shipped`, `order_delivered`, `return_requested`, `refund_completed`, `concierge_turn`) | P0 | Every event carries `user_id`/`anon_id`, `session_id`, timestamp and schema version |
| E14.2 | Client + server dual tracking with deduplication | P0 | No double counting; server events are authoritative for money |
| E14.3 | **Funnel dashboards**: PDP → cart → checkout → payment → delivered | P0 | Drop-off visible per step, device and category |
| E14.4 | **Cohort & retention analysis** (acquisition channel, first category, AOV band, membership tier) | P1 | 90-day repeat-purchase KPI computed automatically |
| E14.5 | **Attribution**: last-touch, first-touch and AI-assisted attribution for concierge-influenced orders | P1 | AI-assisted revenue reportable to the rupee |
| E14.6 | **A/B testing** (pricing, PDP layout, offer placement, AI tone) | P1 | Significance computed automatically; promoting a winner is a config change |
| E14.7 | Per-persona dashboard suite (merch, ops, CX, finance, exec) | P0 | Each dashboard loads ≤3 s and refreshes ≤5 min |
| E14.8 | Anomaly alerting (revenue drop, conversion drop, refund spike, courier failure) to Slack/email | P1 | Alert includes a linked diagnostic chart |
| E14.9 | Data governance: PII classification, retention policies, right-to-erasure propagated into analytics | P0 | Erasure removes or anonymises user-level analytics data within 30 days |
| E14.10 | Warehouse + semantic layer for self-service BI | P1 | Analysts add a metric without engineering help |

**OSS:** **PostHog** (MIT, self-hosted) for analytics/sessions/funnels/experiments; **Metabase** (AGPL-3.0) for BI; **Apache Superset** (Apache-2.0) as alternative; **Redpanda** (BSL) or **Apache Kafka** (Apache-2.0) as the event bus; **Debezium** (Apache-2.0) for CDC; **dbt-core** (Apache-2.0) for transformations.

---

### E15. Platform, AI Systems & Observability

**Objective:** make the platform operable — event-driven, observable, cost-controlled, and safe to evolve.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E15.1 | **Event bus** for domain events (order, payment, inventory, delivery, loyalty, AI) with at-least-once delivery + idempotent consumers | P0 | Consumers replay safely; duplicate events cause no double side effects |
| E15.2 | **Transactional outbox** for DB ↔ bus consistency | P0 | No lost events on crash; outbox drained ≤5 s |
| E15.3 | Scheduled/background jobs (abandoned cart, forecast reorder, tier recompute, courier poller, reconciliation) | P0 | Jobs observable, retryable, and idempotent |
| E15.4 | **AI observability**: token usage, latency, cost per conversation, prompt/response versions, guardrail violations | P0 | Cost dashboard per model/provider/day; violations alerted |
| E15.5 | **Prompt & model registry** with versioning, A/B of prompts, rollback | P1 | Prompt change measurable; rollback in one click |
| E15.6 | **Guardrails**: PII redaction, jailbreak detection, catalog grounding, output schema validation, spend caps, kill-switch | P0 | Kill-switch disables AI surfaces within 60 s |
| E15.7 | **Observability stack**: metrics, traces, structured logs, dashboards, SLOs and error budgets | P0 | Every request traceable end-to-end across services |
| E15.8 | **Feature flags** for progressive rollout and instant rollback | P1 | Any feature toggled without deploy |
| E15.9 | Caching strategy (CDN, HTTP, app-level, Redis semantic cache for AI) | P1 | PDP TTFB ≤200 ms cached; AI semantic cache hit-rate ≥25% |
| E15.10 | **CI/CD**: lint (Oxlint), typecheck, unit + integration + E2E (Playwright), migrations (Alembic), staging → production with approvals | P0 | Every PR runs the full gate; migrations are reversible and reviewed |
| E15.11 | Load & resilience testing (peak sale traffic, payment latency, courier webhook storms) | P1 | Documented capacity: X orders/min sustained; chaos test on PSP timeout |
| E15.12 | Backup, DR and restore drills (RPO ≤5 min, RTO ≤1 h) | P0 | Quarterly restore drill evidence; encrypted backups |
| E15.13 | Cost governance: AI spend caps, infra budget alerts, per-order infra cost metric | P1 | Per-order infra cost tracked against the margin KPI |

**OSS:** **Apache Kafka** or **Redpanda** for the bus; **Debezium** for CDC; **OpenTelemetry** (Apache-2.0) + **Prometheus**/**Grafana**/**Loki**/**Tempo** (AGPL-3.0) for metrics/logs/traces; **Sentry** self-hosted (BSL) for error tracking; **Temporal** (MIT) for workflows; **Redis** (BSD) for caching; **Locust** (MIT) for load tests; **Playwright** (Apache-2.0) for E2E; **Unleash** for flags; **Uptime Kuma** for availability.

---

### E16. Security, Privacy & Compliance

**Objective:** protect ₹1.8 Cr of inventory value, customer PII, payment data and the brand — and be provably compliant.

| ID | Requirement | P | Acceptance criteria |
|---|---|---|---|
| E16.1 | Fix the backend duplication: **one** API contract. Either publish the legacy `/api/*` bytecode contract as reviewed source in `backend/app/api/v1` (v1) with `/api` as a reverse-proxy alias, or delete the legacy app | P0 | No unrunnable/unauditable code path remains; `backend/main.pyc` is removed or replaced by source |
| E16.2 | **Single database configuration**: one `DATABASE_URL`, one migration path (Alembic), no orphan DB files | P0 | `alembic upgrade head` from empty → working schema; CI proves it |
| E16.3 | **PCI-DSS SAQ-A posture**: no PAN storage, hosted/tokenized fields only, token vault in Hyperswitch, TLS 1.3 everywhere, quarterly ASV scan | P0 | Scan report clean; architecture diagram shows no card data in our boundary |
| E16.4 | **RBI payment compliance**: card tokenization, no card-on-file, e-mandate rules for recurring | P0 | Only network tokens persisted; audit confirms |
| E16.5 | Authorisation hardening: object-level checks (customer can only read own orders), row-level security in PostgreSQL, no IDOR | P0 | Pen-test: no cross-user data access; automated tests for every resource |
| E16.6 | Secrets management (Vault/SOPS), rotation policy, no secrets in git; `.env` values replaced by a vault reference | P0 | Secret scanning in CI fails the build on a leaked key |
| E16.7 | **DPDP Act 2023**: consent, purpose limitation, notice, grievance officer, breach notification ≤72 h, data-principal rights | P0 | Consent ledger; DSAR fulfilled ≤30 days; documented breach playbook |
| E16.8 | Encryption: TLS in transit, AES-256 at rest, column-level encryption for phone/GSTIN/address, hashed OTPs | P0 | DB dump yields no readable PII |
| E16.9 | CSRF, XSS, SQLi, SSRF, open-redirect protections; CSP tightened (remove `unsafe-eval`), dependency scanning (SCA) | P0 | Semgrep + `pip-audit`/`npm audit` clean; ZAP baseline scan passes |
| E16.10 | **Fraud & abuse platform**: rules + scoring for orders, returns, coupons, referrals, COD refusals; OPA-based policy-as-code | P0 | Policy changes are reviewable code; false-positive review queue exists |
| E16.11 | Account security: device fingerprint, login alerts, suspicious-login step-up auth | P1 | New device triggers an email alert; risky login requires OTP |
| E16.12 | Audit & forensics: immutable logs, admin action trail, payment/refund trail | P0 | Log retention ≥1 year; tamper-evident storage |
| E16.13 | Accessibility: **WCAG 2.2 AA** (keyboard nav, contrast, ARIA, focus states, alt text, reduced motion) | P0 | axe-core CI gate with zero critical violations; manual screen-reader pass |
| E16.14 | Business compliance: GST registration & filing, e-invoice, Legal Metrology (packaged goods declarations), Consumer Protection (E-Commerce) Rules 2020 disclosures | P0 | Seller identity, grievance officer and return policy pages published |
| E16.15 | Incident response: on-call, severity matrix, runbooks, status page | P1 | Tabletop exercise per quarter; status page live for outages |
| E16.16 | Third-party/vendor risk review for every OSS component (license, CVE, maintenance, data access) | P0 | Component register maintained with license + CVE status |

**OSS:** **Keycloak** or **Ory Kratos** (auth) + **OPA** (Apache-2.0) for policy; **HashiCorp Vault** (BSL) or **SOPS** (MPL-2.0) for secrets; **Semgrep** (LGPL-2.1) + **Trivy** (Apache-2.0) + `pip-audit`/`npm audit` for SAST/SCA; **OWASP ZAP** (Apache-2.0) for DAST; **axe-core** (MPL-2.0) for accessibility; pgcrypto for column encryption; **Uptime Kuma** + status page.

---

## 9. Non-Functional Requirements

### 9.1 Performance budgets

| Surface | Metric | Budget |
|---|---|---|
| Storefront LCP (4G, mid-tier Android) | Largest Contentful Paint | ≤2.0 s |
| Storefront CLS / INP | Stability / interactivity | ≤0.05 / ≤200 ms |
| Home & collection API | P95 | ≤300 ms |
| Search API | P95 | ≤120 ms |
| PDP API (server-driven blocks) | P95 | ≤400 ms |
| Cart operations (add/update) | P95 | ≤150 ms |
| Serviceability + promise check | P95 | ≤250 ms |
| Checkout init / reservation | P95 | ≤500 ms |
| Payment init → redirect | P95 | ≤1.2 s |
| Order confirmation write | P95 | ≤400 ms |
| Tracking API | P95 | ≤200 ms |
| Concierge first token | P95 | ≤2.5 s (self-hosted), ≤1.8 s (API) |
| Admin dashboard load | P95 | ≤3 s |
| Eligible PNG/JS payload | compressed transfer | ≤250 KB initial route |

### 9.2 Availability, capacity & resilience

| Requirement | Target |
|---|---|
| Storefront + catalog availability | 99.95% monthly |
| Checkout + payments availability | **99.9%** (no maintenance windows during sales) |
| Degradation mode | If the concierge or recommendation service is down, PDP/cart/checkout continue unaffected |
| If the PSP is degraded | Alternate route via Hyperswitch; cart + reservation preserved |
| Peak capacity (festive sale) | ≥60 orders/min sustained, ≥300 orders/min burst |
| Inventory concurrency | 1,000 concurrent reservation attempts on a single SKU with zero double-sell |
| Data durability | RPO ≤5 min, RTO ≤1 h |
| Webhook resilience | At-least-once with idempotency; replay queue for 7 days |
| Graceful failure | Never show a promise we cannot compute — show "check pincode" instead of a fake date |

### 9.3 Compatibility & UX

| Requirement | Detail |
|---|---|
| Browsers | Last 2 versions of Chrome, Edge, Safari, Firefox; Samsung Internet |
| Devices | Mobile-first 360 px → 1920 px; PWA installable with offline shell |
| Accessibility | WCAG 2.2 AA, keyboard-complete, screen-reader tested (NVDA + VoiceOver), 200% zoom |
| Languages | English + Hindi at launch; i18n framework ready for more |
| Currency | INR settlement; USD/EUR/AED display only |
| Time zone | Asia/Kolkata for all business dates |
| Reduced data mode | Lazy media, low-res placeholders, works on 3G |
| Offline | Field app works offline; storefront shows cached catalog with a clear "offline" banner |

### 9.4 Data & retention

| Data class | Retention | Notes |
|---|---|---|
| Order, invoice, payment, GST records | 8 years | Statutory requirement |
| Shipment/tracking events | 3 years | Dispute support |
| Chat transcripts | 18 months | Redacted of PII |
| Analytics events (user-level) | 25 months | Then aggregated |
| Marketing consent records | Life of account + 3 years | Proof of consent |
| OTP challenges | 24 hours | Hashed, never plaintext |
| Deleted accounts | PII erased ≤30 days | Financial records retained per law, pseudonymised |

---

## 10. Data Model

PostgreSQL 16+ (with `pgvector`). Existing `products`, `users`, `orders`, `order_items`, `chat_logs`, `conversion_logs` are extended; everything below is additive. All tables carry `created_at`, `updated_at`, and money is stored as `NUMERIC(14,2)` in **INR paise-free decimals** (never `float`), with a separate `currency` column.

### 10.1 Identity & access

| Table | Key columns | Notes |
|---|---|---|
| `users` | id, email (unique, case-insensitive), phone, password_hash, full_name, role, status, is_verified, two_factor_enabled, two_factor_secret, gstin, kyc_status | Extends existing table; `role` gains the 8 roles from §5.2 |
| `user_addresses` | id, user_id, label, line1, line2, landmark, city, state, pincode, lat/lng, phone, is_default, is_serviceable | Address book (currently absent) |
| `sessions` | id, user_id, refresh_token_hash, device, ip, user_agent, expires_at, revoked_at | Extends `refresh_tokens` |
| `webauthn_credentials` | id, user_id, credential_id, public_key, sign_count, transports, nickname | Passkeys |
| `otp_challenges` | id, user_id/phone/email, purpose, otp_hash, attempts, expires_at, consumed_at | Never store plaintext OTP |
| `consents` | id, user_id, purpose, granted, policy_version, ip, granted_at | DPDP evidence |
| `audit_log` | id, actor_id, actor_role, action, entity, entity_id, before, after, reason, ip, created_at | Append-only |

### 10.2 Catalog & merchandising

| Table | Key columns | Notes |
|---|---|---|
| `products` | id, sku, title, slug, description, brand_id, category_id, status, tax_class_id, hsn_code, warranty_months, is_serialized, is_obd_required, is_fragile, is_bulky, return_policy_id, weight_g, dims_mm, published_at | Adds the trust + logistics attributes the current model lacks |
| `product_variants` | id, product_id, sku, attributes (jsonb), weight_g, status | Colour/size/capacity |
| `product_media` | id, product_id, variant_id, type (image/video/3d), url, alt, position | Gallery |
| `product_specs` | product_id, key, value, unit, group, position | The metafield/spec table |
| `categories` | id, parent_id, name, slug, path, spec_schema (jsonb), hsn_code | Spec schema drives PDP rendering |
| `brands` | id, name, logo, seller_id, authenticity_policy | Brand trust metadata |
| `collections` | id, name, type (manual/smart), rule_jsonb, sort_order | Merchandising rails |
| `collection_products` | collection_id, product_id, position | Manual membership |
| `price_lists` / `prices` | id, list_id, variant_id, currency, mrp, selling_price, effective_from/to, cost_price | Cost price enables the margin guardrail |
| `reviews` | id, product_id, order_line_id, user_id, rating, title, body, media, verified_purchase, status, helpful_count | Verified-purchase enforced |
| `review_votes` | review_id, user_id, vote | Helpfulness |
| `questions` / `answers` | id, product_id, user_id, body, status; answer: question_id, author_type, body | Q&A |
| `search_queries` | id, user_id/anon_id, query, filters (jsonb), result_count, clicked_ids, created_at | Ranking + personalisation input |

### 10.3 Inventory & fulfilment

| Table | Key columns | Notes |
|---|---|---|
| `locations` | id, name, type (warehouse/dark_store/store), address, pincode, is_pickup_enabled | Multi-location |
| `inventory` | id, variant_id, location_id, on_hand, reserved, hold, in_transit, safety_stock, reorder_point, velocity_7d | Derived `available` |
| `inventory_ledger` | id, variant_id, location_id, delta, reason_code, ref_type, ref_id, actor_id, created_at | **Append-only; the source of truth** |
| `stock_reservations` | id, variant_id, location_id, qty, cart_id/checkout_id, state (soft/hard/released/expired), expires_at, order_line_id | TTL enforced by Temporal |
| `serials` | id, variant_id, serial_no (unique), imei, batch_no, status (in_stock/sold/returned/blocked/qc_hold), grn_id, order_line_id, warranty_start, warranty_end | Authenticity backbone |
| `grns` / `grn_lines` | id, supplier_id, location_id, received_at, status; line: grn_id, variant_id, qty, unit_cost, qc_status | Inbound + serial capture |
| `suppliers` | id, name, gstin, contact, payment_terms, lead_time_days | Reorder + GRN |
| `purchase_orders` / `po_lines` | id, supplier_id, status, expected_at; line: po_id, variant_id, qty, unit_cost | Auto-reorder output |
| `pick_lists` / `picks` | id, order_id, location_id, status, assigned_to; pick: pick_list_id, order_line_id, variant_id, serial_id, qty, scanned_by | WMS |
| `packages` | id, order_id, lpn, box_type, weight_g, dims_mm, seal_photo_url, packed_by | Pack station |
| `stock_adjustments` | id, variant_id, location_id, qty_delta, reason_code, evidence_url, approved_by | Cycle count + write-offs |

### 10.4 Cart, checkout, payments & orders

| Table | Key columns | Notes |
|---|---|---|
| `carts` | id, user_id/anon_id, currency, price_locked_at, status, source | Persistent cart |
| `cart_lines` | id, cart_id, variant_id, qty, unit_price, discount, fulfilment_type (delivery/pickup), added_at | Per-line price attribution |
| `checkout_sessions` | id, cart_id, user_id, address_id, promise_jsonb, slot, shipping_fee, cod_fee, state, idempotency_key, expires_at | Resumable checkout |
| `payments` | id, order_id, provider, provider_ref, method, amount, currency, status, token_ref, emi_plan_id, risk_score, idempotency_key | **No PAN/CVV ever** |
| `payment_attempts` | id, payment_id, attempt_no, provider_ref, status, failure_code, latency_ms | Retry analytics |
| `emi_plans` | id, provider, tenure_months, interest_rate, subvention_type (no_cost/interest), available_bins, min_amount | EMI source of truth |
| `refunds` | id, order_id, payment_id, return_id, amount, method, status, utr, initiated_at, completed_at, reason | Refund ledger |
| `wallets` / `wallet_ledger` | id, user_id, balance; ledger: wallet_id, delta, reason, ref, created_at | Store credit |
| `orders` | id, order_no, user_id, channel, status, currency, totals_jsonb, promise_date_from/to, slot, gift_jsonb, risk_score, placed_at, cancelled_at | Extends existing table; add real columns for the money fields currently buried in JSON |
| `order_lines` | id, order_id, variant_id, product_snapshot (jsonb), qty, mrp, unit_price, discount, tax_lines (jsonb), hsn, serial_id, fulfilment_type, status, return_policy_version | Snapshot so history never mutates |
| `order_status_history` | id, order_id, from_status, to_status, actor_id, reason, created_at | Audit of the state machine |
| `invoices` / `invoice_lines` | id, order_id, invoice_no (gap-free per series), gstin, place_of_supply, taxable_value, cgst, sgst, igst, irn, eway_bill_no, pdf_url; line: invoice_id, hsn, qty, unit_price, tax_rate | GST + e-invoice |
| `credit_notes` | id, invoice_id, return_id, number, amount, gst_breakup, reason | Returns accounting |
| `idempotency_keys` | key, endpoint, request_hash, response_body, created_at | Exactly-once mutations |

### 10.5 Delivery, returns, loyalty, support

| Table | Key columns | Notes |
|---|---|---|
| `serviceability` | pincode, zone, sla_days, cod_allowed, obd_allowed, white_glove_allowed, cutoff_time, is_active | Promise engine input |
| `shipping_zones` / `rate_cards` | zone, weight_band, base_fee, per_kg, free_threshold, cod_fee, white_glove_fee | Weight/zone pricing |
| `shipments` | id, order_id, package_id, courier, awb, service_level, status, promised_at, rto_reason, insurance_value, freight_cost | Forward + reverse |
| `tracking_events` | id, shipment_id, code, canonical_status, description, location, occurred_at, source (webhook/poll/manual) | **Replaces the fabricated timeline** |
| `delivery_attempts` | id, shipment_id, attempt_no, outcome, reason_code, otp_verified, odometer/pod_id | NDR system |
| `proof_of_delivery` | id, shipment_id, signature_url, photo_url, geo, otp_method, serial_scanned, accepted, refused_reason, delivered_at | Immutable |
| `warranty_registrations` | id, serial_id, order_line_id, user_id, brand, model, start_date, end_date, certificate_no | Authenticity |
| `service_requests` | id, user_id, order_line_id, type (repair/replace/amc), status, pickup_shipment_id, estimate, approved_at | After-sales |
| `return_policies` | id, name, category_id, window_days, conditions_jsonb, prepaid_only, non_returnable, version | Versioned policy |
| `return_requests` | id, order_line_id, user_id, reason_code, evidence, state, requested_at, approved_at, pickup_shipment_id, refund_id, fraud_score | RMA |
| `return_items` | id, return_request_id, variant_id, qty, serial_id, grade, qc_notes, restock_location_id | Reverse GRN |
| `loyalty_memberships` | user_id, tier, joined_at, expires_at, benefits_jsonb | Plus |
| `coin_ledger` | id, user_id, delta, reason, ref, expires_at, created_at | Immutable earn/burn |
| `referrals` | id, referrer_id, referee_id, code, state, reward_coin_txn_id, fraud_flag | Referral |
| `promotions` | id, code, type, value, conditions_jsonb, scope_jsonb, stacking_group, max_uses, per_user_cap, starts_at, ends_at, status | Promotions engine |
| `promotion_redemptions` | id, promotion_id, order_id, user_id, discount_amount, created_at | Usage caps |
| `campaigns` / `offers` | id, name, type (bank/exchange/emi), rules_jsonb, banner_url, starts_at, ends_at | Offers surfaced pre-cart |
| `conversations` / `messages` | id, user_id, channel, status, assigned_to, csat; message: conversation_id, role, body, attachments, sent_at | CX + AI transcripts |
| `tickets` / `ticket_events` | id, conversation_id, order_id, category, priority, sla_due_at, state; event: ticket_id, type, actor, payload | Support |
| `content_pages` | id, slug, type (page/banner/collection_rule), blocks_jsonb, status, published_at | CMS |
| `notification_templates` / `notifications` | id, channel, event_key, subject, body, version; notification: user_id, template_id, payload, status, sent_at, provider_ref | Novu |
| `chat_logs` (existing, extended) | + prompt_version, model, latency_ms, cost_usd, grounded_product_ids, guardrail_flags, session_id | AI observability |
| `conversion_logs` (existing, extended) | + attribution_type, click_id, session_id, order_line_id | Attribution |
| `events_outbox` | id, aggregate_type, aggregate_id, event_type, payload, published_at, attempts | Transactional outbox |

---

## 11. API Surface Index

Legend for **Status**: ✅ exists today · ⚠️ exists but must be fixed · 🆕 new.

### 11.1 Identity & account

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| POST | `/api/v1/auth/register` | Register (JSON body) | public | ⚠️ D14 (currently query params) |
| POST | `/api/v1/auth/login` | Password login | public | ⚠️ D14 |
| POST | `/api/v1/auth/login-2fa` | Complete TOTP challenge | public + temp token | ✅ |
| POST | `/api/v1/auth/otp/request` | Request email/SMS OTP | public | 🆕 |
| POST | `/api/v1/auth/otp/verify` | Verify OTP → session | public | 🆕 |
| POST | `/api/v1/auth/passkey/register` · `/verify` | WebAuthn | session | 🆕 |
| POST | `/api/v1/auth/refresh` | Rotate refresh token | refresh cookie | ✅ |
| POST | `/api/v1/auth/logout` · `/logout-all` | Revoke session(s) | session | ✅ / 🆕 |
| POST | `/api/v1/auth/verify-email` · `/resend-verification` | Email verification | public | ✅ |
| POST | `/api/v1/auth/forgot-password` · `/reset-password` | Reset flow | public | ✅ |
| GET/POST | `/api/v1/auth/2fa/setup` · `/enable` · `/disable` | TOTP management | session | ✅ |
| GET | `/api/v1/auth/me` | Current user profile | session | ✅ |
| GET | `/api/v1/auth/sessions` · DELETE `/sessions/{id}` | Device management | session | 🆕 |
| POST | `/api/v1/account/data-export` · `/delete-request` | DPDP rights | session | 🆕 |
| GET/POST/PATCH/DELETE | `/api/v1/account/addresses[/{id}]` | Address book | session | 🆕 |

### 11.2 Catalog, search & content

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| GET | `/api/v1/categories` | Category tree + spec schema | public | ✅ (extend) |
| GET | `/api/v1/products` | List with **facets, filters, sorting, pagination** | public | ⚠️ (no search/sort/facets today) |
| GET | `/api/v1/products/{slug}` | PDP payload (specs, media, variants, offers, promise input) | public | ✅ (extend) |
| GET | `/api/v1/search` | Instant search + suggestions | public | 🆕 |
| GET | `/api/v1/collections/{slug}` | Collection contents | public | 🆕 |
| GET | `/api/v1/products/{id}/reviews` · POST | Reviews + rating summary | public / session | 🆕 |
| GET/POST | `/api/v1/products/{id}/questions` · `/answers` | Q&A | public / session | 🆕 |
| GET | `/api/v1/products/{id}/recommendations` | Similar / complementary (vector) | public | 🆕 |
| POST | `/api/v1/alerts/stock` · `/price` | Back-in-stock / price-drop alerts | session | 🆕 |
| GET | `/api/v1/content/{slug}` | CMS page/banner payload | public | 🆕 |

### 11.3 Pricing, offers, cart & checkout

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| POST | `/api/v1/pricing/quote` | Server-authoritative totals for a cart (discounts, GST, shipping, coins) | public/session | 🆕 |
| GET | `/api/v1/products/{id}/emi-plans` | EMI plans for an amount | public | 🆕 |
| GET | `/api/v1/offers` | Bank/exchange/coupon offers for a cart | public/session | 🆕 |
| POST | `/api/v1/coupons/validate` | Validate coupon (replaces hardcoded 3) | public | ⚠️ |
| GET/POST/PATCH/DELETE | `/api/v1/cart[/lines/{id}]` | Persistent cart CRUD + merge | session/anon | 🆕 |
| GET/POST | `/api/v1/serviceability?pincode=` | Serviceability + promise + fees | public | 🆕 |
| POST | `/api/v1/checkout` | Create/resume checkout session (**soft reservation**) | session/guest | 🆕 |
| GET | `/api/v1/checkout/{id}` | **Resumable** checkout state | session/guest | 🆕 |
| PATCH | `/api/v1/checkout/{id}` | Update address/slot/gift/coins (**idempotent**) | session/guest | 🆕 |
| POST | `/api/v1/checkout/{id}/payments` | Initiate payment (**order created here**) | session/guest | 🆕 |
| POST | `/api/v1/webhooks/payments/hyperswitch` | PSP callback + reconciliation | signed | 🆕 |

### 11.4 Orders, fulfilment & delivery

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| POST | `/api/v1/orders` | Create order (**from checkout, never raw**) | session | ⚠️ D12 (user_id from principal) |
| GET | `/api/v1/orders` · `/orders/{id}` | Order list/detail (own orders only) | session | ✅ (fix authz) |
| POST | `/api/v1/orders/{id}/cancel` | Cancel pre-dispatch + auto-refund | session | 🆕 |
| PATCH | `/api/v1/orders/{id}` | Edit address/phone/gift pre-fulfilment | session/support | 🆕 |
| GET | `/api/v1/orders/{id}/invoice` | GST invoice PDF | session | 🆕 |
| GET | `/api/v1/orders/{id}/tracking` | **DB-driven** timeline + ETA | session/token | ⚠️ D3 |
| GET | `/track/{awb}?token=` | Public tracking page | signed token | 🆕 |
| POST | `/api/v1/webhooks/couriers/{provider}` | Normalised tracking/AWB/NDR events | signed | 🆕 |
| GET | `/api/v1/admin/orders` | Ops queue with filters + SLA | ops roles | 🆕 |
| POST | `/api/v1/admin/orders/{id}/transitions` | State machine transitions (reasoned) | ops roles | 🆕 |
| GET/POST | `/api/v1/admin/grn[/{id}]` | Goods receipt with serials + QC | ops roles | 🆕 |
| POST | `/api/v1/admin/inventory/adjust` | Stock adjustment (approval-gated) | ops roles | ⚠️ D2 (await fix) |
| GET | `/api/v1/admin/inventory/low-stock` | Per-SKU thresholds + forecast | ops roles | ✅ (extend) |
| GET/POST | `/api/v1/admin/pick-lists` · `/packages` · `/manifests` | WMS operations | ops roles | 🆕 |

### 11.5 Returns, warranty & loyalty

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| GET | `/api/v1/orders/{id}/return-eligibility` | Policy + eligibility check | session | 🆕 |
| POST | `/api/v1/returns` | Create return/exchange request | session | 🆕 |
| GET | `/api/v1/returns` · `/{id}` | Return status + reverse tracking | session | 🆕 |
| POST | `/api/v1/returns/{id}/pickup-slots` | Pickup slot booking | session | 🆕 |
| GET | `/api/v1/refunds/{id}` | Refund status + UTR | session | 🆕 |
| GET | `/verify/{serial}` | Public authenticity verification | public | 🆕 |
| GET | `/api/v1/warranty` | Warranty registrations | session | 🆕 |
| POST | `/api/v1/service-requests` | Service/repair booking | session | 🆕 |
| GET | `/api/v1/loyalty` | Tier, coins, wallet, benefits | session | 🆕 |
| POST | `/api/v1/loyalty/coins/redeem` | Redeem at checkout | session | 🆕 |
| POST | `/api/v1/referrals` | Generate/share referral | session | 🆕 |

### 11.6 AI, admin & platform

| Method | Path | Purpose | Auth | Status |
|---|---|---|---|---|
| POST | `/api/v1/chat/recommend` | Grounded concierge (RAG + tools) | public/session | ⚠️ D4 |
| POST | `/api/v1/chat/reset` | Reset conversation | session | ✅ |
| POST | `/api/v1/ingest/inventory/auto-ingest` | Unstructured → structured product | ops roles | ✅ |
| POST | `/api/v1/ingest/inventory/confirm-ingestion` | Commit ingested product | ops roles | ✅ |
| POST | `/api/v1/omnichannel/webhook/channel-message` | WhatsApp/IG/email channel | signed | ✅ (extend) |
| GET | `/api/v1/admin/stats` · `/admin/logs` | AI + conversion analytics | ops roles | ✅ (extend) |
| GET | `/api/v1/admin/analytics/{funnel,cohorts,attribution}` | Commerce analytics | ops roles | 🆕 |
| GET/POST/PATCH | `/api/v1/admin/promotions[/{id}]` | Promotions CRUD | merch roles | 🆕 |
| GET/POST/PATCH | `/api/v1/admin/catalog[/{id}]` | PIM operations + bulk | merch roles | 🆕 |
| GET/POST | `/api/v1/admin/workflows[/{id}]` | Flow-style automations | admin | 🆕 |
| POST | `/api/v1/admin/copilot` | Merchant AI copilot | admin | 🆕 |
| GET | `/api/v1/admin/audit-log` | Audit trail | admin | 🆕 |
| GET | `/api/v1/health` | Liveness/readiness + dependency status | public | ✅ |
| GET | `/api/v1/csrf-token` | CSRF token | public | ✅ |
| WS | `/api/v1/ws/inventory` | Real-time stock broadcast | session | ✅ |
| WS | `/api/v1/ws/orders/{id}` | Live order status | session/token | 🆕 |

---

## 12. Open-Source Technology Stack Map

Every capability above is delivered by an open-source component wherever a credible one exists. **No paid SaaS is required to reach Phase 4.**

### 12.1 Core application & data

| Capability | Component | License | Why this one |
|---|---|---|---|
| Backend API | **FastAPI** + **Uvicorn** + **Pydantic v2** | MIT / BSD / MIT | Already in the repo; async, typed, OpenAPI-native |
| Frontend | **React 19** + **Vite** + **Tailwind 4** + **Framer Motion** + **lucide-react** | MIT | Already in the repo |
| Primary DB | **PostgreSQL 16** | PostgreSQL License | Transactions, row locks, JSONB, RLS — required for inventory truth |
| Vector search | **pgvector** | PostgreSQL License | Semantic search + recommendations without a second datastore |
| Cache / TTL | **Redis** | BSD-3 | Reservation TTLs, semantic cache, rate limits |
| Migrations | **Alembic** | MIT | Already scaffolded in `backend/alembic/` |
| Commerce reference | **Medusa** (cart/promotions) or **Saleor** (multi-channel) | MIT / BSD-3 | Pattern reference for cart, promotions, multi-warehouse |
| Admin / CMS | **Strapi** or **Payload** | MIT | Campaign pages and banners without deploys |

### 12.2 Commerce capability → OSS component

| Capability | OSS component | License | Notes |
|---|---|---|---|
| Identity, OIDC, SSO | **Keycloak** or **Ory Kratos** | Apache-2.0 | Passkeys, social login, MFA, session management |
| Payments orchestration & token vault | **Hyperswitch** | Apache-2.0 | India-first (Juspay); UPI/cards/EMI/COD routing |
| Shipping, labels, tracking, 3PL aggregation | **Karrio** | MIT | One API across couriers; forward + reverse |
| Geocoding / pincode | **Nominatim** or **Photon** | ODbL / Apache-2.0 | Address validation, zone mapping |
| Routing / ETA | **OSRM** or **Valhalla** | BSD-2 / Apache-2.0 | Real drive-time ETAs instead of constants |
| Search & facets | **Meilisearch** | MIT | Sub-50 ms instant search, typo tolerant |
| Embeddings / semantic ranking | **sentence-transformers** + **pgvector** | Apache-2.0 / PostgreSQL | Recommendations, similar products |
| LLM (self-hosted) | **Ollama** + **Llama 3.x / Mistral**, or **vLLM** | MIT / Apache-2.0 | Zero marginal AI cost; no data leaves premises |
| LLM orchestration / RAG | **LangChain** or **LlamaIndex** | MIT | Retrieval, tool calling, guardrails |
| ERP: inventory, invoicing, GST, e-invoice, AMC | **ERPNext** (or **Odoo Community**) | GPL-3.0 / LGPL-3.0 | GST returns, e-invoice IRN, e-way bill, GL |
| PIM | **Akeneo Community** | OSL-3.0 | Governs specs/metafields at scale |
| WMS patterns / MRP | **OpenBoxes** or Odoo Inventory | EPL-1.0 / LGPL-3.0 | GRN, picking, cycle-count patterns |
| Workflow orchestration | **Temporal** | MIT | Reservations, refunds, RTO, retries, sagas |
| Event streaming | **Apache Kafka** or **Redpanda** | Apache-2.0 / BSL | Domain events, analytics, outbox relay |
| CDC to warehouse | **Debezium** | Apache-2.0 | Order/inventory change capture |
| Notifications (email/SMS/WhatsApp/push) | **Novu** | MIT | One abstraction, per-user channel preferences |
| Bulk/lifecycle email | **Listmonk** | AGPL-3.0 | Campaigns and newsletters |
| Customer support omnichannel | **Chatwoot** | MIT | Inbox + WhatsApp + agent console |
| Marketing automation | **n8n** or **Apache Airflow** | SUL / Apache-2.0 | Cart recovery, loyalty jobs, seller onboarding |
| Product analytics & experiments | **PostHog** (self-hosted) | MIT | Funnels, sessions, flags, A/B |
| BI / reporting | **Metabase** or **Apache Superset** | AGPL-3.0 / Apache-2.0 | Ops, finance and merch dashboards |
| dbt transformations | **dbt-core** | Apache-2.0 | Semantic layer for analytics |
| Feature flags | **Unleash** or **Flagsmith** | Apache-2.0 / BSD-3 | Progressive rollout, kill switches |
| Policy-as-code / fraud rules | **Open Policy Agent (OPA)** | Apache-2.0 | COD/return/coupon rules as reviewable code |
| Observability | **OpenTelemetry** + **Prometheus** + **Grafana** + **Loki** + **Tempo** | Apache-2.0 / AGPL-3.0 | Metrics, logs, traces, SLOs |
| Error tracking | **Sentry** (self-hosted) | BSL-1.1 | Frontend + backend errors with release mapping |
| Uptime & status | **Uptime Kuma**, **Gatus** | MIT | Synthetic checks, public status page |
| Secrets | **HashiCorp Vault** or **SOPS** + **age** | BSL-1.1 / MPL-2.0 | No secrets in git |
| SAST / SCA / DAST | **Semgrep**, **Trivy**, `pip-audit`, `npm audit`, **OWASP ZAP** | LGPL-2.1 / Apache-2.0 | CI security gates |
| Accessibility testing | **axe-core** / **@axe-core/playwright** | MPL-2.0 | WCAG gate in CI |
| E2E testing | **Playwright** | Apache-2.0 | Real-browser checkout → delivery journeys |
| Load testing | **Locust** or **k6** | MIT / AGPL-3.0 | Festive-sale capacity proofs |
| Object storage / media | **MinIO** + **imgproxy** | AGPL-3.0 / Apache-2.0 | S3-compatible storage + image transforms |
| Barcode / QR | `qrcode`, `python-barcode`, **ZXing** | BSD / MIT / Apache-2.0 | SKU, serial and LPN labels |
| Containers / CI | **Docker** + **Docker Compose** + **GitHub Actions** | Apache-2.0 / MIT | Already scaffolded in `docker/` |
| Reverse proxy / TLS | **Caddy** or **Traefik** | Apache-2.0 / MIT | Automatic TLS and routing |

### 12.3 License caution notes

- **AGPL components** (MinIO, Metabase, Grafana, Listmonk, k6) are safe as standalone network services, but must not be embedded into distributed code without legal review.
- **BSL components** (Sentry self-hosted, Vault, Redpanda) are source-available rather than OSI-approved; acceptable for internal infrastructure, but must appear in the component register (E16.16).
- **n8n's Sustainable Use License** restricts reselling the automation service itself; fine for internal ops.
- Prefer permissive licenses (MIT / Apache-2.0 / BSD) for anything embedded inside our own products.

---

## 13. System Architecture

### 13.1 Target logical architecture

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT SURFACES                                          │
│  React 19 + Vite SPA / PWA      Field App (delivery PWA)      Seller Hub     Admin Console │
│  Framer Motion · Tailwind 4     Offline-first · scan/OTP      Listings       PIM/Ops/CMS   │
└───────────┬──────────────────────────────┬───────────────────────┬──────────────┬──────────┘
            │ HTTPS (Caddy/Traefik)         │                      │              │
┌───────────▼──────────────────────────────▼───────────────────────▼──────────────▼──────────┐
│                        API GATEWAY  (FastAPI BFF + JWT/CSRF/RBAC/RateLimit)                 │
│   /api/v1/*  (single reviewed contract — legacy /api/* retired via E16.1)                    │
└───┬──────────┬──────────┬──────────┬───────────┬───────────┬───────────┬──────────┬─────────┘
    │          │          │          │           │           │           │          │
┌───▼───┐ ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐ ┌───▼─────┐ ┌───▼────┐ ┌────▼───┐ ┌────▼─────┐
│Identity│ │Catalog  │ │Cart &  │ │Checkout │ │Inventory│ │Order & │ │Returns │ │Loyalty & │
│ Ory/   │ │& Search │ │Pricing │ │& Payments│ │ Ledger  │ │Fulfil- │ │& Refund│ │Coins     │
│Keycloak│ │ Meili+  │ │Promos  │ │Hypersw. │ │Serials  │ │ment WMS│ │Reverse │ │Wallet    │
│        │ │pgvector │ │        │ │Temporal │ │         │ │Karrio  │ │logistics│ │          │
└───┬────┘ └────┬────┘ └───┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ └────┬───┘ └────┬─────┘
    │           │          │           │           │          │           │          │
┌───▼───────────▼──────────▼───────────▼───────────▼──────────▼───────────▼──────────▼─────┐
│                          DOMAIN EVENT BUS  (Kafka / Redpanda + Outbox)                    │
│  order.placed · payment.succeeded · stock.reserved · stock.committed · shipment.dispatched │
│  tracking.updated · order.delivered · return.requested · refund.completed · coins.earned   │
└───┬───────────┬───────────┬───────────┬───────────┬──────────┬──────────┬──────────┬──────┘
    │           │           │           │           │          │          │          │
┌───▼───┐ ┌─────▼────┐ ┌────▼─────┐ ┌───▼─────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│Notif. │ │Analytics │ │Support & │ │AI Conci.│ │Fraud & │ │ERP     │ │Search  │ │Observ. │
│ Novu  │ │ PostHog  │ │Chatwoot  │ │ Ollama/ │ │ OPA    │ │ERPNext │ │ Index  │ │OTel +  │
│       │ │ Metabase │ │          │ │ vLLM    │ │        │ │        │ │ sync   │ │LGTM    │
└───────┘ └──────────┘ └──────────┘ └─────────┘ └────────┘ └────────┘ └────────┘ └────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────────────────────────────┐
│  DATA:  PostgreSQL 16 + pgvector (system of record)  ·  Redis (TTL/cache)  ·  MinIO (media) │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Key architectural decisions

| # | Decision | Rationale |
|---|---|---|
| AD1 | **PostgreSQL is the single system of record**; Redis and the search index are derived, rebuildable caches | Avoids the current three-DB inconsistency (D9) and makes "truth" unambiguous |
| AD2 | **Inventory ledger is append-only**; `inventory` holds the balance, the ledger holds the history | Auditable, and the only way to guarantee no oversell |
| AD3 | **Soft reserve → hard commit** around payment (Flipkart Transact pattern) | Prevents both oversell and abandoned-lock stockouts |
| AD4 | **Order created at payment initiation** | Every attempt traceable; recovery from PSP failures is possible |
| AD5 | **Payments only via Hyperswitch**; no PSP SDK in the frontend | One integration, PSP redundancy, PCI SAQ-A scope |
| AD6 | **Promises computed server-side**, never client-templated | Removes the fabricated-ETA class of bug entirely |
| AD7 | **All AI is grounded and optional**; catalog/checkout work with AI disabled | Trust + graceful degradation |
| AD8 | **Everything publishes domain events** (outbox pattern) | Analytics, notifications and automation all consume one source |
| AD9 | **One API contract**, documented in OpenAPI, generated tests | Removes the bytecode-only backend risk (D10) |
| AD10 | **Feature-flagged change** with instant rollback | Safe continuous delivery |

### 13.3 Environment topology

| Environment | Purpose | Data | Notes |
|---|---|---|---|
| Local | Developer loop | Seeded SQLite→Postgres container, 13-SKU seed fixture | `docker compose up` brings up Postgres + Redis + Meilisearch + MinIO |
| CI | Gates every PR | Ephemeral containers | Lint, typecheck, unit, integration, E2E, migration up/down, axe-core |
| Staging | Full-stack rehearsal | Anonymised production-like data | Sandbox PSPs, sandbox couriers, k6 load tests |
| Production | Live | Real | Blue/green, feature flags, hourly backups, on-call |

---

## 14. Rollout Roadmap & Milestones

Six phases, ~26 weeks to marketplace readiness. Each phase has a **hard exit gate**: nothing moves forward on a failed gate.

### Phase 0 — Stabilise & Unify (Weeks 0–2)
**Goal:** make the codebase trustworthy before adding features.

| Deliverable | Notes |
|---|---|
| Fix all P0 defects D1–D14 | Including the missing `await` (D2), non-incrementing stock (D1), order authz (D12) |
| Retire the bytecode backend (E16.1) | Port the legacy `/api/*` contract into reviewed source; keep `/api` as an alias |
| Single database (E16.2) | PostgreSQL 16 container + Alembic baseline; delete orphan DB files |
| Seed fixture from the real 13-SKU catalog | Tests and demos use real products, prices and stock |
| CI pipeline (E15.10) | Oxlint, `tsc`, pytest, Playwright smoke, migration up/down, secret scan |
| Coverage floor | 60% on money/stock/auth paths; unit tests for `calculateCartTotals` and stock math |

**Exit gate:** `docker compose up` starts the whole app; CI green on every PR; the 13-SKU fixture loads; a scripted test proves stock decrements on order placement.

### Phase 1 — Truth Foundations (Weeks 3–6)
**Goal:** inventory, price and promise become computed facts.

| Deliverable | FRs |
|---|---|
| Inventory ledger + atomic reserve/commit/release with concurrency tests | E6.1, E6.2, E5.7, E5.21 |
| Server-authoritative price engine (discounts genuinely applied, GST breakup) | E4.1, E4.3 |
| Serviceability + delivery-promise + zone/weight shipping engine | E5.3, E5.4, E5.5, E7.20 |
| GST-compliant invoicing | E6.3 |
| Per-SKU low-stock thresholds + forecast wiring | E6.13, E6.15 |
| Meilisearch-backed instant search + facets | E2.2, E2.3 |

**Exit gate:** 100 parallel orders against 1 unit → exactly 1 success; promise and fees match client and server to the rupee; search P95 ≤120 ms.

### Phase 2 — Checkout & Payments (Weeks 7–10)
**Goal:** a real, safe, resumable checkout with real money.

| Deliverable | FRs |
|---|---|
| Cart as the full evaluation surface (offers, coins, EMI, delivery, total) | E4.2, E4.6, E4.8, E4.9, E4.12 |
| Hyperswitch: UPI, cards + 3DS2, net banking, wallets | E5.11, E5.12, E5.13 |
| No-Cost EMI + bank offers + COD with rules | E5.16, E5.17, E5.18 |
| Resumable checkout, idempotency, order-at-payment-init, reconciliation workflows | E5.8, E5.9, E5.20, E5.22 |
| Multi-channel confirmation notifications (Novu) | E5.23, E7.6 |
| Guest checkout + account claim | E1.6 |

**Exit gate:** end-to-end sandbox purchase of a ₹2.49 L laptop on EMI, plus a COD order, plus a failed-payment retry — with zero oversell and a correct GST invoice.

### Phase 3 — Fulfilment & Delivery (Weeks 11–14)
**Goal:** every promise becomes physically true.

| Deliverable | FRs |
|---|---|
| WMS: GRN, pick lists with barcode/serial scan, pack station, LPN | E6.6, E6.8, E6.9, E6.10, E6.20 |
| Karrio 3PL abstraction + courier allocation + AWB/labels/manifests | E7.1, E7.2, E7.3 |
| Real tracking ingestion (webhook + poller) + tracking page + ETA recompute | E7.4, E7.5, E7.7 |
| Open Box Delivery + OTP delivery + POD capture | E7.9, E7.10, E7.11 |
| Delivery-partner field PWA | E7.12 |
| NDR workflow + white-glove for bulky/fragile | E7.14, E7.16 |
| Ops console queues with SLA timers | E6.17 |

**Exit gate:** 20 live test orders across 3 pincodes with real tracking events, one OBD, one NDR → reattempt → delivered, and 100% inventory accuracy after cycle count.

### Phase 4 — Trust Pack & Returns (Weeks 15–18)
**Goal:** answer "is it genuine?" and "can I return it?" with facts.

| Deliverable | FRs |
|---|---|
| Serialized unit registry + serial scan on GRN/pick + authenticity certificate + public verification | E6.7, E6.8, E9.1, E9.2 |
| Warranty registry auto-created at POD | E9.3 |
| Versioned return policies + self-service returns + eligibility engine | E8.1, E8.2, E8.3 |
| Pickup-based reverse logistics + reverse tracking + reverse GRN with grading | E8.5, E8.7, E8.8 |
| Refunds (source, wallet, bank) + credit notes + SLA engine | E8.9, E8.10, E8.12 |
| Return-fraud scoring + RTO handling | E8.11, E8.14 |
| Trust badges on PDP driven by real data | E2.14 |

**Exit gate:** return → pickup → reverse GRN → grade-A restock → refund credited ≤48 h with a GST credit note; a returned serial shows invalid on public verification.

### Phase 5 — Growth, CX & Intelligence (Weeks 19–22)
**Goal:** retention, service quality and merchant leverage.

| Deliverable | FRs |
|---|---|
| ShopCread Plus, coins, wallet, referrals, scarce-drop early access | E10.1–E10.7, E10.10 |
| Chatwoot support + AI-first triage + SLA matrix + proactive cases | E11.1–E11.7 |
| Concierge v2: RAG, guardrails, tools, EMI negotiator, self-hosted LLM | E3.1–E3.10 |
| PostHog funnels, cohorts, attribution, A/B | E14.1–E14.7 |
| Flow-style workflow automation + merchant copilot | E13.9, E13.10 |
| Campaign/content builder | E13.7 |
| PDP v2: variants, reviews, Q&A, comparison | E2.9, E2.11, E2.12, E2.13, E2.17 |

**Exit gate:** ≥25% of active customers on Plus; AI containment ≥45%; funnels report conversion and refund TAT automatically.

### Phase 6 — Scale & Marketplace (Weeks 23–26)
**Goal:** 10× catalog without owning the inventory; harden for festive peak.

| Deliverable | FRs |
|---|---|
| Seller onboarding, Seller Hub, commission engine, payouts, SLA scorecard | E12.1–E12.5, E12.8–E12.10 |
| Multi-location inventory + transfers | E6.14 |
| OIDC/passkey expansion, session management | E1.4, E1.7, E1.9 |
| Load tests to 60 orders/min sustained + DR restore drill | E15.11, E15.12 |
| DPDP self-service (export/erase) + audit/forensics hardening | E1.10, E16.7, E16.12 |
| Accessibility audit + remediation to WCAG 2.2 AA | E16.13 |

**Exit gate:** 5 third-party sellers live; peak load test passed; DR drill evidence filed; zero critical accessibility violations.

### 14.1 Team & sequencing assumptions

| Role | Count (min) | Focus |
|---|---|---|
| Backend engineers (Python/FastAPI) | 2–3 | Inventory, payments, OMS, WMS APIs |
| Frontend engineers (React) | 2 | Storefront, PDP/cart/checkout, admin, field app |
| Data/platform engineer | 1 | Events, warehouse, PostHog/Metabase, CI/CD |
| QA/automation engineer | 1 | Playwright, k6/Locust, migration tests |
| Product/ops (part-time) | 1–2 | Catalog, policies, courier/PSP onboarding |
| Designer (part-time) | 1 | PDP/checkout/ops UI, accessibility |

**Long-lead external dependencies to start in Week 0:** PSP merchant account + Hyperswitch deployment; two courier contracts (general + white-glove); GST/e-invoice IRN credentials; SMS/WhatsApp sender registration; finance sign-off on GST/tax configuration.

---

## 15. Risks, Assumptions, Dependencies

### 15.1 Risk register

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Legacy bytecode backend behaves differently from its documented contract when ported (D10) | High | High | Contract-capture tests against the running legacy app before porting; response diffing; feature-flag the cutover | Backend lead |
| R2 | Postgres migration breaks the SQLAlchemy models / existing local DBs (D9) | Medium | High | Alembic baseline from empty schema (not from SQLite); throwaway dev DBs; staged cutover with dual-write in staging only | Platform |
| R3 | PSP onboarding delays block payments | Medium | **Critical** | Start Hyperswitch + merchant account in Week 0; keep "Pay on Delivery only" as a limited-launch fallback | Product ops |
| R4 | Courier/3PL integration delays block delivery promises | Medium | High | Sandbox-first; allow manual AWB entry as a break-glass path; promise falls back to zone default | Ops |
| R5 | Inventory ledger concurrency bugs cause oversell anyway | Low | **Critical** | Concurrency test in CI (100 parallel reservations on 1 unit), property-based tests, load test at 1,000 rps | Backend lead |
| R6 | GST/e-invoice misconfiguration creates tax liability | Medium | High | Finance signs off on tax matrix before Phase 1 exit; e-invoice validated against IRP sandbox | Finance |
| R7 | AI hallucination damages trust in a premium context | Medium | High | Strict grounding (E3.1/E3.2), no AI-generated prices/ETAs ever, kill switch, human review queue | AI lead |
| R8 | Return fraud on jewellery/watches erodes margin | Medium | High | Prepaid-only policy, serial verification, doorstep QC, fraud scoring, ≤3 review gate | Risk/CX |
| R9 | COD remittance leakage | Medium | Medium | Daily reconciliation, deposit tracking, courier scorecards, COD caps | Finance |
| R10 | Damage in transit for fragile/bulky items | Medium | Medium | Category packaging rules, white-glove for bulky, insurance, weight/dimension QC, claim workflow | Ops |
| R11 | OSS component license/upgrade treadmill (AGPL/BSL components) | Medium | Medium | Component register (E16.16), license review before adoption, pinned versions, upgrade calendar | Architecture |
| R12 | Self-hosted LLM quality below GPT-class models | Medium | Low | Hybrid provider strategy (E3.7); evaluate per-prompt-version via A/B; degrade to API provider | AI lead |
| R13 | Scope creep across 16 epics | High | Medium | Phase gates, P0/P1/P2 discipline, non-goals list (§6.2) enforced in grooming | Product |
| R14 | Peak-sale capacity failure | Low | High | k6/Locust to 60 orders/min; autoscaling; pre-warm caches; read replicas | Platform |
| R15 | PII breach / DPDP non-compliance | Low | **Critical** | Encryption, RLS, audit logs, least privilege, DSAR tooling, breach playbook, quarterly pen-test | Security |
| R16 | Key-person dependency on one engineer for the inventory/ledger design | Medium | High | ADR documentation, pair rotation, this PRD + ADRs as onboarding material | Eng manager |

### 15.2 Assumptions

1. The 13 seeded SKUs are illustrative of a premium catalog; real supplier feeds will arrive with cost prices, HSN codes, weights and dimensions (all required by §10 schema).
2. INR is the settlement currency and India is the launch geography; multi-currency remains display-only for v1.
3. The store operates **one** fulfilment location at launch; multi-location is Phase 6.
4. Payment provider, courier providers and GST/e-invoice credentials are obtainable within Phase 0–2.
5. Existing security foundations (`core/security.py`, `core/middleware.py`) are kept and hardened rather than rebuilt.
6. The current React storefront shell (Navbar, Hero, ProductGrid, drawers/modals, admin pages) is retained and evolved — not rewritten.
7. Traffic is modest at launch (thousands of sessions/day), so a modular monolith with an event bus is sufficient; service extraction is deferred until a service has an independent scaling or failure profile.

### 15.3 Dependencies (external)

| Dependency | Needed by | Notes |
|---|---|---|
| Hyperswitch deployment + PSP merchant account | Phase 2 | India: UPI mandatory, cards, EMI partners |
| 2 courier contracts (surface + white-glove/heavy) | Phase 3 | Karrio adapters for each |
| GSTIN, e-invoice IRP credentials, HSN mapping, tax advisory | Phase 1 | Finance-owned |
| SMS + WhatsApp Business sender registration | Phase 2 | Novu providers |
| Email sending domain (SPF/DKIM/DMARC) | Phase 1 | For verification + transactional mail |
| Warehouse space, packing material, scanner + label printers | Phase 3 | 2-inch thermal, barcode scanners, weight scale |
| Support team + 3PL partner mobile devices | Phase 3–5 | Field app devices |

---

## 16. Release Checklist & Exit Criteria

### 16.1 Definition of Ready (per epic)

- [ ] FRs written with IDs and acceptance criteria (this document)
- [ ] Data-model changes described and migration reviewed
- [ ] API contract added to OpenAPI with request/response examples
- [ ] Events added to the canonical event schema
- [ ] Failure modes and degradation behaviour defined
- [ ] Analytics instrumentation identified (which events prove success)
- [ ] RBAC scope agreed for every new endpoint
- [ ] Rollback plan and feature-flag name agreed

### 16.2 Definition of Done (per epic)

- [ ] All acceptance criteria demonstrated on staging with real (sandbox) providers
- [ ] Unit + integration + E2E tests added; coverage floor met on money/stock paths
- [ ] Idempotency and retry proven for every mutating endpoint
- [ ] Audit-log row emitted for privileged actions
- [ ] Observability: metrics, alerts, dashboard panel, runbook entry
- [ ] Accessibility: axe-core clean; keyboard path verified
- [ ] Documentation updated (`README.md`, OpenAPI, ADR if architectural)
- [ ] Feature flag default off until Phase exit gate passes

### 16.3 Pre-launch gate (Phase 2 exit) — the "₹2.5 L laptop" script

Run this end-to-end on staging and record the evidence:

1. New shopper signs up, verifies email, enables 2FA.
2. Searches "OLED laptop", filters by brand and price, opens the PDP.
3. Checks pincode → sees a promise date and shipping fee; sees EMI from ₹X/month.
4. Asks the concierge "which is better for video editing under ₹2.5 L?" → gets a grounded answer citing real SKUs.
5. Adds the ₹2.49 L Aura Ultra Slim Book to the cart → sees discount, GST, free delivery, coins to earn, payable total.
6. Starts checkout → inventory soft-reserved; a second browser cannot fully reserve the last unit.
7. Applies a coupon; enters address; selects a delivery slot; chooses No-Cost EMI.
8. Pays in the PSP sandbox; delayed webhook resolves via reconciliation.
9. Order confirmed; invoice PDF with correct CGST/SGST and HSN available.
10. Ops allocates, picks (serial scanned), packs (box weight recorded), dispatches with AWB.
11. Tracking events flow; ETA recomputes once and notifies the customer.
12. OBD delivery with OTP; POD captured; serial accepted.
13. Warranty registered; public serial verification returns valid.
14. Stock ledger shows reserve → commit with the correct final on-hand.
15. Admin dashboard shows the order, the funnel step, the AI attribution and the margin.

**Gate fails if:** stock goes negative, two orders consume one unit, the promise date differs from the courier's, the invoice tax is wrong, a refund cannot be traced, or any PII appears in logs.

### 16.4 Production readiness checklist

| Area | Check |
|---|---|
| Security | SAST/SCA/DAST clean; secrets in vault; RLS on; WAF + rate limits; pen-test report filed |
| Compliance | GST config signed off; DPDP notices + grievance officer published; return policy pages live; consumer-law disclosures live |
| Payments | PSP live keys; webhook signature verification; reconciliation job running; refund path tested with real money |
| Logistics | 2 couriers live; serviceability data loaded; label printing validated; field app installed on partner devices |
| Data | Backups + PITR verified; restore drill evidence; retention jobs scheduled |
| Ops | On-call rota; runbooks; dashboards; alert routing; status page |
| Support | Chatwoot queues, macros, SLA matrix, escalation paths, CSAT survey live |
| Communication | Order/shipment/delivery templates approved in all 4 channels; sender identities verified |
| Rollout | Feature flags set; blue/green deploy validated; rollback rehearsed |

---

## 17. Appendix

### A. Seeded product catalog (the "available products" this PRD is built around)

Source: `backend/data.py` (present in this repo only as compiled bytecode `backend/data.pyc`). Prices are stored in USD in the seed fixture and displayed in INR at ₹83/USD (`frontend/src/utils/commerce.ts`).

| # | Title | Category | Brand | Price (USD) | Price (₹) | Stock | Disc % | Risk profile |
|---|---|---|---|---|---|---|---|---|
| 1 | ShopCread Phone 15 Pro Max | smartphones | ShopCread Tech | 1,499.99 | ₹1,24,499 | 24 | 12.5% | Serialized, OBD, EMI |
| 2 | Aura Ultra Slim Book 16" | laptops | Aura Computing | 2,999.99 | **₹2,48,999** | 14 | 15% | Serialized, OBD, EMI, insurance |
| 3 | SoundPulse Pro Active ANC Headphones | mobile-accessories | SoundPulse | 349.99 | ₹29,049 | 42 | 20% | Standard |
| 4 | Chrono Classic Chronograph Watch | mens-watches | Chrono Genève | 649.99 | ₹53,949 | 18 | 10% | Counterfeit-prone, serialized, OBD |
| 5 | Luxe Diamond Halo Pendant Necklace | womens-jewellery | Luxe Fine Jewelry | 1,299.00 | ₹1,07,817 | **9** | 8% | Counterfeit-prone, prepaid-only return, tamper seal |
| 6 | Velvet Rose Hydrating Face Serum 50ml | beauty | Botanical Beauty | 89.99 | ₹7,469 | 60 | 15% | Non-returnable once opened |
| 7 | Elixir Noir Luxury Eau de Parfum 100ml | fragrances | Maison Elixir | 195.00 | ₹16,185 | 25 | 10% | Counterfeit-prone, fragile |
| 8 | Mid-Century Modern Lounge Armchair | furniture | Nordic Living | 799.00 | ₹66,317 | **7** | 18% | Bulky, white-glove, ~30 kg class, installation |
| 9 | Minimalist Ceramic Sculptural Vase | home-decoration | Artisan Decor | 65.00 | ₹5,395 | 35 | 5% | Fragile — special packaging |
| 10 | Aviator Polarized Titanium Sunglasses | sunglasses | Optic Elite | 179.99 | ₹14,939 | 29 | 12% | Counterfeit-prone, try-on/AR candidate |
| 11 | Wireless Magnetic Fast Charging Stand | mobile-accessories | ShopCread Tech | 89.99 | ₹7,469 | 50 | 15% | Standard |
| 12 | Galaxy Z Fold Ultra 5G | smartphones | Galaxy Tech | 2,499.99 | **₹2,07,499** | 12 | 10% | Serialized, OBD, EMI, insurance |
| 13 | ProStudio ZenBook 14 OLED Laptop | laptops | ProStudio | 1,699.99 | ₹1,41,099 | 25 | 10% | Serialized, OBD, EMI |

**Catalog totals:** 13 SKUs · 350 units · ≈ $216,451 (≈ ₹1.79 Cr) inventory value · **≈ ₹51,330 average unit value**.

**Categories seeded:** `smartphones`, `laptops`, `mobile-accessories`, `mens-watches`, `womens-jewellery`, `beauty`, `fragrances`, `furniture`, `home-decoration`, `sunglasses`.

**Why this catalog defines the product:** 6 of 13 SKUs sit in counterfeit-prone or physically fragile/bulky categories, 7 of 13 hold fewer than 30 units, and the average unit value is ~₹51,000. A wholesale/marketplace-style UX cannot serve it; a certainty-first UX can.

### B. Coupons in the current build (hardcoded in the legacy backend)

| Code | Effect | Why the PRD changes it |
|---|---|---|
| `DISCOUNT10` | 10% off entire order | Migrate to a `promotions` row with stacking rules and usage caps (E4.8) |
| `FLASH20` | 20% flash-sale discount | Needs start/end windows + a margin guardrail (E4.10), or it destroys margin on a ₹2.49 L laptop |
| `FREESHIP` | Free express shipping | Must become a zone/weight-aware shipping benefit (E4.12, E5.5) rather than a blanket waiver |

### C. Repository map (as-is) → where each piece lands

| Current path | Role today | What happens to it |
|---|---|---|
| `frontend/src/App.jsx`, `components/*` | Storefront SPA shell, drawers, modals | Retained; extended for PDP v2, offers, tracking, returns |
| `frontend/src/context/ShopContext.tsx` | Global state: catalog, cart, wishlist, orders, auth, coupons | Retained; fixed (D6); backed by the server cart and pricing |
| `frontend/src/services/api.js` | Fetch wrapper with JWT refresh, CSRF, DummyJSON fallback | Retained; `secureFetch` becomes the only client path; the fallback catalog source is removed |
| `frontend/src/utils/commerce.ts` | GST/shipping/total math (₹83/USD, GST 18%, ₹1,999 free-ship) | Replaced by server-authoritative pricing (E4.1); kept only for display formatting |
| `frontend/src/hooks/useInventorySocket.ts` | Live stock via WebSocket | Retained; fed by the inventory ledger |
| `frontend/src/pages/admin/*` | Inventory table + analytics bento dashboard | Extended into the full admin/ops console (E13) |
| `frontend/static/index.html`, root `main.py` | Legacy standalone OpenAI chatbot demo | **Removed** (D13 — duplicate/dead) |
| `backend/main.pyc` (source missing) | Live `/api/*` contract, bytecode only | Ported to reviewed source or deleted (E16.1) |
| `backend/app/api/v1/*` | Modern FastAPI routers | Becomes the **only** API surface |
| `backend/app/core/security.py` | bcrypt, JWT, TOTP, QR, RBAC (`require_role`) | Retained and extended (passkeys, sessions) |
| `backend/app/core/middleware.py` | CSP, HSTS, CSRF, rate limiting | Retained; CSP hardened (remove `unsafe-eval`) |
| `backend/app/core/websocket_manager.py` | Stock broadcast | Retained; made event-driven |
| `backend/app/models/*` | SQLAlchemy models (user, product, order, analytics) | Extended per §10 |
| `backend/app/repositories/base.py` | Raw SQLite access (`DB_PATH` points at a non-existent file) | **Retired** — replaced by SQLAlchemy + Alembic (E16.2) |
| `backend/app/repositories/*_repo.py` | Product/user/order repositories | Retained and extended |
| `backend/app/services/inventory_service.py` | Stock update + low-stock alerts | Rewritten around the ledger (E6.1) |
| `backend/app/services/order_service.py` | Order placement (no stock decrement) | Rewritten: reservation → commit → allocation (E5, E6) |
| `backend/app/services/tracking_service.py` | Fabricated timeline (unused) | **Replaced** by `tracking_events` (E7.4) |
| `backend/app/services/recommendation_service.py` | Prompt-stuffed recommendations | Replaced by grounded RAG (E3.1) |
| `backend/app/services/ai_orchestrator.py` | OpenAI tool calling | Retained; extended with the E3.3 tool set |
| `backend/app/services/dynamic_pricing.py` | Scaffolded pricing | Wired into the pricing engine with the margin guardrail (E4.10) |
| `backend/app/services/vector_search.py` | Scaffolded vector search | Wired to pgvector (E2.7, E3.1) |
| `backend/app/services/personalization.py` | Scaffolded personalisation | Wired to the "For you" rail (E2.7) |
| `backend/app/services/inventory_forecast.py` | Runout / reorder logic | Wired to purchase-order drafts (E6.13) |
| `backend/app/services/event_stream.py` | Scaffolded event logger | Becomes the outbox / event-bus publisher (E15.1, E15.2) |
| `backend/app/api/v1/endpoints/{ingestion,omnichannel,ws,admin}.py` | AI ingestion, channel webhook, WS, analytics | Retained; hardened (auth, grounding, RBAC) |
| `backend/test_auth.py` | Auth / CSRF / lockout test suite | Extended into the full CI test pyramid |
| `docker/`, `backend/alembic/`, `start_local.bat` | Container + migration scaffolding | Completed (`alembic/versions/` is currently empty) |
| `suggestion.md` … `suggestion-v7.md` | Design and roadmap notes | Superseded by this PRD (retained as history) |

### D. Glossary

| Term | Meaning |
|---|---|
| **AWB** | Air Waybill — the courier's shipment tracking number |
| **BFF** | Backend-for-Frontend — the API layer tailored to client needs |
| **CW-GMV** | Certainty-Weighted GMV — the North Star metric (§6.3) |
| **EMI** | Equated Monthly Instalment; **No-Cost EMI** means the merchant or issuer absorbs the interest |
| **F-Assured / Verified Genuine** | Trust badges asserting authenticity and seller accountability |
| **GRN** | Goods Receipt Note — inbound stock receipt with QC and serial capture |
| **HSN** | Harmonised System of Nomenclature — the GST product classification code |
| **IRN** | Invoice Reference Number issued by India's e-invoice IRP |
| **LPN** | Licence Plate Number — the barcode on a physical box or package |
| **NDR** | Non-Delivery Report — a failed delivery attempt with a reason code |
| **OBD** | Open Box Delivery — the partner opens the sealed box in front of the customer before acceptance |
| **OMNI cart** | A single cart containing both delivery and store-pickup items |
| **PIM** | Product Information Management |
| **POD** | Proof of Delivery — signature, photo, geo-stamp, OTP and serial |
| **RMA** | Return Merchandise Authorisation |
| **RTO** | Return To Origin — an undeliverable shipment returning to the warehouse |
| **SLA** | Service-Level Agreement with a target time per step |
| **Soft / hard reservation** | Temporary stock hold during checkout vs. permanent commitment after payment |
| **WMS** | Warehouse Management System |

### E. Revision history

| Version | Date | Author | Change |
|---|---|---|---|
| 1.0 | 30 Sep 2026 | Product / Architecture | First consolidated PRD: as-is audit, 16 epics (~150 FRs), data model, API index, OSS stack map, 6-phase roadmap, risks and exit gates |

### F. How to use this document

1. **Engineers:** treat §8 (FRs), §10 (data model) and §11 (API index) as the build order; each FR ID is a ticket-sized unit with testable acceptance criteria.
2. **Product / ops:** §7 (journey map) and §16.3 (the ₹2.5 L laptop script) are the shared definition of "working".
3. **Finance / legal:** §6.3 (metrics), §9.4 (retention) and §16.4 (compliance checks) are the control points.
4. **Reviewers:** challenge §3 (problem), §6.2 (non-goals) and §15 (risks) first — that is where the biggest mistakes hide.
5. **Sequencing rule:** Phase 0's defect fixes are non-negotiable prerequisites. Shipping Phase 2 features on top of D1 (no stock decrement) would scale the oversell bug instead of the business.

---

*End of document.*