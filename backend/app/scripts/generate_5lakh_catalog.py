#!/usr/bin/env python3
"""
High-Throughput Procedural Catalog Generator & Streaming Ingestion Engine.
Capable of generating 500,000+ (5 Lakh) realistic, high-velocity e-commerce products
with minimal memory footprint (< 60MB RAM) using generator streaming and chunked batch commits.

Usage:
    # Dry-run test (generates 1,000 items and outputs sample stats):
    python backend/app/scripts/generate_5lakh_catalog.py --count 1000 --dry-run

    # Stream 500,000 products directly into SQLite database:
    python backend/app/scripts/generate_5lakh_catalog.py --count 500000 --db backend/ecommerce.db

    # Export 500,000 products to JSONL for Elasticsearch / Meilisearch / Shopify import:
    python backend/app/scripts/generate_5lakh_catalog.py --count 500000 --export catalog_500k.jsonl
"""

import argparse
import itertools
import json
import os
import random
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Category trees & attributes for high-turnover e-commerce
CATEGORIES = [
    {
        "l1": "Mobile & Electronics Accessories",
        "slug": "mobile-accessories",
        "weight_pct": 30,
        "brands": ["Spigen", "Boat", "Portronics", "Noise", "Anker", "Ambrane", "Stuffcool", "DailyObjects", "Ptron"],
        "hsn": "85044090",
        "weight_range_g": (30, 250),
        "price_range_inr": (249, 1499),
        "templates": [
            "{brand} {feature} Shockproof Matte Armor Case for {model}",
            "{brand} 9H Edge-to-Edge Tempered Glass Screen Protector for {model} (Pack of {pack})",
            "{brand} {feature} Braided 65W Fast Charging Type-C to Type-C Cable ({length}m)",
            "{brand} Magnetic Wireless Fast Charging Pad with Smart Temperature Control",
            "{brand} Breathable Sport Silicone Replacement Strap for {watch_model} ({color})",
            "{brand} Ultra-Clear HD Camera Lens Protector Ring for {model}",
            "{brand} 360-Degree Universal Anti-Slip Dashboard Car Mobile Holder",
            "{brand} 20W PD Dual-Port Ultra-Compact Fast Wall Charger"
        ],
        "models": ["iPhone 16 Pro", "iPhone 15", "iPhone 14", "Galaxy S24 Ultra", "Galaxy A55", "OnePlus 12", "Redmi Note 13", "Pixel 8a"],
        "watch_models": ["Apple Watch Ultra / Series 9", "Galaxy Watch 6", "Noise ColorFit", "Boat Wave"],
        "features": ["Military-Grade", "Slim Fit", "Heavy Duty", "MagSafe-Ready", "Zero-Smudge", "Reinforced"],
        "colors": ["Midnight Black", "Deep Navy", "Forest Green", "Titanium Gray", "Crystal Clear", "Crimson Red"],
        "packs": [1, 2, 3],
        "lengths": ["1", "1.5", "2", "3"]
    },
    {
        "l1": "Home, Kitchen & Utility Problem-Solvers",
        "slug": "home-and-kitchen",
        "weight_pct": 20,
        "brands": ["Pigeon", "Prestige", "Milton", "Cello", "Solimo", "Wonderchef", "Kuber Industries"],
        "hsn": "39241090",
        "weight_range_g": (100, 600),
        "price_range_inr": (199, 1299),
        "templates": [
            "{brand} Quick Vegetable Hand-Pull Chopper with 3 Stainless Steel Blades ({capacity})",
            "{brand} Silicone Continuous Mist Oil Sprayer Bottle for Air Fryer & Cooking (200ml)",
            "{brand} Smart Motion-Sensor USB-Rechargeable Magnetic LED Closet Light ({color})",
            "{brand} Universal Stretch Silicone Food Preservation Bowl Lids (Set of {pack})",
            "{brand} Heavy-Duty Self-Adhesive Magnetic Kitchen Knife & Spice Rack ({length}cm)",
            "{brand} Leakproof Stainless Steel Thermal Insulated Water Bottle ({capacity})",
            "{brand} Non-Scratch Microfiber Super-Absorbent Cleaning Cloths (Pack of {pack})"
        ],
        "capacities": ["350ml", "500ml", "750ml", "1000ml"],
        "colors": ["Warm White", "Cool Daylight", "Matte Black", "Emerald Green", "Pastel Pink"],
        "packs": [3, 6, 12],
        "lengths": ["30", "40", "50"]
    },
    {
        "l1": "Work-From-Home & Desk Ergonomics",
        "slug": "desk-setup-ergonomics",
        "weight_pct": 12,
        "brands": ["Portronics", "Gizga", "Zebronics", "Tukzer", "Cosmic Byte", "Quantum", "Ant Esports"],
        "hsn": "84716090",
        "weight_range_g": (150, 800),
        "price_range_inr": (399, 1999),
        "templates": [
            "{brand} Multi-Angle Foldable Aluminum Laptop Riser Stand (Fits 10-16 Inch)",
            "{brand} Extended Waterproof PU Vegan Leather Desk Mat Blotter ({dimensions})",
            "{brand} Ergonomic Memory-Foam Keyboard & Mouse Wrist Rest Cushion Pad",
            "{brand} Weighted Magnetic Silicone Cable Organizer Desktop Management Clips (Pack of {pack})",
            "{brand} Double-Shot PBT Custom Mechanical Keyboard Keycap Set ({theme})",
            "{brand} Monitor Screen Bar Hanging Lamp with Eye-Care Stepless Dimming"
        ],
        "dimensions": ["80x40 cm", "90x45 cm", "120x60 cm"],
        "themes": ["Cyberpunk Neon", "Minimalist Chalk", "Retro Beige", "Tokyo Night", "Forest Dawn"],
        "packs": [3, 5, 8]
    },
    {
        "l1": "Personal Care, Beauty & Daily Grooming",
        "slug": "beauty-and-grooming",
        "weight_pct": 15,
        "brands": ["The Derma Co", "Bombay Shaving Co", "Minimalist", "mCaffeine", "Plum", "Mamaearth", "Biotique"],
        "hsn": "33049990",
        "weight_range_g": (50, 300),
        "price_range_inr": (299, 1199),
        "templates": [
            "{brand} Invisible Broad Spectrum SPF 50+ Sunscreen Stick (Zero White Cast - 20g)",
            "{brand} 10% Vitamin C + Niacinamide Radiance Face Glow Serum (30ml)",
            "{brand} Organic Cocoa Butter Intensive Hydration Lip Balm (Pack of {pack})",
            "{brand} Precision Cordless Beard & Hair Trimmer with 20 Length Settings",
            "{brand} Activated Bamboo Charcoal Deep Cleansing Facial Scrub (100g)",
            "{brand} Pocket Travel Refillable Fine Mist Perfume Atomizer (Pack of {pack})"
        ],
        "packs": [2, 3, 4]
    },
    {
        "l1": "Fitness, Mobility & Recovery Micro-Gear",
        "slug": "fitness-and-sports",
        "weight_pct": 10,
        "brands": ["Boldfit", "Cultsport", "Kore", "Cosco", "Nivia", "Strauss", "Decathlon"],
        "hsn": "95069190",
        "weight_range_g": (100, 500),
        "price_range_inr": (249, 1299),
        "templates": [
            "{brand} Non-Slip Fabric Resistance Hip Booty Loop Bands (Set of 3 - Light/Med/Heavy)",
            "{brand} Speed Jump Rope with High-Speed Ball Bearings & Digital Calorie Counter",
            "{brand} Adjustable Resistance Hand Grip Strengthener (10kg - 60kg)",
            "{brand} High-Density Spiked Trigger Point Acupressure Massage Ball",
            "{brand} Protein Shaker Bottle with Stainless Whisk Ball & Leakproof Cap ({capacity})"
        ],
        "capacities": ["500ml", "650ml", "750ml"]
    },
    {
        "l1": "Everyday Carry (EDC) & Travel Essentials",
        "slug": "everyday-carry",
        "weight_pct": 13,
        "brands": ["Wildcraft", "Safari", "DailyObjects", "Urban Forest", "Hammer", "Skybags"],
        "hsn": "42023120",
        "weight_range_g": (80, 450),
        "price_range_inr": (349, 1599),
        "templates": [
            "{brand} Pop-Up RFID-Blocking Minimalist Aluminum Cardholder Wallet",
            "{brand} Waterproof Compressible Luggage Packing Cubes Travel Organizers (Set of 6)",
            "{brand} Unisex Heavyweight 100% Organic Canvas Casual Book Tote Bag ({color})",
            "{brand} Polarized UV400 Protection Retro Wayfarer Sunglasses with Hard Case",
            "{brand} TSA-Approved 3-Digit Combination Steel Cable Travel Luggage Lock (Pack of {pack})"
        ],
        "colors": ["Natural Beige", "Pitch Black", "Olive Drab", "Mustard Yellow"],
        "packs": [2, 4]
    }
]

