import sqlite3

conn = sqlite3.connect('backend/ecommerce.db')
cur = conn.cursor()
cur.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='products'")
print(cur.fetchone()[0])
conn.close()
