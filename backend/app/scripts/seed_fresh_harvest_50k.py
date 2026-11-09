"""
seed_fresh_harvest_50k.py
=========================
Generates 50,000+ authentic, procedural Fresh Organic products across:
1. Organic Fruits (organic-fruits)
2. Fresh Flowers & Botanicals (fresh-flowers)
3. Fresh Fish & Seafood (fresh-fish)

Features:
- Product-specific verified high-resolution photography
- Farm-to-table timestamps, brix sweetness, cold-chain certifications
- Zero-waste orphanage redistribution metadata
- Streaming batch inserts into SQLite with FTS5 search index update
"""

import sqlite3
import json
import random
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
DB_PATH = ROOT / "backend" / "ecommerce.db"
ROOT_DB_PATH = ROOT / "ecommerce.db"

FRUIT_TEMPLATES = [
    ("Alphonso Mangoes (GI Tagged)", "organic-fruits", "Ratnagiri Organic Groves", 4.9,
     "Handpicked premium Devgad Alphonso mangoes, naturally tree-ripened without chemicals or carbides. Unrivaled saffron pulp aroma with Brix index 21°.",
     "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80",
     ["1 kg Crate", "2.5 kg Gift Box", "5 kg Master Box", "Pack of 6", "Pack of 12"], 499, 1899),

    ("Kashmiri Royal Gala Apples", "organic-fruits", "Sopore Valley Orchards", 4.8,
     "Crisp, sweet, and bursting with orchard juice. Grown at 6,000 ft altitude with cold mountain spring irrigation. 100% wax-free skin.",
     "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&auto=format&fit=crop&q=80",
     ["1 kg Tray", "2 kg Pack", "4 kg Family Pack", "4-Piece Gift Box"], 280, 850),

    ("Organic Hass Avocados", "organic-fruits", "Kodaikanal Highland Farms", 4.7,
     "Creamy, buttery, rich in heart-healthy oleic fats. Perfectly ripened with zero stringy fibers. Ideal for artisanal sourdough toasts & guacamole.",
     "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop&q=80",
     ["Pack of 2", "Pack of 4", "1 kg Pack", "Jumbo Single"], 299, 799),

    ("Wild Mountain Blueberries", "organic-fruits", "Nilgiri Berry Collective", 4.9,
     "Plump, antioxidant-dense wild blueberries with natural silvery bloom. Hand-sorted at dawn for maximum firm crunch and tart sweetness.",
     "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&auto=format&fit=crop&q=80",
     ["125g Punnet", "250g Box", "500g Tub", "Pack of 2 Punnets"], 349, 999),

    ("Exotic Ruby Red Dragon Fruit", "organic-fruits", "Deccan Organic Flora", 4.6,
     "Deep magenta flesh packed with prebiotic fiber and vitamin C. Grown with bio-organic compost and harvested fully ripe.",
     "https://images.unsplash.com/photo-1527324688151-0e627063f2b1?w=800&auto=format&fit=crop&q=80",
     ["Single Large (450g)", "Pack of 2", "Pack of 4", "3 kg Crate"], 180, 650),

    ("Nagpur Sweet Mandarins & Oranges", "organic-fruits", "Vidarbha Sun Orchards", 4.7,
     "Easy-to-peel golden mandarins overflowing with vitamin C and refreshing citrus oils. No synthetic wax, naturally sun-kissed.",
     "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&auto=format&fit=crop&q=80",
     ["1 kg Net Bag", "2 kg Box", "5 kg Festive Crate"], 199, 599),

    ("Crimson Anar Pomegranates", "organic-fruits", "Aravalli Organic Belt", 4.8,
     "Jewel-like ruby arils with soft edible seeds. Abundant in polyphenols, pressed or eaten fresh. Harvested with zero synthetic sprays.",
     "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80",
     ["1 kg Pack (3-4 pcs)", "2 kg Box", "Peeled Cups 200g"], 240, 680),

    ("Golden Sunburst Kiwi", "organic-fruits", "Himalayan Foothills Orchard", 4.8,
     "Silky, fuzzless skin with sweet golden flesh and a honey-like floral finish. Rich in vitamin E, folate, and potassium.",
     "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=800&auto=format&fit=crop&q=80",
     ["Pack of 3", "Pack of 6", "1 kg Box"], 220, 550),

    ("Robusta Organic Mountain Bananas", "organic-fruits", "Wayanad Rainfed Groves", 4.7,
     "Creamy, dense texture with exceptional sweetness. Grown without chemical ripening chambers in chemical-free rich rainforest soil.",
     "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&auto=format&fit=crop&q=80",
     ["1 Dozen (12 pcs)", "500g Bunch", "2 Dozen Bundle"], 90, 240),

    ("Artisanal Seasonal Fruit Basket", "organic-fruits", "Maison Harvest Reserve", 4.9,
     "Curated ensemble of the morning's finest seasonal harvest: Alphonso mangoes, berries, dragonfruit, and kiwi. Hand-packed in wicker.",
     "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=800&auto=format&fit=crop&q=80",
     ["Standard 3kg", "Luxury Wicker 5kg", "Grand Celebration 8kg"], 1299, 3499),

    ("Mediterranean Black Mission Figs", "organic-fruits", "Deccan Fig Sanctuary", 4.8,
     "Velvety soft purple-black skin with strawberry-jam interior. Luscious, raw, and harvested at peak brix sweetness.",
     "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=800&auto=format&fit=crop&q=80",
     ["250g Punnet", "500g Box", "1 kg Crate"], 320, 890),

    ("Organic Seedless Crimson Grapes", "organic-fruits", "Nashik Valley Vineyards", 4.7,
     "Crunchy, thin-skinned table grapes bursting with floral sweetness. 100% residue-free certified with zero pesticide trace.",
     "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&auto=format&fit=crop&q=80",
     ["500g Punnet", "1 kg Box", "2 kg Basket"], 160, 480)
]

