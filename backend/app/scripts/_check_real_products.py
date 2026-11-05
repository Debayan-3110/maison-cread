import sqlite3, json
conn = sqlite3.connect('backend/ecommerce.db')
# Check some real API products
rows = conn.execute("SELECT id, title, category, price, thumbnail, source_id FROM products WHERE source_id IS NOT NULL LIMIT 10").fetchall()
for r in rows:
    print(f"ID:{r[0]} | {r[1][:40]:<40} | {r[2]:<20} | ${r[3]:<8} | img:{r[4][:40]} | src:{r[5]}")
