"""
seed_from_api_file.py
======================
Parses backend/api (concatenated JSON blobs from Platzi, FakeStore, and DummyJSON)
and cleanly populates backend/ecommerce.db with all 175 authentic products.
"""

import json
import sqlite3
import re
import sys
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent  # project root
API_FILE = ROOT / "backend" / "api"
DB_PATH  = ROOT / "backend" / "ecommerce.db"
ROOT_DB_PATH = ROOT / "ecommerce.db"


def split_blobs(raw: str):
    blobs = []
    depth = 0
    start = None
    in_str = False
    escape = False

    for i, ch in enumerate(raw):
        if escape:
            escape = False
            continue
        if ch == '\\' and in_str:
            escape = True
            continue
        if ch == '"':
            in_str = not in_str
            continue
        if in_str:
            continue

        if ch in ('{', '['):
            if depth == 0:
                start = i
            depth += 1
        elif ch in ('}', ']'):
            depth -= 1
            if depth == 0 and start is not None:
                blobs.append(raw[start:i+1])
                start = None

    return blobs


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s


def normalise_platzi(products: list, start_id: int = 1) -> list:
    out = []
    # Seed deterministic random for reproducible enriched attributes
    rng = random.Random(42)

    for idx, p in enumerate(products):
        curr_id = start_id + idx
        cat_obj = p.get("category", {})
        if isinstance(cat_obj, dict):
            raw_name = cat_obj.get("name", "General")
            # Strip random UUID if present (e.g. Personal Care_86fd1f...)
            cat_name = re.sub(r"_[0-9a-fA-F]{20,}", "", raw_name).strip()
            cat_slug = slugify(cat_name)
        else:
            cat_name = str(cat_obj).title()
            cat_slug = slugify(cat_name)

        images = p.get("images", [])
        clean_images = [im for im in images if isinstance(im, str) and im.startswith("http")]
        thumbnail = clean_images[0] if clean_images else "https://images.unsplash.com/photo-1523275335684-37898b6baf30"
        if not clean_images:
            clean_images = [thumbnail]

        price = float(p.get("price", 49))
        discount = rng.choice([0, 10, 15, 20, 25]) if price > 30 else 0
        mrp = round(price / (1 - discount / 100), 2) if discount > 0 else price
        rating = round(rng.uniform(4.2, 4.9), 1)
        reviews = rng.randint(15, 180)
        stock = rng.randint(20, 95)

        title = p.get("title", f"Maison Item #{curr_id}").strip()
        slug = p.get("slug") or slugify(title)
        sku = f"PLZ-{curr_id:04d}"

        # Determine brand from title
        first_word = title.split()[0] if title else "Maison"
        brand = first_word if len(first_word) > 2 and first_word not in ("Classic", "New", "The") else "Maison Atelier"

        specs = {
            "origin": "Imported",
            "material": "Premium Grade",
            "warranty": "1 Year Manufacturer Guarantee",
            "returnPolicy": "30-Day Hassle-Free Returns"
        }
        tags = [cat_slug, brand.lower(), "atelier", "featured"]

        out.append({
            "id": curr_id,
            "source_id": f"platzi-{p['id']}",
            "sku": sku,
            "slug": slug,
            "title": title,
            "description": p.get("description", "").strip(),
            "currency": "USD",
            "price": price,
            "mrp": mrp,
            "discount_percentage": discount,
            "category": cat_slug,
            "category_name": cat_name,
            "brand": brand,
            "thumbnail": thumbnail,
            "images": json.dumps(clean_images),
            "tags": json.dumps(tags),
            "specs": json.dumps(specs),
            "rating": rating,
            "review_count": reviews,
            "stock": stock,
            "status": "active"
        })
    return out


