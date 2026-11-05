"""
seed_from_api_file.py
======================
Parses backend/api (3 concatenated JSON blobs from different sources)
and upserts ALL real products into backend/ecommerce.db.

Sources detected in backend/api:
  1. Platzi Fake Store (array) — rich category objects, imgur images
  2. FakeStore API (array)     — simple string categories, fakestoreapi images
  3. DummyJSON (object)        — richest data: brand, rating, stock, thumbnail, real CDN images

Run from project root:
    python -m backend.app.scripts.seed_from_api_file
"""

import json
import sqlite3
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent  # project root
API_FILE = ROOT / "backend" / "api"
DB_PATH  = ROOT / "backend" / "ecommerce.db"


# ---------------------------------------------------------------------------
# 1. Split the concatenated file into individual JSON blobs
# ---------------------------------------------------------------------------
def split_blobs(raw: str):
    """
    The file contains two or three top-level JSON values concatenated without
    separator. We split on the boundary between ] and [ or } and [ (after
    whitespace/newlines).
    """
    blobs = []
    pos = 0
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


# ---------------------------------------------------------------------------
# 2. Normalise products from each source
# ---------------------------------------------------------------------------
def normalise_platzi(products: list) -> list:
    out = []
    for p in products:
        cat_obj = p.get("category", {})
        if isinstance(cat_obj, dict):
            cat_name = cat_obj.get("name", "General")
            cat_slug = cat_obj.get("slug", cat_name.lower())
        else:
            cat_name = str(cat_obj)
            cat_slug = cat_name.lower()

        images = p.get("images", [])
        thumbnail = images[0] if images else ""
        slug = p.get("slug", f"platzi-{p['id']}")
        sku  = f"PLZ-{p['id']:05d}"

        out.append({
            "source_id":     f"platzi-{p['id']}",
            "title":         p.get("title", ""),
            "slug":          slug,
            "description":   p.get("description", ""),
            "price":         float(p.get("price", 0)),
            "category":      cat_slug,
            "category_name": cat_name,
            "thumbnail":     thumbnail,
            "images":        json.dumps(images),
            "brand":         "",
            "rating":        0.0,
            "stock":         100,
            "sku":           sku,
        })
    return out


def normalise_fakestore(products: list) -> list:
    out = []
    for p in products:
        cat  = p.get("category", "general")
        slug = re.sub(r"[^a-z0-9]+", "-", cat.lower()).strip("-")
        rating_obj = p.get("rating", {})
        rating = float(rating_obj.get("rate", 0)) if isinstance(rating_obj, dict) else 0.0
        thumbnail = p.get("image", "")
        sku = f"FS-{p['id']:05d}"

        out.append({
            "source_id":     f"fakestore-{p['id']}",
            "title":         p.get("title", ""),
            "slug":          f"fakestore-{slug}-{p['id']}",
            "description":   p.get("description", ""),
            "price":         float(p.get("price", 0)),
            "category":      slug,
            "category_name": cat.title(),
            "thumbnail":     thumbnail,
            "images":        json.dumps([thumbnail]),
            "brand":         "",
            "rating":        rating,
            "stock":         100,
            "sku":           sku,
        })
    return out


def normalise_dummyjson(products: list) -> list:
    out = []
    for p in products:
        cat  = p.get("category", "general")
        slug = re.sub(r"[^a-z0-9]+", "-", cat.lower()).strip("-")

        images_raw = p.get("images", [])
        thumbnail  = p.get("thumbnail", images_raw[0] if images_raw else "")

        rating_raw = p.get("rating", 0)
        try:
            rating = float(rating_raw)
        except Exception:
            rating = 0.0

        sku = p.get("sku", f"DJ-{p['id']:05d}")

        out.append({
            "source_id":     f"dummyjson-{p['id']}",
            "title":         p.get("title", ""),
            "slug":          f"dj-{slug}-{p['id']}",
            "description":   p.get("description", ""),
            "price":         float(p.get("price", 0)),
            "category":      slug,
            "category_name": cat.replace("-", " ").title(),
            "thumbnail":     thumbnail,
            "images":        json.dumps(images_raw),
            "brand":         p.get("brand", ""),
            "rating":        rating,
            "stock":         int(p.get("stock", 50)),
            "sku":           sku,
        })
    return out


