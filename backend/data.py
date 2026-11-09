"""
Legacy and baseline product catalogue data.
"""

CATEGORIES = [
    "smartphones",
    "laptops",
    "mobile-accessories",
    "mens-watches",
    "womens-jewellery",
    "beauty",
    "fragrances",
    "furniture",
    "home-decoration",
    "sunglasses"
]

PRODUCTS = [
    {
        "id": 1,
        "title": "ShopCread Phone 15 Pro Max",
        "description": "Titanium design, A17 Pro chip, customizable Action button, 48MP main camera system with 5x optical zoom.",
        "category": "smartphones",
        "price": 1499.99,
        "discountPercentage": 12.5,
        "rating": 4.9,
        "stock": 24,
        "brand": "ShopCread Tech",
        "thumbnail": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 2,
        "title": 'Aura Ultra Slim Book 16"',
        "description": "Ultra-thin aluminum chassis, M3 Ultra CPU, 32GB Unified RAM, 1TB SSD, 120Hz Liquid Retina XDR display.",
        "category": "laptops",
        "price": 2999.99,
        "discountPercentage": 15.0,
        "rating": 4.8,
        "stock": 12,
        "brand": "Aura Computing",
        "thumbnail": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 3,
        "title": "SoundPulse Pro Active ANC Headphones",
        "description": "Industry-leading noise canceling with Dual Noise Sensor technology, 30-hour battery life, touch sensor controls.",
        "category": "mobile-accessories",
        "price": 349.99,
        "discountPercentage": 20.0,
        "rating": 4.7,
        "stock": 45,
        "brand": "SoundPulse",
        "thumbnail": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 4,
        "title": "Chrono Classic Chronograph Watch",
        "description": "Precision Swiss movement, sapphire crystal glass, genuine Italian leather strap, 50m water resistance.",
        "category": "mens-watches",
        "price": 649.99,
        "discountPercentage": 10.0,
        "rating": 4.6,
        "stock": 18,
        "brand": "Chrono Genève",
        "thumbnail": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
            "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 5,
        "title": "Luxe Diamond Halo Pendant Necklace",
        "description": "18k Rose Gold pendant featuring a 0.75ct ethically sourced brilliant cut central diamond with halo surround.",
        "category": "womens-jewellery",
        "price": 1299.00,
        "discountPercentage": 8.0,
        "rating": 4.95,
        "stock": 8,
        "brand": "Luxe Fine Jewelry",
        "thumbnail": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 6,
        "title": "Velvet Rose Hydrating Face Serum 50ml",
        "description": "Infused with organic damask rose water and triple hyaluronic acid to intensely plump and revive tired skin.",
        "category": "beauty",
        "price": 89.99,
        "discountPercentage": 0.0,
        "rating": 4.65,
        "stock": 50,
        "brand": "Botanical Beauty",
        "thumbnail": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 7,
        "title": "Elixir Noir Luxury Eau de Parfum 100ml",
        "description": "A captivating fragrance featuring notes of rare black orchid, rich amber resin, smoked vanilla bean, and cedarwood.",
        "category": "fragrances",
        "price": 195.00,
        "discountPercentage": 0.0,
        "rating": 4.85,
        "stock": 30,
        "brand": "Maison Elixir",
        "thumbnail": "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 8,
        "title": "Mid-Century Modern Lounge Armchair",
        "description": "Ergonomic lounge chair with solid walnut wooden frame and premium stain-resistant bouclé fabric upholstery.",
        "category": "furniture",
        "price": 799.00,
        "discountPercentage": 18.0,
        "rating": 4.75,
        "stock": 15,
        "brand": "Nordic Living",
        "thumbnail": "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 9,
        "title": "Minimalist Ceramic Sculptural Vase",
        "description": "Handcrafted matte ceramic vase featuring abstract geometry. Perfect for dried pampas grass or fresh floral arrangements.",
        "category": "home-decoration",
        "price": 65.00,
        "discountPercentage": 5.0,
        "rating": 4.60,
        "stock": 40,
        "brand": "Artisan Decor",
        "thumbnail": "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1612196808214-b7e239e5f6b7?auto=format&fit=crop&w=800&q=80"
        ]
    },
    {
        "id": 10,
        "title": "Aviator Polarized Titanium Sunglasses",
        "description": "Lightweight aerospace titanium frame with UV400 polarized anti-glare gradient lenses.",
        "category": "sunglasses",
        "price": 179.99,
        "discountPercentage": 12.0,
        "rating": 4.70,
        "stock": 35,
        "brand": "Optic Elite",
        "thumbnail": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        "images": [
            "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"
        ]
    }
]

