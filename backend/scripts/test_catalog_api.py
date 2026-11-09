import urllib.request
import json

def test_api():
    try:
        with urllib.request.urlopen('http://127.0.0.1:8000/api/categories') as resp:
            categories = json.loads(resp.read().decode('utf-8'))
        print("API /api/categories count:", len(categories))
        for c in categories:
            slug = c.get('slug')
            name = c.get('name')
            cnt = c.get('product_count', 0)
            print(f"  - {slug}: {name} ({cnt} products)")
    except Exception as e:
        print("Error fetching categories:", e)

    try:
        with urllib.request.urlopen('http://127.0.0.1:8000/api/products?limit=5') as resp:
            data = json.loads(resp.read().decode('utf-8'))
        print("\nAPI /api/products total:", data.get('total'))
        p0 = data['items'][0]
        print(f"Item #1 Title: {p0['title']}")
        print(f"Item #1 Price: ₹{p0['price']} (Currency: {p0['currency']})")
        print(f"Item #1 Thumbnail: {p0['thumbnail'][:80]}...")
        print(f"Item #1 Specs: {p0.get('specs')}")
        print(f"Item #1 Tags: {p0.get('tags')}")
    except Exception as e:
        print("Error fetching products:", e)

if __name__ == '__main__':
    test_api()

