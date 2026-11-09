#!/usr/bin/env python3
"""
generate_curated_unique_catalog.py
==================================
Senior Principal Catalog Architecture Engine (10+ Years E-Commerce Experience).
Generates 1,220 authentic, 100% distinct product listings across all 11 departments.

Quality Guarantees:
1. ZERO Duplicate Images: len(set(thumbnails)) == 1,220
2. ZERO Duplicate / Artificial Titles: No fake suffixes like '(Heritage Reserve N° 2)' or repeated templates.
3. Every image is an authentic, title-accurate free-source photograph delivered via Cloudinary edge CDN.
4. Full API Key / Attribute Parity: id, source_id, sku, slug, title, description, currency, price, mrp, discount_percentage, category, category_name, brand, thumbnail, images, tags, specs, hsn_code, gst_rate, rating, review_count, stock, weight_g, shop_id, shop_name, batch_number, etc.
5. All 11 departments have strictly > 100 listings.
"""

import json
import os
import random
import re
import sqlite3
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

# Import all 11 category dataset modules
from backend.scripts.catalog_datasets.fashion import WOMEN_FASHION, MEN_FASHION
from backend.scripts.catalog_datasets.beauty import WOMEN_BEAUTY, MEN_BEAUTY
from backend.scripts.catalog_datasets.electronics import ELECTRONICS_ITEMS
from backend.scripts.catalog_datasets.home_apparels import HOME_APPARELS_ITEMS
from backend.scripts.catalog_datasets.appliances import APPLIANCES_ITEMS
from backend.scripts.catalog_datasets.toys import TOYS_ITEMS
from backend.scripts.catalog_datasets.books import BOOKS_ITEMS
from backend.scripts.catalog_datasets.sports import SPORTS_ITEMS
from backend.scripts.catalog_datasets.food import FOOD_ITEMS
from backend.scripts.catalog_datasets.worship import WORSHIP_ITEMS
from backend.scripts.catalog_datasets.liquor_tobacco import LIQUOR_TOBACCO_ITEMS

DB_PATH = ROOT / "backend" / "ecommerce.db"
CLOUDINARY_CLOUD = "c40zxlko"

CATEGORY_NAMES = {
    "fashion": "Fashion & Luxury Apparel",
    "beauty": "Beauty & Personal Grooming",
    "electronics": "Electronics & High-Fidelity Audio",
    "home-apparels": "Home Apparels & Living Decor",
    "appliances": "Appliances & Precision Kitchen",
    "toys": "Toys, STEM & Collectibles",
    "books": "Rare Books, Classics & Philosophy",
    "sports": "Sports, Fitness & Outdoor Adventure",
    "food": "Gourmet Food, Single Estate Teas & Pantry",
    "worship": "Worship, Temple Bronzes & Spiritual Living",
    "liquor-tobacco": "Liquor, Reserve Spirits & Fine Tobacco"
}

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text).strip('-')

def build_cdn_url(photo_id: str) -> str:
    """Delivers free-source imagery via Cloudinary edge CDN with automatic format/quality negotiation."""
    if not photo_id:
        return ""
    if photo_id.startswith("http://") or photo_id.startswith("https://"):
        raw_url = photo_id
    else:
        # Standard high-resolution Unsplash photo endpoint
        raw_url = f"https://images.unsplash.com/photo-{photo_id}?w=800&auto=format&fit=crop&q=80"
    
    if "res.cloudinary.com" in raw_url:
        return raw_url
    return f"https://res.cloudinary.com/{CLOUDINARY_CLOUD}/image/fetch/c_limit,f_auto,q_auto,w_800/{raw_url}"

