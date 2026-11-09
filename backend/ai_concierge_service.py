import re
import json
import sqlite3
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from backend.database import get_db_connection, get_order_by_id, get_orders, get_all_shops
from backend.geo_scraper_service import calculate_haversine_distance

# ============================================================================
# INTENT TAXONOMY & KEYWORD MATCHERS
# ============================================================================

ORDER_ID_PATTERN = re.compile(r"\b(MC-ORD-\d{4}-\d+|ORD-[\w\-]+)\b", re.IGNORECASE)

PERSONAL_DATA_TRIGGERS = [
    "my order", "my orders", "my account", "my profile", "my address", "my phone",
    "my details", "personal detail", "personal data", "who am i", "order history",
    "past purchases", "my purchases", "my deliveries", "my package", "my packages",
    "saved address", "saved addresses", "my email", "my number", "my info", "profile"
]

FRESHNESS_EXPIRY_TRIGGERS = [
    "expiry", "expiration", "shelf life", "manufacturing date", "mfg date", "perishable",
    "freshness", "harvest", "cold chain", "cold-chain", "best before", "batch code",
    "lot number", "spoiled", "organic fruit", "wild catch", "fresh bloom", "flowers freshness"
]

STORE_LOCATOR_TRIGGERS = [
    "store", "stores", "boutique", "boutiques", "atelier", "ateliers", "nearest store",
    "store location", "where are you located", "physical store", "visit store", "shop address",
    "paris store", "london store", "tokyo store", "mumbai store", "delhi store", "bangalore store",
    "bengaluru store", "operating hours", "store hours", "phone number of store"
]

OBD_AUTHENTICITY_TRIGGERS = [
    "obd", "open box", "open box delivery", "inspection", "authentic", "authenticity",
    "counterfeit", "fake", "spectrometer", "tamper", "tamper-evident", "guarantee",
    "lloyd's", "transit insurance", "escrow", "return policy", "refund"
]

CHARITY_COUPON_TRIGGERS = [
    "discount", "coupon", "promo", "voucher", "promo code", "coupon code", "code",
    "offer", "deal", "charity", "donate", "donation", "orphanage", "pledge", "micro-gift",
    "hope bloom", "hope-bloom-20", "sunshine"
]

BNS_TRIGGERS = [
    "bns", "phone shield", "hide phone", "mask phone", "privacy protocol", "virtual bridge",
    "zero knowledge", "private call", "masked number"
]

CATEGORY_MAP = {
    "beauty": ["beauty", "cosmetics", "skincare", "mascara", "eyeshadow", "lipstick", "makeup"],
    "fragrances": ["fragrance", "fragrances", "perfume", "parfum", "cologne", "scent", "eau de parfum"],
    "fresh-flowers": ["flower", "flowers", "roses", "blooms", "botanicals", "bouquet", "flora"],
    "fresh-fish": ["fish", "salmon", "trout", "seafood", "catch", "wild catch", "marine"],
    "groceries": ["grocery", "groceries", "food", "harvest", "artisan harvest"],
    "organic-fruits": ["fruit", "fruits", "apple", "berries", "strawberries", "organic"],
    "clothes": ["clothes", "clothing", "hoodie", "sweatshirt", "t-shirt", "tee", "joggers", "shorts", "pants"],
    "mens-clothing": ["mens", "men's", "suit", "blazer", "tuxedo", "tailored"],
    "womens-clothing": ["womens", "women's", "dress", "gown"],
    "shoes": ["shoe", "shoes", "sneakers", "boots", "heels", "pumps", "loafers", "sandals"],
    "jewelery": ["jewel", "jewelry", "jewelery", "diamond", "necklace", "ring", "gems"],
    "furniture": ["furniture", "chair", "table", "sofa", "armchair", "desk"],
    "electronics": ["electronics", "watch", "smartwatch", "headphones", "laptop", "mouse", "controller", "horlogerie"]
}