def normalise_fakestore(products: list, start_id: int) -> list:
    out = []
    rng = random.Random(84)

    for idx, p in enumerate(products):
        curr_id = start_id + idx
        raw_cat = p.get("category", "general")
        cat_lower = raw_cat.lower().strip()

        if "women" in cat_lower and "cloth" in cat_lower:
            cat_slug = "womens-clothing"
            cat_name = "Women's Clothing"
        elif "men" in cat_lower and "cloth" in cat_lower:
            cat_slug = "mens-clothing"
            cat_name = "Men's Clothing"
        elif "jewel" in cat_lower:
            cat_slug = "jewelery"
            cat_name = "Jewelry"
        elif "elect" in cat_lower:
            cat_slug = "electronics"
            cat_name = "Electronics"
        else:
            cat_slug = slugify(raw_cat)
            cat_name = raw_cat.title()

        thumbnail = p.get("image", "")
        images = [thumbnail] if thumbnail else []

        rating_obj = p.get("rating", {})
        if isinstance(rating_obj, dict):
            rating = float(rating_obj.get("rate", 4.5))
            reviews = int(rating_obj.get("count", 40))
        else:
            rating = 4.5
            reviews = 40

        price = float(p.get("price", 50))
        discount = rng.choice([0, 10, 15, 20]) if price > 40 else 0
        mrp = round(price / (1 - discount / 100), 2) if discount > 0 else price
        stock = rng.randint(25, 120)

        title = p.get("title", "").strip()
        slug = f"fs-{slugify(title)[:40]}-{curr_id}"
        sku = f"FS-{curr_id:04d}"

        first_word = title.split()[0]
        brand = first_word if first_word not in ("Mens", "Womens", "Solid", "Rain") else "Artisan Collection"

        specs = {
            "origin": "Direct Authenticated",
            "condition": "Brand New with Tags",
            "warranty": "Standard Warranty",
            "returnPolicy": "30-Day Easy Returns"
        }
        tags = [cat_slug, brand.lower(), "curated"]

        out.append({
            "id": curr_id,
            "source_id": f"fakestore-{p['id']}",
            "sku": sku,
            "slug": slug,
            "title": title,
            "description": p.get("description", "").strip(),
            "currency": "USD",
            "price": price,
            "mrp": mrp,
            "discount_percentage": discount,
            "category": cat_slug,
            "category_name": cat_name,
            "brand": brand,
            "thumbnail": thumbnail,
            "images": json.dumps(images),
            "tags": json.dumps(tags),
            "specs": json.dumps(specs),
            "rating": rating,
            "review_count": reviews,
            "stock": stock,
            "status": "active"
        })
    return out


def normalise_dummyjson(products: list, start_id: int) -> list:
    out = []

    for idx, p in enumerate(products):
        curr_id = start_id + idx
        raw_cat = p.get("category", "general")
        cat_slug = slugify(raw_cat)
        cat_name = raw_cat.replace("-", " ").title()

        images_raw = p.get("images", [])
        thumbnail = p.get("thumbnail") or (images_raw[0] if images_raw else "")
        if not images_raw and thumbnail:
            images_raw = [thumbnail]

        price = float(p.get("price", 0))
        discount = float(p.get("discountPercentage", 0))
        mrp = round(price / (1 - discount / 100), 2) if discount > 0 else price

        rating = float(p.get("rating", 4.5))
        reviews_list = p.get("reviews", [])
        review_count = len(reviews_list) if reviews_list else 25
        stock = int(p.get("stock", 50))
        brand = p.get("brand") or "Maison Studio"
        sku = p.get("sku") or f"DJ-{curr_id:04d}"

        title = p.get("title", "").strip()
        slug = f"dj-{slugify(title)[:40]}-{curr_id}"

        specs = {
            "weight": f"{p.get('weight', 1)} kg",
            "dimensions": p.get("dimensions", {}),
            "warranty": p.get("warrantyInformation", "1 Year Warranty"),
            "shipping": p.get("shippingInformation", "Standard 3-5 days delivery"),
            "returnPolicy": p.get("returnPolicy", "30-Day returns")
        }

        tags = p.get("tags", [cat_slug, brand.lower()])

        out.append({
            "id": curr_id,
            "source_id": f"dummyjson-{p['id']}",
            "sku": sku,
            "slug": slug,
            "title": title,
            "description": p.get("description", "").strip(),
            "currency": "USD",
            "price": price,
            "mrp": mrp,
            "discount_percentage": discount,
            "category": cat_slug,
            "category_name": cat_name,
            "brand": brand,
            "thumbnail": thumbnail,
            "images": json.dumps(images_raw),
            "tags": json.dumps(tags),
            "specs": json.dumps(specs),
            "rating": rating,
            "review_count": review_count,
            "stock": stock,
            "status": "active"
        })
    return out