FLOWER_TEMPLATES = [
    ("Ecuadorian Velvet Red Roses", "fresh-flowers", "Maison Floral Atelier", 4.9,
     "Long-stemmed (70cm) velvety crimson roses with huge head blooms. Cut at sunrise, conditioned in floral hydration for 12 days vase life.",
     "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80",
     ["Bouquet of 12", "Bouquet of 24", "Grand 50-Stem", "Glass Vase Arrangement"], 599, 2499),

    ("Royal Dutch Casablanca Lilies", "fresh-flowers", "Highland Glasshouse Estate", 4.9,
     "Intensely fragrant pure white oriental lilies with multiple pristine blooms per stem. Symbol of tranquility, elegance, and pure grace.",
     "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800&auto=format&fit=crop&q=80",
     ["3-Stem Bunch", "5-Stem Bouquet", "Ceramic Urn Arrangement"], 650, 1850),

    ("French Provence Dried & Fresh Lavender", "fresh-flowers", "Provence Alpine Slopes", 4.8,
     "Calming, aromatic wild blue lavender tied with raw jute. Naturally deters tension and infuses living spaces with sweet herbal serenity.",
     "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=800&auto=format&fit=crop&q=80",
     ["Hand-Tied Bunch", "Bundle of 3", "Linen Sachet Set"], 399, 1100),

    ("Exotic Imperial Purple Orchids", "fresh-flowers", "Chiang Mai Orchid Sanctuaries", 4.8,
     "Graceful sprays of dendrobium orchids with vibrant magenta-violet petals. Remarkably long-lasting (up to 3 weeks in fresh water).",
     "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=800&auto=format&fit=crop&q=80",
     ["5-Stem Bunch", "10-Stem Bouquet", "Ikebana Arrangement"], 499, 1499),

    ("Golden Morning Sunflowers", "fresh-flowers", "Karnataka Bio-Flora Farm", 4.7,
     "Radiant, uplifting giant sunflowers with rich brown centers and glowing golden petals. Guaranteed to brighten any room with pure optimism.",
     "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=800&auto=format&fit=crop&q=80",
     ["3-Stem Bunch", "5-Stem Bouquet", "Rustic Kraft Wrap"], 350, 950),

    ("Amsterdam Pastel Holland Tulips", "fresh-flowers", "Keukenhof Certified Cultivars", 4.9,
     "Crisp, elegant bell-shaped blooms in blush pink, pure ivory, and soft peach. Freshly air-freighted under active cold-chain.",
     "https://images.unsplash.com/photo-1520763185298-1b434c919102?w=800&auto=format&fit=crop&q=80",
     ["10-Stem Bunch", "20-Stem Bouquet", "Glass Cylinder Vase"], 899, 2200),

    ("Cloud Blue Hydrangea Blooms", "fresh-flowers", "Ooty Mist Valleys", 4.8,
     "Massive, voluminous globes of delicate periwinkle petals. A breathtaking centerpiece for dining tables and festive ceremonies.",
     "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&auto=format&fit=crop&q=80",
     ["Single Statement Stem", "3-Stem Bouquet", "Luxury Fluted Vase"], 450, 1600),

    ("Maison Heritage Peony & Rose Symphony", "fresh-flowers", "Maison Floral Atelier", 4.9,
     "Opulent arrangement of ruffled garden peonies, blush spray roses, and scented eucalyptus greens in our signature embossed luxury box.",
     "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80",
     ["Atelier Box", "Grand Urn", "Bridal Edition"], 1499, 3999),

    ("Sacred Morning Jasmine & Marigold Garland", "fresh-flowers", "Madurai Temple Gardens", 4.8,
     "Heavily scented fresh Sambac jasmine hand-strung with deep saffron marigold blossoms. Traditional serenity for home altars & doors.",
     "https://images.unsplash.com/photo-1596438459194-f275f413d6ff?w=800&auto=format&fit=crop&q=80",
     ["1 Meter Garland", "2 Meter Door Toran", "Festive Pack of 4"], 199, 599),

    ("Sunset Coral Carnation Bunch", "fresh-flowers", "Nilgiri Floriculture", 4.7,
     "Frilled, long-lasting coral and peach carnations with a delicate clove scent. Resilient 14-day bloom life in clean water.",
     "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&auto=format&fit=crop&q=80",
     ["10-Stem Bunch", "20-Stem Wrap", "Vase Set"], 320, 780)
]