def main():
    print("=" * 80)
    print("💎 MAISON CREAD — SENIOR PRINCIPAL CATALOG ARCHITECTURE ENGINE")
    print("=" * 80)
    print("Cloudinary Cloud Name:", CLOUDINARY_CLOUD)
    print("Target SQLite Database:", DB_PATH)

    # 1. Collect all category listings
    departments = [
        ("fashion", WOMEN_FASHION + MEN_FASHION),            # 120 items
        ("beauty", WOMEN_BEAUTY + MEN_BEAUTY),               # 110 items
        ("electronics", ELECTRONICS_ITEMS),                 # 110 items
        ("home-apparels", HOME_APPARELS_ITEMS),             # 110 items
        ("appliances", APPLIANCES_ITEMS),                   # 110 items
        ("toys", TOYS_ITEMS),                               # 110 items
        ("books", BOOKS_ITEMS),                             # 110 items
        ("sports", SPORTS_ITEMS),                           # 110 items
        ("food", FOOD_ITEMS),                               # 110 items
        ("worship", WORSHIP_ITEMS),                         # 110 items
        ("liquor-tobacco", LIQUOR_TOBACCO_ITEMS)            # 110 items (55 Imp + 55 Dom)
    ]

    total_expected = sum(len(items) for _, items in departments)
    print(f"Loaded 11 Departments. Total Listings to ingest: {total_expected:,}")

    # 2. Strict Pre-Ingestion Assertions
    all_titles = []
    all_photo_ids = []
    all_cdn_urls = []

    for cat_slug, items in departments:
        assert len(items) > 100, f"Violation: Category {cat_slug} has only {len(items)} items, must be > 100!"
        for item in items:
            title, desc, price, mrp, brand, subcat, photo_id, tags, specs = item
            all_titles.append(title)
            all_photo_ids.append(photo_id)
            all_cdn_urls.append(build_cdn_url(photo_id))

    assert len(all_titles) == total_expected, "Mismatch in total titles count"
    assert len(set(all_titles)) == total_expected, f"Duplicate titles found! Unique: {len(set(all_titles))} / {total_expected}"
    assert len(set(all_photo_ids)) == total_expected, f"Duplicate photo IDs found! Unique: {len(set(all_photo_ids))} / {total_expected}"
    assert len(set(all_cdn_urls)) == total_expected, f"Duplicate CDN URLs found! Unique: {len(set(all_cdn_urls))} / {total_expected}"

    print(f"✅ Pre-Ingestion Audit Passed: 100% Unique Titles ({len(set(all_titles))}) & 100% Unique CDN Images ({len(set(all_cdn_urls))})")

    # 3. Connect to Database and Prepare Records
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Clear products table cleanly
    cur.execute("DELETE FROM products;")
    cur.execute("DELETE FROM sqlite_sequence WHERE name='products';")
    conn.commit()

    insert_sql = """
    INSERT INTO products (
        id, source_id, sku, slug, title, description, currency, price, mrp, cost_price,
        discount_percentage, category, category_name, brand, thumbnail, images, tags, specs,
        rating, review_count, stock, status, weight_g, hsn_code, warranty_months,
        is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable,
        created_at, updated_at, shop_id, shop_name, expiry_date, manufacturing_date, batch_number, is_perishable
    ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?
    )
    """

    batch = []
    prod_id = 1
    random.seed(42)  # Deterministic seed for reproducible realistic metadata

    for cat_slug, items in departments:
        cat_name = CATEGORY_NAMES[cat_slug]
        for item in items:
            title, desc, price, mrp, brand, subcat, photo_id, tags, specs = item

            # Calculate financial metrics in INR
            discount = round(((mrp - price) / mrp) * 100, 1) if mrp > price else 0.0
            cost_price = round(price * 0.65, 2)
            sku = f"MC-{cat_slug[:3].upper()}-{prod_id:05d}"
            source_id = f"SRC-{cat_slug[:3].upper()}-{prod_id:04d}"
            slug = f"{slugify(title)}-{prod_id}"

            cdn_thumb = build_cdn_url(photo_id)
            images_list = [cdn_thumb]

            # High-end review scores
            rating = round(random.uniform(4.55, 4.98), 2)
            review_count = random.randint(28, 480)
            stock = random.randint(15, 95)

            # Operational logistics attributes
            is_returnable = 0 if cat_slug in ["liquor-tobacco", "food"] else 1
            is_fragile = 1 if cat_slug in ["liquor-tobacco", "worship", "electronics", "appliances"] else 0
            is_bulky = 1 if cat_slug in ["appliances", "home-apparels"] else 0
            is_perishable = 1 if cat_slug == "food" else 0
            is_serialized = 1 if cat_slug == "electronics" else 0
            is_obd = 1 if cat_slug in ["electronics", "appliances"] else 0
            warranty = 24 if cat_slug in ["electronics", "appliances"] else (12 if cat_slug in ["sports", "toys"] else 0)

            # HSN code extraction from specs or statutory fallback
            hsn = specs.get("HSN") or (
                "6204" if cat_slug == "fashion" else
                "3304" if cat_slug == "beauty" else
                "8518" if cat_slug == "electronics" else
                "6302" if cat_slug == "home-apparels" else
                "8516" if cat_slug == "appliances" else
                "9503" if cat_slug == "toys" else
                "4901" if cat_slug == "books" else
                "9506" if cat_slug == "sports" else
                "0910" if cat_slug == "food" else
                "7418" if cat_slug == "worship" else
                "2208"
            )

            # Realistic item weight in grams
            weight_g = (
                random.randint(350, 1200) if cat_slug == "fashion" else
                random.randint(150, 600) if cat_slug == "beauty" else
                random.randint(400, 3200) if cat_slug == "electronics" else
                random.randint(800, 4500) if cat_slug == "home-apparels" else
                random.randint(1500, 9500) if cat_slug == "appliances" else
                random.randint(300, 3500) if cat_slug == "toys" else
                random.randint(450, 1800) if cat_slug == "books" else
                random.randint(300, 4200) if cat_slug == "sports" else
                random.randint(200, 1500) if cat_slug == "food" else
                random.randint(500, 5500) if cat_slug == "worship" else
                random.randint(750, 2200) # liquor-tobacco
            )

            expiry_date = "2028-12-31" if is_perishable or cat_slug in ["food", "beauty", "liquor-tobacco"] else "Lifetime"

            row = (
                prod_id,
                source_id,
                sku,
                slug,
                title,
                desc,
                "INR",
                price,
                mrp,
                cost_price,
                discount,
                cat_slug,
                cat_name,
                brand,
                cdn_thumb,
                json.dumps(images_list),
                json.dumps(tags),
                json.dumps(specs),
                rating,
                review_count,
                stock,
                "active",
                weight_g,
                hsn,
                warranty,
                is_serialized,
                is_obd,
                is_fragile,
                is_bulky,
                is_returnable,
                "SHOP-MAISON-01",
                "Maison Cread Sovereign Flagship",
                expiry_date,
                "2026-03-01",
                f"BATCH-2026-{prod_id:04d}",
                is_perishable
            )
            batch.append(row)
            prod_id += 1

    print(f"\n[Executing Executemany Batch Insert for {len(batch):,} records...]")
    cur.executemany(insert_sql, batch)
    conn.commit()

    # 4. Rebuild FTS5 Search Virtual Table
    print("[Refreshing FTS5 Full-Text Search Table...]")
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

    # 5. Final Database Verification
    cur.execute("SELECT count(*) FROM products;")
    total_db_count = cur.fetchone()[0]

    cur.execute("SELECT count(DISTINCT title) FROM products;")
    distinct_titles = cur.fetchone()[0]

    cur.execute("SELECT count(DISTINCT thumbnail) FROM products;")
    distinct_thumbnails = cur.fetchone()[0]

    cur.execute("SELECT category, count(*) FROM products GROUP BY category ORDER BY count(*) DESC;")
    category_summary = cur.fetchall()

    print("\n" + "=" * 80)
    print("🏆 FINAL VERIFIED DATABASE AUDIT METRICS:")
    print("=" * 80)
    print(f"  • Total Database Listings: {total_db_count:,} (Expected: {total_expected:,})")
    print(f"  • Distinct Titles:         {distinct_titles:,} (Duplicates: {total_db_count - distinct_titles})")
    print(f"  • Distinct CDN Thumbnails: {distinct_thumbnails:,} (Duplicates: {total_db_count - distinct_thumbnails})")
    print("-" * 80)
    print("  DEPARTMENT BREAKDOWN (Strictly >100 listings per section):")
    for cat, count in category_summary:
        print(f"    - {cat.ljust(20)}: {count:3d} listings [PASS >100]")
    print("=" * 80)

    assert total_db_count == total_expected, "Database count mismatch!"
    assert distinct_titles == total_expected, "Duplicate titles in database!"
    assert distinct_thumbnails == total_expected, "Duplicate thumbnails in database!"

    conn.close()
    print("✨ SUCCESS: Database successfully updated with 1,220 100% unique, curated listings!")

if __name__ == "__main__":
    main()
