import sqlite3
conn = sqlite3.connect('backend/ecommerce.db')
cats = conn.execute("SELECT DISTINCT category, COUNT(*) as cnt FROM products WHERE status='active' GROUP BY category ORDER BY cnt DESC LIMIT 30").fetchall()
for c in cats:
    print(c)
print("Total:", conn.execute("SELECT COUNT(*) FROM products").fetchone()[0])
print("Active:", conn.execute("SELECT COUNT(*) FROM products WHERE status='active'").fetchone()[0])
print("Null status:", conn.execute("SELECT COUNT(*) FROM products WHERE status IS NULL").fetchone()[0])