FISH_TEMPLATES = [
    ("Wild Alaskan King Salmon Fillet", "fresh-fish", "Alaskan Cold Waters", 4.9,
     "Sustainably hook-and-line caught in icy pristine waters. Deep coral hue loaded with natural marine Omega-3 fatty acids. Sashimi grade.",
     "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop&q=80",
     ["250g Fillet", "500g Fillet", "1 kg Whole Side", "Skin-Off Portions 4x150g"], 899, 3200),

    ("Fresh Atlantic Seabass (Bhetki)", "fresh-fish", "Bay of Bengal Deep Catch", 4.8,
     "Pristine pearlescent white flesh with mild, sweet flavor and delicate flakes. Perfect for pan-searing, steaming, or traditional fish curries.",
     "https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=800&auto=format&fit=crop&q=80",
     ["500g Curry Cut", "500g Boneless Fillet", "1 kg Whole Cleaned"], 550, 1500),

    ("Yellowfin Tuna Steaks (Sashimi Grade)", "fresh-fish", "Maldives Sustainable Tuna", 4.9,
     "Ruby red, dense, meaty steaks caught by single-line artisanal fishermen. Zero carbon monoxide treatment, 100% natural color and texture.",
     "https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?w=800&auto=format&fit=crop&q=80",
     ["250g Steak", "500g Steaks (2 pcs)", "1 kg Loin"], 699, 2100),

    ("Jumbo Wild Tiger Prawns", "fresh-fish", "Sundarbans Estuary", 4.8,
     "Succulent, firm jumbo prawns (10-12 count per kg) with sweet oceanic snap. Deveined and cleaned while retaining shell head for maximum flavor.",
     "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=800&auto=format&fit=crop&q=80",
     ["250g Pack", "500g Pack", "1 kg Jumbo Box"], 649, 1899),

    ("Silver Pomfret (Vavval / Paplet)", "fresh-fish", "Konkan Coastal Fishery", 4.9,
     "Prized for its buttery, delicate texture and sweet aroma. Delivered whole gutted with gills removed, ready for rava fry or curry.",
     "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&auto=format&fit=crop&q=80",
     ["1 Medium Fish (350g)", "Pack of 2 (600g)", "1 kg Large Cleaned"], 620, 1950),

    ("Atlantic Rock Lobster Tails", "fresh-fish", "North Atlantic Cold Reefs", 4.9,
     "Wild-caught cold-water lobster tails with rich, decadent firm sweet meat. Flash-frozen at sea with zero preservatives.",
     "https://images.unsplash.com/photo-1559742811-822873691df8?w=800&auto=format&fit=crop&q=80",
     ["Pair of Tails (300g)", "4 Tails (600g)", "1 kg Feast Pack"], 1499, 4200),

    ("King Mackerel (Surmai / Seer Fish)", "fresh-fish", "Arabian Sea Harbour", 4.8,
     "Firm, meaty circular steaks with single central bone. The gold standard for spicy tawa fry and rich coconut curries.",
     "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800&auto=format&fit=crop&q=80",
     ["500g Slices", "1 kg Steaks", "Whole Cleaned 1.5kg"], 580, 1750),

    ("Fresh Mud Crab (Live Sourced)", "fresh-fish", "Kerala Backwaters", 4.8,
     "Heavy, sweet mud crabs packed with claw meat and delicate roe. Sourced live daily from certified mangrove habitats.",
     "https://images.unsplash.com/photo-1548811579-017cf2a4268b?w=800&auto=format&fit=crop&q=80",
     ["2 Large Crabs (700g)", "3 Medium Crabs (1kg)", "Giant Single (600g)"], 750, 1999),

    ("Ocean Catch Seafood Medley", "fresh-fish", "Maison Fishery Reserve", 4.9,
     "Chef's daily coastal selection: tiger prawns, salmon cubes, seabass fillets, and cleaned calamari rings for luxury bouillabaisse & paella.",
     "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=800&auto=format&fit=crop&q=80",
     ["500g Medley Pack", "1 kg Grand Platter"], 999, 2399)
]