# ---------------------------------------------------------------------------
# 3. Ensure the products table has the extra columns we need
# ---------------------------------------------------------------------------
def migrate_db(conn):
    cur = conn.cursor()

    # Add columns that might not exist in older schema
    existing_cols = {row[1] for row in cur.execute("PRAGMA table_info(products)").fetchall()}
    new_cols = {
        "source_id":    "TEXT",
        "category_name":"TEXT",
    }
    for col, definition in new_cols.items():
        if col not in existing_cols:
            try:
                cur.execute(f"ALTER TABLE products ADD COLUMN {col} {definition}")
                print(f"  [migrate] Added column: {col}")
            except Exception as e:
                print(f"  [migrate] Skip {col}: {e}")

    conn.commit()


# ---------------------------------------------------------------------------
# 4. Upsert all products
# ---------------------------------------------------------------------------
INSERT_SQL = """
INSERT OR IGNORE INTO products
    (source_id, title, slug, description, price, category, category_name, thumbnail, images, brand, rating, stock, sku, status)
VALUES
    (:source_id, :title, :slug, :description, :price, :category, :category_name, :thumbnail, :images, :brand, :rating, :stock, :sku, 'active')
"""

UPDATE_SQL = """
UPDATE products SET
    title         = :title,
    description   = :description,
    price         = :price,
    category      = :category,
    category_name = :category_name,
    thumbnail     = :thumbnail,
    images        = :images,
    brand         = :brand,
    rating        = :rating,
    stock         = :stock,
    status        = 'active'
WHERE source_id = :source_id
"""


def seed(conn, products: list, label: str):
    cur = conn.cursor()
    inserted = 0
    updated  = 0
    for p in products:
        cur.execute(INSERT_SQL, p)
        if cur.rowcount > 0:
            inserted += 1
        else:
            cur.execute(UPDATE_SQL, p)
            updated += 1
    conn.commit()
    print(f"  [{label}] Inserted {inserted} new + updated {updated} existing = {inserted+updated} products")


# ---------------------------------------------------------------------------
# 5. Rebuild FTS5 index
# ---------------------------------------------------------------------------
def rebuild_fts(conn):
    cur = conn.cursor()
    try:
        cur.execute("DROP TABLE IF EXISTS products_fts")
        cur.execute("""
            CREATE VIRTUAL TABLE products_fts USING fts5(
                title, description, category, brand,
                content=products, content_rowid=id
            )
        """)
        cur.execute("INSERT INTO products_fts(products_fts) VALUES('rebuild')")
        conn.commit()
        print("  [FTS5] Index rebuilt successfully")
    except Exception as e:
        print(f"  [FTS5] Warning: {e}")


# ---------------------------------------------------------------------------
# 6. Main
# ---------------------------------------------------------------------------
def main():
    print(f"Reading: {API_FILE}")
    raw = API_FILE.read_text(encoding="utf-8", errors="replace")

    print("Splitting JSON blobs...")
    blobs = split_blobs(raw)
    print(f"  Found {len(blobs)} JSON blobs")

    all_products = []

    for i, blob in enumerate(blobs):
        try:
            parsed = json.loads(blob)
        except json.JSONDecodeError as e:
            print(f"  [blob {i+1}] Parse error: {e} — skipping")
            continue

        if isinstance(parsed, list):
            # Could be Platzi or FakeStore
            if parsed and isinstance(parsed[0].get("category"), dict):
                print(f"  [blob {i+1}] Detected: Platzi Fake Store ({len(parsed)} products)")
                all_products.extend(normalise_platzi(parsed))
            else:
                print(f"  [blob {i+1}] Detected: FakeStore API ({len(parsed)} products)")
                all_products.extend(normalise_fakestore(parsed))

        elif isinstance(parsed, dict) and "products" in parsed:
            prods = parsed["products"]
            print(f"  [blob {i+1}] Detected: DummyJSON ({len(prods)} products)")
            all_products.extend(normalise_dummyjson(prods))

        else:
            print(f"  [blob {i+1}] Unknown format — skipping")

    print(f"\nTotal normalised products: {len(all_products)}")

    print(f"Connecting to DB: {DB_PATH}")
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("PRAGMA journal_mode=WAL")

    print("Running migrations...")
    migrate_db(conn)

    print("Seeding products...")
    seed(conn, all_products, "api-file")

    # Count total
    total = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    print(f"\nTotal products in DB: {total}")

    print("Rebuilding FTS5 search index...")
    rebuild_fts(conn)

    conn.close()
    print("\nDone! Database updated with all real API products.")


if __name__ == "__main__":
    main()
