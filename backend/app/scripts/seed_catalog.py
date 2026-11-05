#!/usr/bin/env python3
"""
Seed Catalog Script:
Seeds both the baseline 13 legacy products (IDs 1-13) and N high-velocity marketplace products (IDs 14+)
into backend/ecommerce.db, with FTS5 search indexing and composite indexes.
"""

import json
import os
import random
import sqlite3
import sys
import time
from pathlib import Path

# Ensure project root is in sys.path
_project_root = Path(__file__).resolve().parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

# Legacy 13 products baseline
LEGACY_PRODUCTS = [
    {
        "id": 1,
        "title": "ShopCread Phone 15 Pro Max",
        "description": "Titanium design, A17 Pro chip, customizable Action button, 48MP main camera system with 5x optical zoom.",
        "category": "smartphones",
        "price": 1499.99,
        "discountPercentage": 12.5,
        "rating": 4.9,
        "stock": 24,
        "brand": "ShopCread Tech",
        "thumbnail": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 2,
        "title": "Aura Ultra Slim Book 16\"",
        "description": "Ultra-thin aluminum chassis, M3 Ultra CPU, 32GB Unified RAM, 1TB SSD, 120Hz Liquid Retina XDR display.",
        "category": "laptops",
        "price": 2999.99,
        "discountPercentage": 15.0,
        "rating": 4.8,
        "stock": 14,
        "brand": "Aura Computing",
        "thumbnail": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 3,
        "title": "SoundPulse Pro Active ANC Headphones",
        "description": "Audiophile-grade 40mm beryllium drivers, 45dB hybrid active noise cancellation, 60h playback time, LDAC support.",
        "category": "mobile-accessories",
        "price": 349.99,
        "discountPercentage": 20.0,
        "rating": 4.7,
        "stock": 45,
        "brand": "SoundPulse Audio",
        "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 4,
        "title": "ChronoMaster Heritage Automatic Watch",
        "description": "Swiss automatic movement, sapphire crystal with anti-reflective coating, 316L stainless steel case, 100m water resistance.",
        "category": "mens-watches",
        "price": 1250.00,
        "discountPercentage": 10.0,
        "rating": 4.9,
        "stock": 18,
        "brand": "ChronoMaster Geneve",
        "thumbnail": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 5,
        "title": "Luxe Diamond Halo Pendant Necklace",
        "description": "18K white gold with 1.2 carat certified brilliant-cut diamond halo setting, delicate box chain.",
        "category": "womens-jewellery",
        "price": 2400.00,
        "discountPercentage": 5.0,
        "rating": 5.0,
        "stock": 9,
        "brand": "Atelier Diamant",
        "thumbnail": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 6,
        "title": "Radiance Botanical Rejuvenating Serum",
        "description": "Cold-pressed rosehip seed oil, bakuchiol, and multi-molecular hyaluronic acid for deep skin regeneration.",
        "category": "beauty",
        "price": 85.00,
        "discountPercentage": 15.0,
        "rating": 4.6,
        "stock": 60,
        "brand": "Botanique Lab",
        "thumbnail": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1608248597359-2e11894a8f9d?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 7,
        "title": "Elixir Noir Luxury Eau de Parfum 100ml",
        "description": "Warm spicy notes of Madagascar vanilla, smoky oud, pink pepper, and ambergris.",
        "category": "fragrances",
        "price": 195.00,
        "discountPercentage": 8.0,
        "rating": 4.8,
        "stock": 35,
        "brand": "Maison de Scent",
        "thumbnail": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 8,
        "title": "Mid-Century Modern Lounge Armchair",
        "description": "Solid walnut frame, top-grain Italian cognac leather upholstery, ergonomic high-density foam cushioning.",
        "category": "furniture",
        "price": 980.00,
        "discountPercentage": 12.0,
        "rating": 4.9,
        "stock": 7,
        "brand": "Nordic Living",
        "thumbnail": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 9,
        "title": "Handcrafted Ceramic Sculptural Vase",
        "description": "Artisanal stoneware with textured matte glaze, minimalist organic silhouette inspired by wabi-sabi aesthetics.",
        "category": "home-decoration",
        "price": 120.00,
        "discountPercentage": 10.0,
        "rating": 4.7,
        "stock": 25,
        "brand": "Atelier Terra",
        "thumbnail": "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 10,
        "title": "Aviator Classic Polarized Sunglasses",
        "description": "Ultra-lightweight titanium wireframe, crystal green polarized lenses with 100% UV400 protection.",
        "category": "sunglasses",
        "price": 220.00,
        "discountPercentage": 18.0,
        "rating": 4.8,
        "stock": 30,
        "brand": "AeroOptics",
        "thumbnail": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 11,
        "title": "NextGen Foldable Smartphone 5G",
        "description": "Dual AMOLED 120Hz displays, zero-gap hinge mechanism, Snapdragon 8 Gen 3, triple 50MP pro camera array.",
        "category": "smartphones",
        "price": 1799.00,
        "discountPercentage": 10.0,
        "rating": 4.6,
        "stock": 16,
        "brand": "Apex Mobile",
        "thumbnail": "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 12,
        "title": "Studio Pro Wireless Mechanical Keyboard",
        "description": "CNC aluminum casing, hot-swappable lubricated linear switches, gasket mounted, tri-mode wireless connectivity.",
        "category": "mobile-accessories",
        "price": 210.00,
        "discountPercentage": 14.0,
        "rating": 4.9,
        "stock": 28,
        "brand": "KeyCraft Labs",
        "thumbnail": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 13,
        "title": "Precision 4K Ultra-Wide Studio Monitor 34\"",
        "description": "Nano IPS curved panel, 98% DCI-P3 color accuracy, Thunderbolt 4 96W power delivery, factory calibrated delta E < 2.",
        "category": "laptops",
        "price": 899.00,
        "discountPercentage": 16.0,
        "rating": 4.7,
        "stock": 12,
        "brand": "VisionCore",
        "thumbnail": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80"
        ]
    }
]