ORPHANAGE_BENEFICIARIES = [
    "Sunshine Children's Sanctuary",
    "Lotus Child Welfare Home",
    "Hope Haven Children's Orphanage",
    "Little Angels Pediatric Care",
    "Grace Foundation Youth Shelter"
]


def generate_batch(start_id: int, count_per_cat: int = 17000):
    """
    Generates ~51,000 products:
    ~17,000 Organic Fruits
    ~17,000 Fresh Flowers
    ~17,000 Fresh Fish & Catch
    """
    rng = random.Random(20261106)
    curr_id = start_id
    total_yielded = 0

    pools = [
        ("organic-fruits", "Organic Fruits", FRUIT_TEMPLATES, count_per_cat),
        ("fresh-flowers", "Fresh Flowers", FLOWER_TEMPLATES, count_per_cat),
        ("fresh-fish", "Fresh Fish & Catch", FISH_TEMPLATES, count_per_cat)
    ]

    for cat_slug, cat_name, templates, target_count in pools:
        for idx in range(target_count):
            tpl = rng.choice(templates)
            name, slug_cat, farm, base_rating, desc, img_url, variants, min_p, max_p = tpl

            variant = rng.choice(variants)
            # Add slight variation to title for unique SKUs
            batch_num = idx // len(templates) + 1
            if batch_num == 1:
                title = f"{name} ({variant})"
            else:
                title = f"{name} - {variant} (Lot #{batch_num})"

            sku = f"HARVEST-{cat_slug[:3].upper()}-{curr_id:06d}"
            slug = f"{cat_slug}-{curr_id}-{name.lower().replace(' ', '-')[:25]}"

            price_inr = rng.randint(min_p, max_p)
            price_usd = round(price_inr / 83.5, 2)
            discount = rng.choice([0, 5, 10, 15, 20])
            mrp_usd = round(price_usd / (1 - discount / 100), 2) if discount > 0 else price_usd

            rating = round(base_rating + rng.uniform(-0.2, 0.1), 1)
            reviews = rng.randint(25, 450)
            stock = rng.randint(15, 120)

            orphanage = rng.choice(ORPHANAGE_BENEFICIARIES)
            specs = {
                "Farm / Origin": farm,
                "Harvested Today": "05:00 AM Daily Fresh",
                "Certification": "100% Certified Organic / Sustainably Sourced",
                "Surplus Pledge": f"Unsold daily stock donated to {orphanage}",
                "Temperature": "0-2°C Continuous Cold Chain"
            }
            tags = [cat_slug, "daily-fresh", "organic", "zero-waste", "orphanage-fund"]

            yield (
                curr_id,
                sku,
                slug,
                title,
                f"{desc} Sourced directly from {farm}. Harvested at dawn today. 100% freshness guaranteed.",
                "USD",
                price_usd,
                mrp_usd,
                discount,
                cat_slug,
                cat_name,
                farm,
                img_url,
                json.dumps([img_url]),
                json.dumps(tags),
                json.dumps(specs),
                rating,
                reviews,
                stock,
                "active"
            )
            curr_id += 1
            total_yielded += 1


