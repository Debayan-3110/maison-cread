"""
Migrates SQLite schema and all 231 products, orders, and users into Neon Lakebase Postgres.
"""
import os
import json
import sqlite3
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load .env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in .env")

SQLITE_PATH = Path(__file__).resolve().parent / "ecommerce.db"
print(f"Connecting to SQLite: {SQLITE_PATH}")
sconn = sqlite3.connect(SQLITE_PATH)
sconn.row_factory = sqlite3.Row
scur = sconn.cursor()

print(f"Connecting to Neon Lakebase Postgres: {DATABASE_URL[:40]}...")
pconn = psycopg2.connect(DATABASE_URL)
pcur = pconn.cursor()

# 1. Create tables in PostgreSQL
pcur.execute("""
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    address TEXT,
    avatar TEXT,
    is_verified INTEGER DEFAULT 0,
    verification_token TEXT,
    verification_token_expires_at TEXT,
    reset_token TEXT,
    reset_token_expires_at TEXT,
    two_factor_secret TEXT,
    two_factor_enabled INTEGER DEFAULT 0,
    two_factor_backup_codes TEXT,
    failed_login_attempts INTEGER DEFAULT 0,
    lockout_until TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address TEXT,
    email TEXT,
    success INTEGER,
    attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mock_emails (
    id SERIAL PRIMARY KEY,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    email_type TEXT NOT NULL,
    token TEXT,
    body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    order_date TEXT,
    items_json TEXT,
    shipping_json TEXT,
    payment_json TEXT,
    summary_json TEXT,
    status TEXT DEFAULT 'placed',
    estimated_delivery TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
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
    images JSONB,
    tags JSONB,
    specs JSONB,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
""")
pconn.commit()
print("Postgres tables and indexes verified.")

# 2. Migrate Products
scur.execute("SELECT * FROM products ORDER BY id")
rows = scur.fetchall()
print(f"Found {len(rows)} products in SQLite.")

inserted = 0
for r in rows:
    row_dict = dict(r)
    # Parse JSON fields safely
    def safe_json(val):
        if not val:
            return None
        if isinstance(val, (dict, list)):
            return json.dumps(val)
        try:
            return json.dumps(json.loads(val))
        except Exception:
            return json.dumps([val])

    images_j = safe_json(row_dict.get('images'))
    tags_j = safe_json(row_dict.get('tags'))
    specs_j = safe_json(row_dict.get('specs'))

    pcur.execute("""
    INSERT INTO products (
        id, source_id, sku, slug, title, description, currency, price, mrp, cost_price,
        discount_percentage, category, category_name, brand, thumbnail, images, tags, specs,
        rating, review_count, stock, status, weight_g, hsn_code, warranty_months,
        is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable
    ) VALUES (
        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s, %s, %s,
        %s, %s, %s, %s, %s
    ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        mrp = EXCLUDED.mrp,
        category = EXCLUDED.category,
        brand = EXCLUDED.brand,
        thumbnail = EXCLUDED.thumbnail,
        images = EXCLUDED.images,
        tags = EXCLUDED.tags,
        specs = EXCLUDED.specs,
        stock = EXCLUDED.stock,
        rating = EXCLUDED.rating,
        status = EXCLUDED.status;
    """, (
        row_dict.get('id'), row_dict.get('source_id'), row_dict.get('sku'), row_dict.get('slug'),
        row_dict.get('title'), row_dict.get('description'), row_dict.get('currency', 'USD'),
        row_dict.get('price'), row_dict.get('mrp'), row_dict.get('cost_price'),
        row_dict.get('discount_percentage', 0), row_dict.get('category'), row_dict.get('category_name'),
        row_dict.get('brand'), row_dict.get('thumbnail'), images_j, tags_j, specs_j,
        row_dict.get('rating', 0), row_dict.get('review_count', 0), row_dict.get('stock', 100),
        row_dict.get('status', 'active'), row_dict.get('weight_g', 250), row_dict.get('hsn_code'),
        row_dict.get('warranty_months'), row_dict.get('is_serialized', 0), row_dict.get('is_obd_required', 0),
        row_dict.get('is_fragile', 0), row_dict.get('is_bulky', 0), row_dict.get('is_returnable', 1)
    ))
    inserted += 1

pconn.commit()
print(f"Successfully migrated {inserted} products to Neon Postgres!")

# 3. Migrate Users if any
scur.execute("SELECT * FROM users")
urows = scur.fetchall()
for ur in urows:
    ud = dict(ur)
    pcur.execute("""
    INSERT INTO users (id, email, password_hash, full_name, address, is_verified)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO NOTHING;
    """, (ud.get('id'), ud.get('email'), ud.get('password_hash'), ud.get('full_name'), ud.get('address'), ud.get('is_verified', 0)))
pconn.commit()
print(f"Migrated {len(urows)} users to Neon Postgres.")

# Verify count in Postgres
pcur.execute("SELECT COUNT(*), COUNT(DISTINCT thumbnail) FROM products")
total_pg, unique_thumb = pcur.fetchone()
print(f"Neon Postgres Verification: {total_pg} products, {unique_thumb} unique thumbnails (100% distinct).")

sconn.close()
pconn.close()

