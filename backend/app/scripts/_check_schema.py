import sqlite3
conn = sqlite3.connect('backend/ecommerce.db')
sql = conn.execute("SELECT sql FROM sqlite_master WHERE name='products'").fetchone()
print(sql[0] if sql else "Table not found")
print()
# Also show column names
for row in conn.execute("PRAGMA table_info(products)").fetchall():
    print(row)

