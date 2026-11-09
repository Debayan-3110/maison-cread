"""
Migrates catalog and schemas to CockroachDB Labs Storage.
"""
import os
import sys
import json
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
ROOT_ENV = ROOT_DIR / ".env"
load_dotenv(ROOT_ENV)

from backend.cockroach_service import get_cockroach_connection, get_cockroach_connection_string

def migrate():
    conn_str = get_cockroach_connection_string()
    if not conn_str:
        print("ERROR: CockroachDB cluster host or connection string not provided in .env!")
        return False
    
    print(f"Connecting to CockroachDB: {conn_str.split('@')[-1] if '@' in conn_str else conn_str}...")
    conn = get_cockroach_connection()
    if not conn:
        print("Failed to connect to CockroachDB.")
        return False
    
    with conn:
        with conn.cursor() as cur:
            # 1. Create tables in CockroachDB
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT8 PRIMARY KEY DEFAULT unique_rowid(),
                email STRING UNIQUE NOT NULL,
                password_hash STRING NOT NULL,
                full_name STRING,
                address STRING,
                avatar STRING,
                is_verified INT2 DEFAULT 0,
                verification_token STRING,
                verification_token_expires_at STRING,
                reset_token STRING,
                reset_token_expires_at STRING,
                two_factor_secret STRING,
                two_factor_enabled INT2 DEFAULT 0,
                two_factor_backup_codes STRING,
                failed_login_attempts INT2 DEFAULT 0,
                lockout_until STRING,
                created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
                updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
            );

            CREATE TABLE IF NOT EXISTS orders (
                id STRING PRIMARY KEY,
                user_id INT8,
                order_date STRING,
                items_json STRING,
                shipping_json STRING,
                payment_json STRING,
                summary_json STRING,
                status STRING DEFAULT 'placed',
                estimated_delivery STRING,
                created_at TIMESTAMPTZ DEFAULT clock_timestamp()
            );

            CREATE TABLE IF NOT EXISTS products (
                id INT8 PRIMARY KEY,
                source_id STRING,
                sku STRING,
                slug STRING,
                title STRING,
                description STRING,
                currency STRING DEFAULT 'USD',
                price NUMERIC,
                mrp NUMERIC,
                cost_price NUMERIC,
                discount_percentage NUMERIC DEFAULT 0,
                category STRING,
                category_name STRING,
                brand STRING,
                thumbnail STRING,
                images JSONB,
                tags JSONB,
                specs JSONB,
                rating NUMERIC DEFAULT 0,
                review_count INT4 DEFAULT 0,
                stock INT4 DEFAULT 100,
                status STRING DEFAULT 'active',
                weight_g INT4 DEFAULT 250,
                hsn_code STRING,
                warranty_months INT4,
                is_serialized INT2 DEFAULT 0,
                is_obd_required INT2 DEFAULT 0,
                is_fragile INT2 DEFAULT 0,
                is_bulky INT2 DEFAULT 0,
                is_returnable INT2 DEFAULT 1,
                created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
                updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
            );
            """)
            print("CockroachDB tables created successfully.")

            # 2. Check if products exist in SQLite or Neon to copy over
            import sqlite3
            sqlite_path = Path(__file__).resolve().parent / "ecommerce.db"
            if sqlite_path.exists():
                sconn = sqlite3.connect(sqlite_path)
                sconn.row_factory = sqlite3.Row
                scur = sconn.cursor()
                scur.execute("SELECT * FROM products ORDER BY id")
                rows = scur.fetchall()
                print(f"Found {len(rows)} products to sync to CockroachDB...")
                
                for r in rows:
                    rd = dict(r)
                    cur.execute("""
                    UPSERT INTO products (
                        id, source_id, sku, slug, title, description, currency, price, mrp,
                        discount_percentage, category, category_name, brand, thumbnail, images,
                        tags, specs, rating, review_count, stock, status
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s
                    );
                    """, (
                        rd.get('id'), rd.get('source_id'), rd.get('sku'), rd.get('slug'),
                        rd.get('title'), rd.get('description'), rd.get('currency', 'USD'),
                        rd.get('price'), rd.get('mrp'), rd.get('discount_percentage', 0),
                        rd.get('category'), rd.get('category_name'), rd.get('brand'),
                        rd.get('thumbnail'), json.dumps(json.loads(rd['images'])) if rd.get('images') else '[]',
                        json.dumps(json.loads(rd['tags'])) if rd.get('tags') else '[]',
                        json.dumps(json.loads(rd['specs'])) if rd.get('specs') else '{}',
                        rd.get('rating', 0), rd.get('review_count', 0), rd.get('stock', 100),
                        rd.get('status', 'active')
                    ))
                sconn.close()
                print(f"Synced {len(rows)} products into CockroachDB storage!")

            cur.execute("SELECT COUNT(*) FROM products")
            total = cur.fetchone()["count"]
            print(f"CockroachDB verification: {total} products active.")

    conn.close()
    return True

if __name__ == "__main__":
    migrate()