def insert_fresh_catalog():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # Find maximum existing ID
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM products")
    max_id = cur.fetchone()[0]
    print(f"Current maximum product ID: {max_id}")

    start_id = max_id + 1
    # 17,000 x 3 = 51,000 items
    TARGET_TOTAL = 51000
    COUNT_PER_CAT = TARGET_TOTAL // 3

    print(f"Generating {TARGET_TOTAL} fresh items starting at ID {start_id}...")
    t0 = time.time()

    sql = """
    INSERT INTO products (
        id, sku, slug, title, description, currency, price, mrp, discount_percentage,
        category, category_name, brand, thumbnail, images, tags, specs, rating,
        review_count, stock, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """

    generator = generate_batch(start_id, COUNT_PER_CAT)
    chunk = []
    chunk_size = 5000
    inserted = 0

    for item in generator:
        chunk.append(item)
        if len(chunk) >= chunk_size:
            cur.executemany(sql, chunk)
            conn.commit()
            inserted += len(chunk)
            print(f"  Inserted {inserted}/{TARGET_TOTAL} items...")
            chunk = []

    if chunk:
        cur.executemany(sql, chunk)
        conn.commit()
        inserted += len(chunk)

    t1 = time.time()
    print(f"Successfully inserted {inserted} fresh items into {DB_PATH} in {t1 - t0:.2f} seconds!")

    # Check total count in DB
    cur.execute("SELECT COUNT(*) FROM products")
    total_db = cur.fetchone()[0]
    print(f"New total products in database: {total_db}")

    # Rebuild FTS5 search index
    print("Rebuilding FTS5 full-text search index...")
    t_fts0 = time.time()
    cur.execute("DELETE FROM products_fts;")
    cur.execute("""
        INSERT INTO products_fts (rowid, title, description, category, brand)
        SELECT id, title, description, category, brand FROM products WHERE status = 'active';
    """)
    conn.commit()
    t_fts1 = time.time()
    print(f"FTS5 index rebuilt in {t_fts1 - t_fts0:.2f} seconds!")

    conn.close()

    # Also sync into root ecommerce.db
    if ROOT_DB_PATH.exists() and ROOT_DB_PATH != DB_PATH:
        print(f"Syncing into root DB {ROOT_DB_PATH}...")
        import shutil
        shutil.copy2(DB_PATH, ROOT_DB_PATH)
        print("Root DB synchronized successfully.")


if __name__ == "__main__":
    insert_fresh_catalog()