def extract_order_id(text: str) -> Optional[str]:
    """Extracts Unique Order ID e.g. MC-ORD-2026-66231 or legacy ORD-XXXX."""
    m = ORDER_ID_PATTERN.search(text)
    if m:
        return m.group(1).upper()
    return None


def get_user_recent_orders(user_id: Optional[int], user_email: Optional[str]) -> List[Dict[str, Any]]:
    """Fetches up to 5 recent orders for the specified user or email."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        orders = []
        if user_id:
            cur.execute("""
                SELECT id, status, tracking_stage, assigned_shop_name, distance_km,
                       estimated_delivery, items_json, summary_json, created_at
                FROM orders
                WHERE user_id = ?
                ORDER BY created_at DESC LIMIT 5
            """, (user_id,))
            rows = cur.fetchall()
            for r in rows:
                d = dict(r)
                try:
                    d["items"] = json.loads(d.get("items_json") or "[]")
                    d["summary"] = json.loads(d.get("summary_json") or "{}")
                except Exception:
                    d["items"] = []
                    d["summary"] = {}
                orders.append(d)

        if not orders and user_email:
            cur.execute("""
                SELECT id, status, tracking_stage, assigned_shop_name, distance_km,
                       estimated_delivery, items_json, summary_json, created_at
                FROM orders
                WHERE shipping_json LIKE ?
                ORDER BY created_at DESC LIMIT 5
            """, (f"%{user_email}%",))
            rows = cur.fetchall()
            for r in rows:
                d = dict(r)
                try:
                    d["items"] = json.loads(d.get("items_json") or "[]")
                    d["summary"] = json.loads(d.get("summary_json") or "{}")
                except Exception:
                    d["items"] = []
                    d["summary"] = {}
                orders.append(d)

        return orders


def search_catalog_products(query: str, category: Optional[str] = None, limit: int = 4) -> List[Dict[str, Any]]:
    """Grounded product search extracting supplying atelier, mfg/exp dates and batch codes."""
    with get_db_connection() as conn:
        cur = conn.cursor()
        sql = """
            SELECT id, title, category, price, stock, rating, thumbnail,
                   shop_id, shop_name, expiry_date, manufacturing_date,
                   batch_number, is_perishable, is_obd_required, brand
            FROM products
            WHERE 1=1
        """
        params: List[Any] = []

        if category:
            sql += " AND LOWER(category) = LOWER(?)"
            params.append(category)

        if query and query.strip():
            clean_q = f"%{query.strip()}%"
            sql += " AND (title LIKE ? OR category LIKE ? OR brand LIKE ? OR description LIKE ?)"
            params.extend([clean_q, clean_q, clean_q, clean_q])

        sql += " ORDER BY rating DESC, stock DESC LIMIT ?"
        params.append(limit)

        cur.execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]

        # Format items cleanly for frontend
        results = []
        for r in rows:
            results.append({
                "id": r["id"],
                "title": r["title"],
                "category": r["category"],
                "price": float(r["price"] or 0.0),
                "stock": r["stock"],
                "rating": r["rating"],
                "thumbnail": r["thumbnail"],
                "shopId": r["shop_id"],
                "shopName": r["shop_name"] or "Maison Partner Atelier",
                "expiryDate": r["expiry_date"],
                "manufacturingDate": r["manufacturing_date"],
                "batchNumber": r["batch_number"],
                "isPerishable": bool(r["is_perishable"]),
                "isObdRequired": bool(r["is_obd_required"]),
                "brand": r["brand"]
            })
        return results


# ============================================================================
# CORE CONVERSATIONAL ENGINE & DISPATCHER
# ============================================================================

def process_concierge_chat(
    message: str,
    current_user: Optional[Dict[str, Any]] = None,
    conversation_history: Optional[List[Dict[str, str]]] = None
) -> Dict[str, Any]:
    """
    Principal AI Concierge handler.
    Combines rule-based determinism with grounded database telemetry,
    enforcing cryptographic personal data airgapping when unauthenticated.
    """
    user_msg = (message or "").strip()
    if not user_msg:
        return {
            "reply": "Greetings. I am the **Maison Cread AI Concierge**. How may I assist you with our catalog, tracking, or private ateliers today?",
            "intent": "GREETING",
            "suggestedPrompts": [
                "Track an Order (MC-ORD-...)",
                "My Account & Orders",
                "Perishables & Expiry Dates",
                "Find Nearest Atelier",
                "Open Box Delivery (OBD)"
            ]
        }

    lower_msg = user_msg.lower()

    # ------------------------------------------------------------------------
    # 1. SPECIFIC ORDER ID DETECTED IN TEXT (e.g. MC-ORD-2026-66231)
    # ------------------------------------------------------------------------
    detected_ord = extract_order_id(user_msg)
    if detected_ord:
        order = get_order_by_id(detected_ord)
        if order:
            assigned_shop = order.get("assigned_shop_name") or "Maison de l'Horlogerie"
            distance = order.get("distance_km") or 2.5
            stage = order.get("tracking_stage") or "confirmed_by_shop"
            delivery_sla = order.get("estimated_delivery") or "Instant 2-Hour Courier"
            addr = order.get("delivery_address") or "Maison Private Client Address"
            items = order.get("items") or []

            stage_display = {
                "placed": "1/6: Order Placed & Vault Registered",
                "confirmed_by_shop": "2/6: Assigned to Registered Atelier (Active)",
                "vault_inspected": "3/6: Quality & Freshness Vault Certification",
                "dispatched": "4/6: Dispatched via White-Glove Logistics",
                "out_for_delivery": "5/6: Out for White-Glove Hand-Delivery",
                "delivered": "6/6: Safely Delivered with Digital Authenticity"
            }.get(stage, f"Status: {stage.upper()}")

            reply = (
                f"### 📦 Live Order Telemetry: `{order['id']}`\n\n"
                f"• **Current Stage**: **{stage_display}**\n"
                f"• **Fulfilling Atelier**: **{assigned_shop}** ({distance} km away)\n"
                f"• **Delivery Protocol**: `{delivery_sla}`\n"
                f"• **Destination Coordinates**: {addr}\n"
                f"• **Vault Items**: {len(items)} piece(s) registered under tamper-evident cryo seal.\n\n"
                f"You can launch the full 6-stage geodesic GPS tracker directly below to view live transit telemetry."
            )

            return {
                "reply": reply,
                "intent": "ORDER_TRACKING",
                "orderCard": {
                    "id": order["id"],
                    "status": stage,
                    "assignedShopName": assigned_shop,
                    "distanceKm": distance,
                    "deliverySla": delivery_sla,
                    "deliveryAddress": addr,
                    "itemsCount": len(items)
                },
                "action": {
                    "type": "OPEN_ORDER_TRACKER",
                    "orderId": order["id"]
                },
                "suggestedPrompts": [
                    f"Open Tracker for {order['id']}",
                    "What is Open Box Delivery (OBD)?",
                    "Check Freshness Guarantee"
                ]
            }
        else:
            return {
                "reply": (
                    f"⚠️ Order **`{detected_ord}`** was not located in our sovereign ledger.\n\n"
                    f"Please verify the identifier format (`MC-ORD-2026-XXXXX`). "
                    f"If you placed this order under your personal account, sign in below to inspect your verified order history."
                ),
                "intent": "ORDER_TRACKING_NOT_FOUND",
                "action": {
                    "type": "OPEN_ORDER_TRACKER",
                    "orderId": detected_ord
                },
                "suggestedPrompts": [
                    "My Account & Orders",
                    "How to find my Unique Order ID",
                    "Contact Private Client Care"
                ]
            }

    # ------------------------------------------------------------------------
    # 2. PERSONAL DATA & ACCOUNT HISTORY (STRICT GATEKEEPER)
    # ------------------------------------------------------------------------
    is_personal_intent = any(trigger in lower_msg for trigger in PERSONAL_DATA_TRIGGERS)
    if is_personal_intent:
        # Check authentication status
        if not current_user:
            return {
                "reply": (
                    "🔒 **Sovereign Privacy Airgap Active**\n\n"
                    "Your personal order history, saved delivery coordinates, masked phone details, "
                    "and private account ledger are protected under cryptographic client isolation.\n\n"
                    "To inspect your personal details or track past acquisitions, please authenticate "
                    "using your personal Gmail or verified phone number below."
                ),
                "intent": "PERSONAL_DATA_GATED",
                "requiresAuth": True,
                "action": {
                    "type": "OPEN_AUTH_MODAL",
                    "targetTab": "login",
                    "title": "Sign In to Access Private Account"
                },
                "suggestedPrompts": [
                    "Sign In with Google or Phone",
                    "Track Order with Order ID",
                    "Browse Curated Catalog",
                    "Nearby Partner Ateliers"
                ]
            }
        else:
            # User is authenticated: safely return personalized details
            u_name = current_user.get("full_name") or current_user.get("name") or "Maison Client"
            u_email = current_user.get("email") or "Confidential"
            u_phone = current_user.get("phone") or "+91 ••••• •••89"
            u_addr = current_user.get("address") or "No primary address on file"
            u_id = current_user.get("id")

            recent_orders = get_user_recent_orders(u_id, u_email)

            if recent_orders:
                ord_list = "\n".join([
                    f"• **`{o['id']}`** — Status: `{o.get('tracking_stage', o.get('status', 'confirmed'))}` "
                    f"({o.get('assigned_shop_name', 'Paris Atelier')}) • Total: ₹{o.get('summary', {}).get('total', 100):,}"
                    for o in recent_orders[:3]
                ])
                reply = (
                    f"Welcome back, **{u_name}**.\n\n"
                    f"Here is your authenticated sovereign ledger snapshot:\n"
                    f"• **Account Email**: `{u_email}`\n"
                    f"• **Protected Phone**: `{u_phone}`\n"
                    f"• **Primary Vault Address**: {u_addr}\n\n"
                    f"### 📋 Recent Sovereign Orders ({len(recent_orders)})\n"
                    f"{ord_list}\n\n"
                    f"Select any order to launch its real-time GPS tracking stream."
                )
            else:
                reply = (
                    f"Welcome back, **{u_name}**.\n\n"
                    f"• **Account Email**: `{u_email}`\n"
                    f"• **Protected Phone**: `{u_phone}`\n"
                    f"• **Primary Address**: {u_addr}\n\n"
                    f"You have zero active orders in your ledger. Would you like assistance exploring our latest timepiece, jewelry, or floral collections?"
                )

            return {
                "reply": reply,
                "intent": "PERSONAL_DATA_VERIFIED",
                "personalCard": {
                    "fullName": u_name,
                    "email": u_email,
                    "phone": u_phone,
                    "address": u_addr,
                    "recentOrders": recent_orders
                },
                "action": {
                    "type": "SHOW_PERSONAL_PROFILE",
                    "user": {
                        "fullName": u_name,
                        "email": u_email,
                        "phone": u_phone,
                        "address": u_addr
                    }
                },
                "suggestedPrompts": [
                    "Track Recent Order",
                    "Find Nearest Atelier",
                    "Browse Fresh Harvest",
                    "20% Hope Angel Discount"
                ]
            }

    # ------------------------------------------------------------------------
    # 3. FRESHNESS, EXPIRY & MANUFACTURING DATES INTENT
    # ------------------------------------------------------------------------
    is_freshness_intent = any(trigger in lower_msg for trigger in FRESHNESS_EXPIRY_TRIGGERS)
    if is_freshness_intent:
        perishables = search_catalog_products("", category="beauty", limit=2)
        perishables += search_catalog_products("", category="fresh-flowers", limit=1)

        reply = (
            "### 🌿 Freshness & Manufacturing Provenance Protocol\n\n"
            "At **Maison Cread**, freshness and material provenance follow strict pharmaceutical and culinary standards:\n\n"
            "1. **Perishable Harvest Guarantee**:\n"
            "   • *Wild Catch, Morning Blooms & Organic Fruits* are sourced fresh daily at **05:00 AM**.\n"
            "   • Kept under continuous **0–2°C cryo-insulated cold-chain protection**.\n"
            "   • Every unit carries an immutable **Manufacturing Date (`mfg_date`)**, **Expiry Date (`expiry_date`)**, and lot seal code.\n\n"
            "2. **Zero-Waste Social Charter**:\n"
            "   • Unsold daily perishable inventory is safely hand-delivered at dusk to nourish partner orphanages (*Sunshine Children's Sanctuary*).\n\n"
            "3. **Non-Perishables (Watches, Leather, Fine Gems)**:\n"
            "   • Certified with **Lifetime Provenance & Authenticity Guarantee** (zero artificial expiration).\n\n"
            "Below are live catalog listings with certified shelf-life batches:"
        )

        return {
            "reply": reply,
            "intent": "FRESHNESS_EXPIRY",
            "recommendations": perishables,
            "suggestedPrompts": [
                "Wild Catch & Fresh Flowers",
                "How does Open Box Delivery (OBD) work?",
                "20% Orphanage Micro-Gift Coupon",
                "Find Nearest Atelier"
            ]
        }

    # ------------------------------------------------------------------------
    # 4. STORE LOCATOR & GEODESIC HAWAERSINE LOGISTICS INTENT
    # ------------------------------------------------------------------------
    is_store_intent = any(trigger in lower_msg for trigger in STORE_LOCATOR_TRIGGERS)
    if is_store_intent:
        all_shops = get_all_shops()
        
        # Check if city mentioned
        target_city = None
        for c in ["paris", "london", "tokyo", "mumbai", "delhi", "bengaluru", "bangalore", "grasse", "new york"]:
            if c in lower_msg:
                target_city = "Bengaluru" if c == "bangalore" else c.title()
                break

        matched_shops = []
        if target_city:
            matched_shops = [s for s in all_shops if target_city.lower() in (s.get("city") or "").lower() or target_city.lower() in (s.get("location") or "").lower()]
        if not matched_shops:
            matched_shops = all_shops[:4]

        store_bullets = "\n".join([
            f"• **{s['name']}** — {s.get('address') or s['location']}, {s.get('city', '')}\n"
            f"  *GPS*: `{s.get('latitude', 0):.4f}°N, {s.get('longitude', 0):.4f}°E` • *Hours*: {s.get('operating_hours', '10 AM - 8 PM')} • *Phone*: {s.get('phone', 'N/A')}"
            for s in matched_shops
        ])

        reply = (
            f"### 🏛️ Sovereign Partner Ateliers & Boutiques\n\n"
            f"Maison Cread operates a global network of **{len(all_shops)} certified ateliers** equipped with sub-millimeter inspection vaults and high-speed dispatch hubs:\n\n"
            f"{store_bullets}\n\n"
            f"**Geodesic Distribution SLA**:\n"
            f"• **< 15 km**: *Instant 2-Hour White-Glove Courier*\n"
            f"• **15 – 50 km**: *Same-Day Evening Express*\n"
            f"• **50 – 500 km**: *Next-Day Priority Vault Transit*\n"
            f"• **> 500 km**: *2–3 Business Days Global Insured Air*"
        )

        return {
            "reply": reply,
            "intent": "STORE_LOCATOR",
            "storeCards": matched_shops,
            "action": {
                "type": "SHOW_STORES",
                "city": target_city or "Global",
                "stores": matched_shops
            },
            "suggestedPrompts": [
                "Track an Order",
                "Paris Flagship Boutiques",
                "London Bond Street Atelier",
                "Mumbai & Delhi Hubs"
            ]
        }

    # ------------------------------------------------------------------------
    # 5. OPEN BOX DELIVERY (OBD) & FORENSIC AUTHENTICITY INTENT
    # ------------------------------------------------------------------------
    is_obd_intent = any(trigger in lower_msg for trigger in OBD_AUTHENTICITY_TRIGGERS)
    if is_obd_intent:
        reply = (
            "### 🛡️ Sovereign Open Box Delivery (OBD) Protocol\n\n"
            "At Maison Cread, customer trust is non-negotiable. Every high-value timepiece, rare botanical, "
            "and bespoke leather piece is safeguarded by the **Mandatory OBD Protocol**:\n\n"
            "1. **Pre-Dispatch Forensic Verification**:\n"
            "   Dual-layer sub-millimeter inspection and non-destructive spectroscopy certify authentic materials and serial numbers.\n\n"
            "2. **Open Box Handover in Your Presence**:\n"
            "   Our armored courier breaks the tamper-evident cryo seal **in front of you** before you sign the digital custody handover.\n\n"
            "3. **Zero Risk Guarantee**:\n"
            "   If any detail does not match sovereign perfection, you may reject the piece on the spot with an instant 100% custodial escrow refund.\n\n"
            "4. **Lloyd's Insured Escrow**:\n"
            "   All consignments are fully insured against transit loss or damage up to ₹5,00,00,000."
        )

        return {
            "reply": reply,
            "intent": "OBD_POLICY",
            "suggestedPrompts": [
                "Track an Order",
                "Browse Certified Timepieces",
                "20% Hope Angel Discount",
                "My Account & Orders"
            ]
        }

    # ------------------------------------------------------------------------
    # 6. CHARITY MICRO-PLEDGE & 20% REWARD COUPON INTENT
    # ------------------------------------------------------------------------
    is_charity_coupon_intent = any(trigger in lower_msg for trigger in CHARITY_COUPON_TRIGGERS)
    if is_charity_coupon_intent:
        reply = (
            "### 🎁 Maison Hope Angel 20% Reward Protocol\n\n"
            "When you checkout, you have the option to sponsor fresh breakfast fruits and floral cheer for children at **Sunshine Children's Sanctuary**:\n\n"
            "• **₹50 Micro-Gift**: Funds 1 fresh morning fruit pack.\n"
            "• **₹100 Cheer Pack**: Funds breakfast fruit + study hall bouquet.\n"
            "• **₹250 Weekly Care**: Fully sponsors a child's fresh nutritional produce for a week.\n\n"
            "✨ **Your Immediate Concession**:\n"
            "As our token of gratitude, use exclusive reward coupon code **`HOPE-BLOOM-20`** at checkout for **20% OFF** your entire acquisition!"
        )

        return {
            "reply": reply,
            "intent": "CHARITY_COUPON",
            "action": {
                "type": "APPLY_COUPON",
                "code": "HOPE-BLOOM-20"
            },
            "suggestedPrompts": [
                "Apply HOPE-BLOOM-20",
                "Explore Curated Collection",
                "Fresh Flowers & Fruits",
                "Track an Order"
            ]
        }

    # ------------------------------------------------------------------------
    # 7. BNS (BRIDGE NUMBERING SERVICE) ZERO-KNOWLEDGE PHONE SHIELD
    # ------------------------------------------------------------------------
    is_bns_intent = any(trigger in lower_msg for trigger in BNS_TRIGGERS)
    if is_bns_intent:
        reply = (
            "### 🛡️ BNS (Bridge Numbering Service) Privacy Shield\n\n"
            "Your privacy is protected by our zero-knowledge telecommunications airgap:\n\n"
            "• **True Number Never Exposed**: Drivers, couriers, and third-party logistics agents never receive your actual phone number.\n"
            "• **Encrypted Virtual Bridge**: All delivery calls and dispatch coordination route through disposable, encrypted virtual hotline numbers.\n"
            "• **One-Time Verification PIN**: High-value handovers require a short-lived 6-digit PIN minted exclusively in your client app."
        )

        return {
            "reply": reply,
            "intent": "BNS_SHIELD",
            "suggestedPrompts": [
                "Open Box Delivery (OBD)",
                "Track an Order",
                "My Account & Orders"
            ]
        }

    # ------------------------------------------------------------------------
    # 8. PRODUCT SEARCH & CURATED RECOMMENDATION
    # ------------------------------------------------------------------------
    detected_cat = None
    for cat_key, aliases in CATEGORY_MAP.items():
        if any(a in lower_msg for a in aliases):
            detected_cat = cat_key
            break

    # Search products matching query and/or category
    search_q = user_msg if not detected_cat else ""
    matched_products = search_catalog_products(search_q, category=detected_cat, limit=4)

    if not matched_products and detected_cat:
        matched_products = search_catalog_products("", category=detected_cat, limit=4)

    if not matched_products:
        matched_products = search_catalog_products("classic", limit=4)

    if matched_products:
        cat_title = (detected_cat or "Curated").replace("-", " ").title()
        product_bullets = "\n".join([
            f"• **{p['title']}** — ₹{p['price']:,}\n"
            f"  *Supplying Atelier*: {p['shopName']} • *Freshness/Mfg*: {p['manufacturingDate']}"
            + (f" (*Expires*: `{p['expiryDate']}`)" if p['isPerishable'] and p['expiryDate'] else " (*Lifetime Provenance*)")
            for p in matched_products[:3]
        ])

        reply = (
            f"### ✨ {cat_title} Selections from Registered Maisons\n\n"
            f"Here are handpicked creations matching your inquiry:\n\n"
            f"{product_bullets}\n\n"
            f"Each item is certified by our supplying ateliers. You can add them to your shopping bag or inspect forensic certificates below."
        )

        return {
            "reply": reply,
            "intent": "PRODUCT_RECOMMENDATIONS",
            "recommendations": matched_products,
            "action": {
                "type": "RECOMMEND_PRODUCTS",
                "category": detected_cat or "all",
                "products": matched_products
            },
            "suggestedPrompts": [
                "Add to Bag",
                "Check Freshness & Expiry Dates",
                "Nearby Ateliers & Pickup",
                "Track an Order"
            ]
        }

    # ------------------------------------------------------------------------
    # 9. GENERAL CONCIERGE FALLBACK
    # ------------------------------------------------------------------------
    reply = (
        "I am your **Maison Cread AI Concierge**, engineered to assist collectors and connoisseurs.\n\n"
        "Here is how I can assist you right now:\n"
        "• **Track Any Order**: Enter your Unique Order ID (`MC-ORD-2026-XXXXX`).\n"
        "• **Personal Account & Vault**: Check order history and private credentials (authentication required).\n"
        "• **Freshness & Provenance**: Inquire about 05:00 AM harvest blooms, catch, organic fruits, and expiry dates.\n"
        "• **Atelier Network**: Locate nearest boutiques across Paris, London, Tokyo, Mumbai, Delhi, and Bengaluru.\n"
        "• **Open Box Delivery (OBD)**: Learn about sub-millimeter inspection protocols and tamper-evident guarantees."
    )

    return {
        "reply": reply,
        "intent": "GENERAL_CONCIERGE",
        "suggestedPrompts": [
            "Track an Order (MC-ORD-...)",
            "My Account & Orders",
            "Perishables & Expiry Dates",
            "Find Nearest Atelier",
            "Open Box Delivery (OBD)",
            "20% Hope Angel Coupon"
        ]
    }

