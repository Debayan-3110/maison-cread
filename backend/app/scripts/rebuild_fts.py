import sqlite3
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
DB_PATH = ROOT / "backend" / "ecommerce.db"
ROOT_DB_PATH = ROOT / "ecommerce.db"

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

# Check total count in products
cur.execute("SELECT COUNT(*), MIN(id), MAX(id) FROM products")
row = cur.fetchone()
print(f"Products in DB: count={row[0]}, min_id={row[1]}, max_id={row[2]}")

# Rebuild FTS5 properly
print("Rebuilding FTS5...")
cur.execute("DROP TABLE IF EXISTS products_fts;")
cur.execute("""
    CREATE VIRTUAL TABLE products_fts USING fts5(
        title, description, category, category_name, brand,
        content=products, content_rowid=id
    );
""")
cur.execute("INSERT INTO products_fts(products_fts) VALUES('rebuild');")
conn.commit()
print("FTS5 table successfully created and rebuilt!")

# Test FTS5 query
cur.execute("SELECT rowid, title FROM products_fts WHERE products_fts MATCH 'Mangoes' LIMIT 3;")
print("Test FTS5 search for 'Mangoes':", cur.fetchall())

cur.execute("SELECT rowid, title FROM products_fts WHERE products_fts MATCH 'Salmon' LIMIT 3;")
print("Test FTS5 search for 'Salmon':", cur.fetchall())

conn.close()

# Copy to root DB
shutil.copy2(DB_PATH, ROOT_DB_PATH)
print("Copied to root DB successfully.")