from backend.app.scripts.generate_5lakh_catalog import product_generator


def seed_database(db_path: str, generated_count: int = 10000):
    print(f"\n========================================================")
    print(f"ShopCread Catalog Seeder & Ingestion Engine (SaaS Scale)")
    print(f"Target DB: {db_path}")
    print(f"Legacy SKUs: 13 | Generated High-Velocity SKUs: {generated_count:,}")
    print(f"========================================================\n")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    cur.execute("PRAGMA synchronous = OFF;")
    cur.execute("PRAGMA journal_mode = WAL;")

    # 1. Create Products table
    cur.execute("""
    CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY,
        sku TEXT UNIQUE,
        slug TEXT UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        currency TEXT DEFAULT 'USD',
        price NUMERIC NOT NULL,
        mrp NUMERIC,
        cost_price NUMERIC,
        discount_percentage NUMERIC DEFAULT 0,
        category TEXT,
        brand TEXT,
        thumbnail TEXT,
        images TEXT,
        tags TEXT,
        specs TEXT,
        rating NUMERIC DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        weight_g INTEGER DEFAULT 250,
        hsn_code TEXT,
        warranty_months INTEGER DEFAULT 12,
        is_serialized INTEGER DEFAULT 0,
        is_obd_required INTEGER DEFAULT 0,
        is_fragile INTEGER DEFAULT 0,
        is_bulky INTEGER DEFAULT 0,
        is_returnable INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Insert 13 Legacy Products
    print("[1/4] Seeding 13 baseline premium products...")
    for p in LEGACY_PRODUCTS:
        mrp = round(p["price"] * 1.25, 2)
        cost = round(p["price"] * 0.60, 2)
        cur.execute("""
        INSERT OR REPLACE INTO products (
            id, sku, slug, title, description, currency, price, mrp, cost_price,
            discount_percentage, category, brand, thumbnail, images, tags, specs,
            rating, review_count, stock, status, weight_g, hsn_code, warranty_months,
            is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            p["id"],
            f"SKU-LEGACY-{p['id']:04d}",
            f"product-{p['id']}",
            p["title"],
            p.get("description", ""),
            "USD",
            p["price"],
            mrp,
            cost,
            p.get("discountPercentage", 0),
            p["category"],
            p.get("brand", "ShopCread Premium"),
            p["thumbnail"],
            json.dumps(p.get("images", [p["thumbnail"]])),
            json.dumps([p["category"], "featured", "flagship"]),
            json.dumps({"Brand": p.get("brand", "ShopCread"), "Warranty": "1 Year Official"}),
            p.get("rating", 4.8),
            random.randint(45, 1200),
            p.get("stock", 20),
            "active",
            450,
            "85000000",
            12,
            1 if p["category"] in ("smartphones", "laptops") else 0,
            1 if p["category"] in ("furniture", "laptops") else 0,
            1 if p["category"] in ("home-decoration", "fragrances") else 0,
            1 if p["category"] == "furniture" else 0,
            1
        ))
    conn.commit()
    print("  ✓ 13 baseline products committed.")

    # 3. Insert Generated Marketplace Products
    print(f"\n[2/4] Generating & ingesting {generated_count:,} high-velocity products (IDs 14+)...")
    start_time = time.time()
    batch = []
    insert_sql = """
    INSERT OR REPLACE INTO products (
        id, sku, slug, title, description, currency, price, mrp, cost_price,
        discount_percentage, category, brand, thumbnail, images, tags, specs,
        rating, review_count, stock, status, weight_g, hsn_code, warranty_months,
        is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    gen = product_generator(generated_count)
    inserted = 0

    for idx, p in enumerate(gen, start=14):
        p["id"] = idx
        p["sku"] = f"SKU-{p['category'][:4].upper()}-{idx:07d}"
        p["slug"] = f"{p['category']}-{idx}-{p['sku'].lower()}"

        row = (
            p["id"],
            p["sku"],
            p["slug"],
            p["title"],
            p["description"],
            p["currency"],
            p["price"],
            p["mrp"],
            p["cost_price"],
            p["discount_percentage"],
            p["category"],
            p["brand"],
            p["thumbnail"],
            json.dumps(p["images"]),
            json.dumps(p["tags"]),
            json.dumps(p["specs"]),
            p["rating"],
            p["review_count"],
            p["stock"],
            p["status"],
            p["weight_g"],
            p["hsn_code"],
            p["warranty_months"],
            0, 0, 0, 0, 1
        )
        batch.append(row)

        if len(batch) >= 5000:
            cur.executemany(insert_sql, batch)
            conn.commit()
            inserted += len(batch)
            elapsed = time.time() - start_time
            rate = inserted / elapsed if elapsed > 0 else 0
            sys.stdout.write(f"\r  -> Ingested: {inserted:,}/{generated_count:,} SKUs ({rate:,.0f} SKUs/sec)")
            sys.stdout.flush()
            batch = []

    if batch:
        cur.executemany(insert_sql, batch)
        conn.commit()
        inserted += len(batch)

    print(f"\n  ✓ Successfully ingested {inserted:,} marketplace products in {time.time() - start_time:.2f}s!")

    # 4. Create / Refresh FTS5 Virtual Table
    print("\n[3/4] Initializing SQLite FTS5 Full-Text Search Virtual Table...")
    try:
        cur.execute("DROP TABLE IF EXISTS products_fts;")
        cur.execute("""
        CREATE VIRTUAL TABLE products_fts USING fts5(
            id UNINDEXED,
            title,
            description,
            brand,
            category,
            tags,
            tokenize = 'porter unicode61'
        );
        """)
        cur.execute("""
        INSERT INTO products_fts (id, title, description, brand, category, tags)
        SELECT id, title, description, brand, category, tags FROM products;
        """)
        conn.commit()
        print("  ✓ FTS5 Virtual Table initialized & indexed!")
    except Exception as e:
        print(f"  ⚠ FTS5 table initialization skipped: {e}")

    # 5. Composite B-Tree Indices
    print("\n[4/4] Creating composite B-tree indices for sub-10ms queries...")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_cat_status ON products (category, status);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_brand ON products (brand);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_price ON products (price);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_stock ON products (stock);")
    conn.commit()
    print("  ✓ Indices built successfully.")

    total_prods = cur.execute("SELECT count(*) FROM products;").fetchone()[0]
    conn.close()

    print(f"\n========================================================")
    print(f"🎉 Catalog Seeding Complete! Total SKUs in Database: {total_prods:,}")
    print(f"========================================================\n")


if __name__ == "__main__":
    count = 10000
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass

    target_db = "backend/ecommerce.db"
    seed_database(target_db, generated_count=count)