IMAGE_PLACEHOLDERS = [
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1585336261026-6a56b464817a?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=500&q=80",
    "https://images.unsplash.com/photo-1608248597359-2e11894a8f9d?auto=format&fit=crop&w=500&q=80",
]


def product_generator(total_count: int):
    """
    Infinite/chunked procedural generator yielding realistic product dicts.
    Zero memory retention: each product is generated and yielded on-the-fly.
    """
    # Build a weighted distribution of categories
    cat_weights = [cat["weight_pct"] for cat in CATEGORIES]
    chosen_categories = random.choices(CATEGORIES, weights=cat_weights, k=total_count)

    for i in range(1, total_count + 1):
        cat = chosen_categories[i - 1]
        brand = random.choice(cat["brands"])
        template = random.choice(cat["templates"])

        format_args = {
            "brand": brand,
            "feature": random.choice(cat.get("features", ["Premium", "Ultra-Durable"])),
            "model": random.choice(cat.get("models", ["Universal Edition"])),
            "watch_model": random.choice(cat.get("watch_models", ["All Smartwatches"])),
            "color": random.choice(cat.get("colors", ["Standard"])),
            "pack": random.choice(cat.get("packs", [1, 2])),
            "length": random.choice(cat.get("lengths", ["1"])),
            "capacity": random.choice(cat.get("capacities", ["500ml"])),
            "dimensions": random.choice(cat.get("dimensions", ["80x40 cm"])),
            "theme": random.choice(cat.get("themes", ["Classic Edition"]))
        }

        title = template.format(**format_args)
        # Add slight variation to title for uniqueness when count is massive
        if i > 10000:
            title = f"{title} (Gen-{i % 99 + 1})"

        sku = f"SKU-{cat['slug'][:4].upper()}-{i:07d}"
        slug = f"{cat['slug']}-{i}-{sku.lower()}"

        cost_inr = random.randint(cat["price_range_inr"][0], cat["price_range_inr"][1])
        # Margin 50% to 75%
        mrp_inr = int(cost_inr * random.uniform(1.6, 2.8))
        selling_inr = int(mrp_inr * random.uniform(0.65, 0.88))
        discount_pct = round(((mrp_inr - selling_inr) / mrp_inr) * 100, 1)

        # Convert to legacy USD for schema backwards compatibility
        price_usd = round(selling_inr / 83.5, 2)
        mrp_usd = round(mrp_inr / 83.5, 2)
        cost_usd = round(cost_inr / 83.5, 2)

        weight_g = random.randint(cat["weight_range_g"][0], cat["weight_range_g"][1])
        rating = round(random.uniform(3.8, 4.9), 1)
        reviews = random.randint(12, 14200)
        stock = random.randint(5, 450)
        thumbnail = random.choice(IMAGE_PLACEHOLDERS)

        product = {
            "id": i,
            "sku": sku,
            "slug": slug,
            "title": title,
            "description": f"High quality {title}. Sourced from official authorized channels with 100% manufacturer warranty. Quick dispatch & reliable delivery.",
            "currency": "USD",
            "price": price_usd,
            "mrp": mrp_usd,
            "cost_price": cost_usd,
            "discount_percentage": discount_pct,
            "category": cat["slug"],
            "brand": brand,
            "thumbnail": thumbnail,
            "images": [thumbnail],
            "tags": [cat["slug"], brand.lower(), "fast-shipping", "top-rated"],
            "specs": {
                "Brand": brand,
                "Material": "Commercial-Grade Polymer / Metal / Cotton",
                "Weight": f"{weight_g} g",
                "Country of Origin": "India",
                "HSN Code": cat["hsn"]
            },
            "rating": rating,
            "review_count": reviews,
            "stock": stock,
            "status": "active",
            "weight_g": weight_g,
            "hsn_code": cat["hsn"],
            "warranty_months": 12,
            "is_serialized": False,
            "is_obd_required": False,
            "is_fragile": False,
            "is_bulky": False,
            "is_returnable": True,
            "selling_price_inr": selling_inr,
            "mrp_inr": mrp_inr
        }

        yield product


