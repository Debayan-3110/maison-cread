import sqlite3
from backend.main import app
from backend.app.core.catalog_search import get_search_results

conn = sqlite3.connect('backend/ecommerce.db')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM products')
print('Total products:', cur.fetchone()[0])

cur.execute('SELECT category, category_name, COUNT(*) FROM products GROUP BY category ORDER BY COUNT(*) DESC')
print('\nCategories in DB:')
for r in cur.fetchall():
    print(f'  {r[0]:<20} ({r[1]}): {r[2]} items')

# Test catalog_search function with query
for q in ['hoodie', 'backpack', 'mascara', 'jacket']:
    res = get_search_results(conn, search_query=q, limit=2)
    print(f'\nSearch query "{q}": found {res["total"]} items')
    for p in res["products"]:
        print(f'  [#{p["id"]}] {p["title"]} (${p["price"]}) - cat: {p["category"]}')

conn.close()