def reset_and_seed_database(conn: sqlite3.Connection, products: list):
    cur = conn.cursor()

    # Drop old FTS if exists
    cur.execute("DROP TABLE IF EXISTS products_fts")

    # Drop and recreate products table
    cur.execute("DROP TABLE IF EXISTS products")
    cur.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id TEXT,
        sku TEXT,
        slug TEXT,
        title TEXT,
        description TEXT,
        currency TEXT DEFAULT 'USD',
        price NUMERIC,
        mrp NUMERIC,
        cost_price NUMERIC,
        discount_percentage NUMERIC DEFAULT 0,
        category TEXT,
        category_name TEXT,
        brand TEXT,
        thumbnail TEXT,
        images TEXT,
        tags TEXT,
        specs TEXT,
        rating NUMERIC DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        stock INTEGER DEFAULT 100,
        status TEXT DEFAULT 'active',
        weight_g INTEGER DEFAULT 250,
        hsn_code TEXT,
        warranty_months INTEGER,
        is_serialized INTEGER DEFAULT 0,
        is_obd_required INTEGER DEFAULT 0,
        is_fragile INTEGER DEFAULT 0,
        is_bulky INTEGER DEFAULT 0,
        is_returnable INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Clear products table
    try:
        cur.execute("DELETE FROM products")
    except Exception:
        pass
    try:
        cur.execute("DELETE FROM sqlite_sequence WHERE name='products'")
    except Exception:
        pass

    insert_sql = """
    INSERT INTO products (
        id, source_id, sku, slug, title, description, currency, price, mrp,
        discount_percentage, category, category_name, brand, thumbnail, images,
        tags, specs, rating, review_count, stock, status, weight_g,
        is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable,
        created_at, updated_at
    ) VALUES (
        :id, :source_id, :sku, :slug, :title, :description, :currency, :price, :mrp,
        :discount_percentage, :category, :category_name, :brand, :thumbnail, :images,
        :tags, :specs, :rating, :review_count, :stock, :status, 250,
        0, 0, 0, 0, 1,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    """

    for p in products:
        cur.execute(insert_sql, p)

    conn.commit()
    print(f"  Inserted {len(products)} products into products table.")

    # Create FTS5 virtual table
    try:
        cur.execute("""
            CREATE VIRTUAL TABLE products_fts USING fts5(
                title, description, category, category_name, brand,
                content=products, content_rowid=id
            )
        """)
        cur.execute("INSERT INTO products_fts(products_fts) VALUES('rebuild')")
        conn.commit()
        print("  [FTS5] Search index successfully rebuilt.")
    except Exception as e:
        print(f"  [FTS5] Warning: {e}")


def main():
    print(f"Reading catalog API file: {API_FILE}")
    raw = API_FILE.read_text(encoding="utf-8", errors="replace")

    blobs = split_blobs(raw)
    print(f"Found {len(blobs)} JSON blobs in API file.")

    p1 = normalise_platzi(json.loads(blobs[0]), start_id=1)
    p2 = normalise_fakestore(json.loads(blobs[1]), start_id=len(p1) + 1)
    p3 = normalise_dummyjson(json.loads(blobs[2])["products"], start_id=len(p1) + len(p2) + 1)

    all_products = p1 + p2 + p3
    print(f"Total normalized products from file: {len(all_products)} (Platzi: {len(p1)}, FakeStore: {len(p2)}, DummyJSON: {len(p3)})")

    for db_target in [DB_PATH, ROOT_DB_PATH]:
        print(f"\nSeeding database: {db_target}")
        conn = sqlite3.connect(str(db_target))
        conn.execute("PRAGMA journal_mode=WAL")
        reset_and_seed_database(conn, all_products)
        conn.close()

    print("\n[SUCCESS] Both databases seeded with 100% of products from backend/api!")


if __name__ == "__main__":
    main()