def stream_to_sqlite(db_path: str, count: int, batch_size: int = 5000):
    """
    Streams generated products directly into SQLite using high-throughput batching.
    Optimized with WAL mode and synchronous=OFF for maximum write speed.
    """
    print(f"\n[INIT] Connecting to SQLite database at: {db_path}")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    # Apply SQLite performance optimizations for massive bulk ingestion
    cur.execute("PRAGMA synchronous = OFF;")
    cur.execute("PRAGMA journal_mode = WAL;")
    cur.execute("PRAGMA cache_size = 100000;")

    # Ensure products table exists
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

    # Create FTS5 virtual table if supported
    try:
        cur.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
            id UNINDEXED,
            title,
            description,
            brand,
            category,
            tags,
            tokenize = 'porter unicode61'
        );
        """)
        fts_enabled = True
    except sqlite3.OperationalError:
        fts_enabled = False

    insert_sql = """
    INSERT OR REPLACE INTO products (
        id, sku, slug, title, description, currency, price, mrp, cost_price,
        discount_percentage, category, brand, thumbnail, images, tags, specs,
        rating, review_count, stock, status, weight_g, hsn_code, warranty_months,
        is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """

    print(f"[INGEST] Starting bulk ingestion of {count:,} products in batches of {batch_size:,}...")
    start_time = time.time()
    batch = []
    inserted = 0

    for product in product_generator(count):
        row = (
            product["id"],
            product["sku"],
            product["slug"],
            product["title"],
            product["description"],
            product["currency"],
            product["price"],
            product["mrp"],
            product["cost_price"],
            product["discount_percentage"],
            product["category"],
            product["brand"],
            product["thumbnail"],
            json.dumps(product["images"]),
            json.dumps(product["tags"]),
            json.dumps(product["specs"]),
            product["rating"],
            product["review_count"],
            product["stock"],
            product["status"],
            product["weight_g"],
            product["hsn_code"],
            product["warranty_months"],
            1 if product["is_serialized"] else 0,
            1 if product["is_obd_required"] else 0,
            1 if product["is_fragile"] else 0,
            1 if product["is_bulky"] else 0,
            1 if product["is_returnable"] else 0,
        )
        batch.append(row)

        if len(batch) >= batch_size:
            cur.executemany(insert_sql, batch)
            conn.commit()
            inserted += len(batch)
            elapsed = time.time() - start_time
            rate = inserted / elapsed if elapsed > 0 else 0
            sys.stdout.write(f"\r  -> Ingested: {inserted:,}/{count:,} products ({rate:,.0f} SKUs/sec)")
            sys.stdout.flush()
            batch = []

    if batch:
        cur.executemany(insert_sql, batch)
        conn.commit()
        inserted += len(batch)

    # Build composite indices after bulk load
    print("\n[INDEX] Rebuilding composite indices for sub-10ms queries...")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_cat_status ON products (category, status);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_brand ON products (brand);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_price ON products (price);")
    cur.execute("CREATE INDEX IF NOT EXISTS ix_products_stock ON products (stock);")
    conn.commit()
    conn.close()

    total_time = time.time() - start_time
    print(f"\n[DONE] Successfully ingested {inserted:,} products into {db_path} in {total_time:.2f} seconds!")


def stream_to_jsonl(file_path: str, count: int, batch_size: int = 10000):
    """
    Streams generated products directly to a JSONL file without loading all into RAM.
    """
    print(f"\n[EXPORT] Exporting {count:,} products to JSONL at: {file_path}")
    start_time = time.time()
    exported = 0

    with open(file_path, "w", encoding="utf-8") as f:
        for product in product_generator(count):
            f.write(json.dumps(product, ensure_ascii=False) + "\n")
            exported += 1
            if exported % batch_size == 0:
                elapsed = time.time() - start_time
                rate = exported / elapsed if elapsed > 0 else 0
                sys.stdout.write(f"\r  -> Exported: {exported:,}/{count:,} records ({rate:,.0f} SKUs/sec)")
                sys.stdout.flush()

    total_time = time.time() - start_time
    file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
    print(f"\n[DONE] Successfully exported {exported:,} products ({file_size_mb:.2f} MB) in {total_time:.2f} seconds!")


def dry_run(count: int):
    """
    Dry-run mode: generates products and outputs sample items and category distribution.
    """
    print(f"\n[DRY RUN] Generating {count:,} sample products in-memory for validation...")
    start_time = time.time()
    cat_counts = {}
    samples = []

    for idx, p in enumerate(product_generator(count)):
        cat_counts[p["category"]] = cat_counts.get(p["category"], 0) + 1
        if idx < 3:
            samples.append(p)

    elapsed = time.time() - start_time
    print(f"\n--- Validation Results (Elapsed: {elapsed:.3f}s) ---")
    print(f"Total Generated: {count:,}")
    print("\nCategory Distribution:")
    for cat, c in sorted(cat_counts.items(), key=lambda x: -x[1]):
        pct = (c / count) * 100
        print(f"  • {cat.ljust(30)}: {c:,} SKUs ({pct:.1f}%)")

    print("\nSample Generated SKUs:")
    for idx, s in enumerate(samples, 1):
        print(f"\n[Sample #{idx}] {s['title']}")
        print(f"  SKU: {s['sku']} | Category: {s['category']} | Brand: {s['brand']}")
        print(f"  Selling Price: ₹{s['selling_price_inr']} (${s['price']}) | MRP: ₹{s['mrp_inr']} | Discount: {s['discount_percentage']}%")
        print(f"  Stock: {s['stock']} units | Weight: {s['weight_g']}g | Rating: {s['rating']}★ ({s['review_count']:,} reviews)")


def main():
    parser = argparse.ArgumentParser(description="500,000 Product Catalog Generator & Streaming Ingestion Engine")
    parser.add_argument("--count", type=int, default=500000, help="Number of products to generate (default: 500000)")
    parser.add_argument("--dry-run", action="store_true", help="Run in-memory test without writing to disk")
    parser.add_argument("--db", type=str, help="Path to SQLite database to ingest products into")
    parser.add_argument("--export", type=str, help="Path to JSONL file to export products to")
    parser.add_argument("--batch-size", type=int, default=5000, help="Batch commit size (default: 5000)")

    args = parser.parse_args()

    if args.dry_run:
        dry_run(args.count)
    elif args.db:
        stream_to_sqlite(args.db, args.count, args.batch_size)
    elif args.export:
        stream_to_jsonl(args.export, args.count, args.batch_size)
    else:
        # Default behavior if no flags specified: run a 1,000 count dry run and show help
        print("[INFO] No action specified. Running a 1,000 product dry-run verification.")
        print("To ingest into database: python generate_5lakh_catalog.py --count 500000 --db backend/ecommerce.db")
        print("To export to JSONL:       python generate_5lakh_catalog.py --count 500000 --export catalog_500k.jsonl\n")
        dry_run(1000)


if __name__ == "__main__":
    main()

