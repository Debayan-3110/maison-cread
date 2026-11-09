import urllib.request

urls = [
    # Fruits
    "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1532704868953-d85f241e192c?w=800&auto=format&fit=crop&q=80",
    # Flowers
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
    # Fish & Seafood
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559742811-822873691df8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1559737558-245cb38971f4?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80",
]

failed = 0
for u in urls:
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as r:
            if r.status != 200:
                print(f"Non-200: {u}")
                failed += 1
    except Exception as e:
        print(f"Failed: {u}: {e}")
        failed += 1

print(f"Tested {len(urls)} URLs. Failed: {failed}")

