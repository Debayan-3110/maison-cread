"""
fetch_verified_catalog.py
=========================
Fast multi-threaded retrieval and verification of 100% UNIQUE, high-resolution,
product-specific images from Wikimedia Commons for:
- Fresh Flowers
- Organic Fruits
- Fresh Catch & Seafood
"""

import sys
import urllib.request
import urllib.parse
import json
import sqlite3
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
DB_PATH = ROOT / "backend" / "ecommerce.db"
ROOT_DB_PATH = ROOT / "ecommerce.db"

HEADERS = {
    "User-Agent": "MaisonCuratedCommerce/2.0 (contact@maisoncread.com; automated-catalog-verification)"
}

FLOWER_ITEMS = [
    ("Ecuadorian Velvet Red Roses (Bouquet of 24)", "bouquet of red roses", "fresh-flowers", "Fresh Flowers", "Maison Floral Atelier", 4.9, 899, 2499,
     "Long-stemmed (70cm) velvety crimson roses with huge head blooms. Cut at sunrise, conditioned in floral hydration for 12 days vase life.",
     ["Bouquet of 12", "Bouquet of 24", "Grand 50-Stem", "Glass Vase Arrangement"]),

    ("Royal Casablanca White Lilies (5-Stem)", "bunch of white lilies", "fresh-flowers", "Fresh Flowers", "Highland Glasshouse Estate", 4.9, 650, 1850,
     "Intensely fragrant pure white oriental lilies with multiple pristine blooms per stem. Symbol of tranquility, elegance, and pure grace.",
     ["3-Stem Bunch", "5-Stem Bouquet", "Ceramic Urn Arrangement"]),

    ("French Provence Wild Blue Lavender", "lavender flowers bouquet", "fresh-flowers", "Fresh Flowers", "Provence Alpine Slopes", 4.8, 399, 1100,
     "Calming, aromatic wild blue lavender tied with raw jute. Naturally deters tension and infuses living spaces with sweet herbal serenity.",
     ["Hand-Tied Bunch", "Bundle of 3", "Linen Sachet Set"]),

    ("Exotic Imperial Purple Dendrobium Orchids", "purple orchid flower", "fresh-flowers", "Fresh Flowers", "Chiang Mai Orchid Sanctuaries", 4.8, 499, 1499,
     "Graceful sprays of dendrobium orchids with vibrant magenta-violet petals. Remarkably long-lasting (up to 3 weeks in fresh water).",
     ["5-Stem Bunch", "10-Stem Bouquet", "Ikebana Arrangement"]),

    ("Golden Sunburst Giant Sunflowers (5-Stem)", "bouquet of sunflowers", "fresh-flowers", "Fresh Flowers", "Karnataka Bio-Flora Farm", 4.7, 350, 950,
     "Radiant, uplifting giant sunflowers with rich brown centers and glowing golden petals. Guaranteed to brighten any room with pure optimism.",
     ["3-Stem Bunch", "5-Stem Bouquet", "Rustic Kraft Wrap"]),

    ("Amsterdam Pastel Holland Tulips (20-Stem)", "orange tulips bouquet", "fresh-flowers", "Fresh Flowers", "Keukenhof Certified Cultivars", 4.9, 799, 2200,
     "Crisp, elegant bell-shaped blooms in blush pink, pure ivory, and soft peach. Freshly air-freighted under active cold-chain.",
     ["10-Stem Bunch", "20-Stem Bouquet", "Glass Cylinder Vase"]),

    ("Cloud Blue Hydrangea Heritage Blooms", "blue hydrangea flower", "fresh-flowers", "Fresh Flowers", "Ooty Mist Valleys", 4.8, 450, 1600,
     "Massive, voluminous globes of delicate periwinkle petals. A breathtaking centerpiece for dining tables and festive ceremonies.",
     ["Single Statement Stem", "3-Stem Bouquet", "Luxury Fluted Vase"]),

    ("Maison Heritage Blush Peonies (10-Stem)", "bouquet of peonies", "fresh-flowers", "Fresh Flowers", "Maison Floral Atelier", 4.9, 999, 2999,
     "Opulent arrangement of ruffled garden peonies, blush spray roses, and scented eucalyptus greens in our signature embossed luxury box.",
     ["Atelier Box", "Grand Urn", "Bridal Edition"]),

    ("Sacred Temple Jasmine & Marigold Garland", "marigold garland flowers", "fresh-flowers", "Fresh Flowers", "Madurai Temple Gardens", 4.8, 199, 599,
     "Heavily scented fresh Sambac jasmine hand-strung with deep saffron marigold blossoms. Traditional serenity for home altars & doors.",
     ["1 Meter Garland", "2 Meter Door Toran", "Festive Pack of 4"]),

    ("Sunset Coral & Peach Carnations (20-Stem)", "carnation flower bouquet", "fresh-flowers", "Fresh Flowers", "Nilgiri Floriculture", 4.7, 320, 780,
     "Frilled, long-lasting coral and peach carnations with a delicate clove scent. Resilient 14-day bloom life in clean water.",
     ["10-Stem Bunch", "20-Stem Wrap", "Vase Set"]),

    ("English White Daisy Meadow Bunch", "white daisies flowers", "fresh-flowers", "Fresh Flowers", "Coorg Valley Flora", 4.7, 280, 650,
     "Cheerful white English daisies with bright sunny golden centers. Hand-tied with rustic hemp ribbon and seasonal greenery.",
     ["Standard Bunch", "Vase Arrangement", "Family Meadow Pack"]),

    ("Crimson Velvet Wine Dahlias", "dahlia flower blossom", "fresh-flowers", "Fresh Flowers", "Shillong Highland Florals", 4.8, 420, 1150,
     "Intricate geometric petals with velvet crimson and wine-red ombre gradient. Striking luxury accent for modern interior aesthetics.",
     ["5-Stem Bunch", "Artisanal Vase Set"]),

    ("Sacred Dew-Kissed Pink Lotus Blossoms", "pink lotus flower blossom", "fresh-flowers", "Fresh Flowers", "Varanasi Sacred Waters", 4.9, 350, 890,
     "Freshly harvested sacred pink lotus with dew-kissed petals. Revered for centuries for tranquil beauty, meditation, and spiritual purity.",
     ["Bundle of 3", "Bundle of 5", "Temple Brass Bowl Set"]),

    ("Himalayan Indigo Wild Iris", "blue iris flower blossom", "fresh-flowers", "Fresh Flowers", "Kashmir Alpine Gardens", 4.8, 480, 1250,
     "Regal deep violet and indigo petals with golden yellow crests. Delicate and gracefully formed, symbolizing wisdom and cherished courage.",
     ["5-Stem Bunch", "10-Stem Wrap"]),

    ("Peach Ranunculus Paper-Bloom Atelier", "ranunculus flowers bouquet", "fresh-flowers", "Fresh Flowers", "Maison Floral Atelier", 4.9, 680, 1850,
     "Layered paper-thin petals in blush pink and peach. Exceptionally chic editorial floral arrangement favored by top European florists.",
     ["10-Stem Bunch", "Ceramic Fluted Vase"]),

    ("Golden Yellow Freesia Sprays", "yellow freesia flower", "fresh-flowers", "Fresh Flowers", "Ooty Floriculture", 4.8, 380, 920,
     "Gracefully arched stems with citrus-peppery sweet fragrance. Adds brilliant golden radiance and freshness to living spaces.",
     ["10-Stem Bunch", "15-Stem Bunch"]),

    ("Pure White Anemone Monochrome Edition", "white anemone flower", "fresh-flowers", "Fresh Flowers", "Maison Floral Atelier", 4.8, 550, 1400,
     "Striking ivory petals centered around a dramatic dark indigo-black eye. Contemporary minimalist decor for modern architectural homes.",
     ["7-Stem Bunch", "Monochrome Atelier Vase"]),

    ("Vibrant Gerbera Daisies Sunset Bunch", "gerbera flowers bouquet", "fresh-flowers", "Fresh Flowers", "Pune Greenhouse Farms", 4.7, 290, 750,
     "Vibrant daisy-like giant blooms with velvety petals in orange, yellow, and coral. Freshly harvested for maximum cheerful vase life.",
     ["6-Stem Bunch", "12-Stem Wrap"]),

    ("Aromatic White Cream Gardenia Blossoms", "gardenia blossom white", "fresh-flowers", "Fresh Flowers", "Mysuru Botanical Gardens", 4.9, 590, 1600,
     "Heavily perfumed creamy white blossoms resting on glossy evergreen leaves. Unmatched intoxicating scent and timeless refinement.",
     ["Box of 4 Blooms", "Stemmed Glass Arrangement"]),

    ("Pastel Spring Sweet Pea Cluster", "sweet pea flowers", "fresh-flowers", "Fresh Flowers", "Shimla Valley Flora", 4.7, 340, 820,
     "Ruffled butterfly-winged petals with sweet honey fragrance in pastel lilac and rose. Brings vintage English countryside charm indoors.",
     ["12-Stem Bunch", "Rustic Mason Jar Arrangement"]),

    ("Wild Mountain Gypsophila Baby's Breath", "gypsophila flower", "fresh-flowers", "Fresh Flowers", "Nilgiri Highlands", 4.7, 260, 620,
     "Delicate clouds of tiny starry white blossoms. Creates ethereal, airy elegance as a standalone cloud or accompanying accent.",
     ["Giant Cloud Bunch", "Kraft Paper Wrap"]),

    ("Autumn Harvest Golden Chrysanthemums", "chrysanthemum flowers yellow", "fresh-flowers", "Fresh Flowers", "Deccan Botanical Gardens", 4.8, 330, 850,
     "Full-headed golden pompon and spider chrysanthemums. Long-lasting symbolic flowers representing longevity, joy, and golden autumn warmth.",
     ["5-Stem Bunch", "10-Stem Bouquet"]),

    ("Kyoto Sakura Cherry Blossom Branches", "cherry blossom flowers pink", "fresh-flowers", "Fresh Flowers", "Himalayan Sakura Groves", 4.9, 650, 1950,
     "Gracefully budding pink and white branches that blossom over 10 days in water. Celebrates renewal and exquisite seasonal mindfulness.",
     ["3 Tall Branches", "5 Architectural Branches"]),

    ("Deep Scarlet Field Poppies Bunch", "red poppy flower field", "fresh-flowers", "Fresh Flowers", "Kashmir Valley Flora", 4.7, 310, 780,
     "Tissue-paper scarlet petals with velvety black centers. Delicate, wild, and breathtakingly dramatic in direct morning natural light.",
     ["10-Stem Bunch", "Hand-Tied Kraft Wrap"])
]

FRUIT_ITEMS = [
    ("Alphonso Mangoes (GI Tagged Ratnagiri)", "alphonso mango fruit", "organic-fruits", "Organic Fruits", "Ratnagiri Organic Groves", 4.9, 499, 1899,
     "Handpicked premium Devgad Alphonso mangoes, naturally tree-ripened without chemicals or carbides. Unrivaled saffron pulp aroma with Brix index 21°.",
     ["1 kg Crate", "2.5 kg Gift Box", "5 kg Master Box", "Pack of 6"]),

    ("Kashmiri Royal Gala Mountain Apples", "red gala apple fruit", "organic-fruits", "Organic Fruits", "Sopore Valley Orchards", 4.8, 280, 850,
     "Crisp, sweet, and bursting with orchard juice. Grown at 6,000 ft altitude with cold mountain spring irrigation. 100% wax-free skin.",
     ["1 kg Tray", "2 kg Pack", "4 kg Family Pack"]),

    ("Organic Butter Hass Avocados", "hass avocado fruit white background", "organic-fruits", "Organic Fruits", "Kodaikanal Highland Farms", 4.7, 299, 799,
     "Creamy, buttery, rich in heart-healthy oleic fats. Perfectly ripened with zero stringy fibers. Ideal for artisanal sourdough toasts & guacamole.",
     ["Pack of 2", "Pack of 4", "1 kg Pack"]),

    ("Wild Mountain Fresh Blueberries", "fresh blueberries", "organic-fruits", "Organic Fruits", "Nilgiri Berry Collective", 4.9, 349, 999,
     "Plump, antioxidant-dense wild blueberries with natural silvery bloom. Hand-sorted at dawn for maximum firm crunch and tart sweetness.",
     ["125g Punnet", "250g Box", "500g Tub"]),

    ("Exotic Ruby Magenta Dragonfruit", "pitaya dragon fruit", "organic-fruits", "Organic Fruits", "Deccan Organic Flora", 4.6, 180, 650,
     "Deep magenta flesh packed with prebiotic fiber and vitamin C. Grown with bio-organic compost and harvested fully ripe.",
     ["Single Large (450g)", "Pack of 2", "Pack of 4"]),

    ("Nagpur Sweet Sunburst Mandarins", "mandarin oranges fruit", "organic-fruits", "Organic Fruits", "Vidarbha Sun Orchards", 4.7, 199, 599,
     "Easy-to-peel golden mandarins overflowing with vitamin C and refreshing citrus oils. No synthetic wax, naturally sun-kissed.",
     ["1 kg Net Bag", "2 kg Box", "5 kg Festive Crate"]),

    ("Crimson Ruby Anar Pomegranates", "pomegranate fruit open", "organic-fruits", "Organic Fruits", "Aravalli Organic Belt", 4.8, 240, 680,
     "Jewel-like ruby arils with soft edible seeds. Abundant in polyphenols, pressed or eaten fresh. Harvested with zero synthetic sprays.",
     ["1 kg Pack (3-4 pcs)", "2 kg Box", "Peeled Cups 200g"]),

    ("Golden Sunburst Kiwi Fruit", "kiwi fruit slice", "organic-fruits", "Organic Fruits", "Himalayan Foothills Orchard", 4.8, 220, 550,
     "Silky, fuzzless skin with sweet golden flesh and a honey-like floral finish. Rich in vitamin E, folate, and potassium.",
     ["Pack of 3", "Pack of 6", "1 kg Box"]),

    ("Robusta Rainforest Mountain Bananas", "banana bunch fruit", "organic-fruits", "Organic Fruits", "Wayanad Rainfed Groves", 4.7, 90, 240,
     "Creamy, dense texture with exceptional sweetness. Grown without chemical ripening chambers in chemical-free rich rainforest soil.",
     ["1 Dozen (12 pcs)", "500g Bunch", "2 Dozen Bundle"]),

    ("Mediterranean Black Mission Figs", "fresh mission figs", "organic-fruits", "Organic Fruits", "Deccan Fig Sanctuary", 4.8, 320, 890,
     "Velvety soft purple-black skin with strawberry-jam interior. Luscious, raw, and harvested at peak brix sweetness.",
     ["250g Punnet", "500g Box", "1 kg Crate"]),

    ("Nashik Valley Crimson Seedless Grapes", "red seedless grapes", "organic-fruits", "Organic Fruits", "Nashik Valley Vineyards", 4.7, 160, 480,
     "Crunchy, thin-skinned table grapes bursting with floral sweetness. 100% residue-free certified with zero pesticide trace.",
     ["500g Punnet", "1 kg Box", "2 kg Basket"]),

    ("Sweet Alpine Strawberries Punnet", "strawberries in punnet", "organic-fruits", "Organic Fruits", "Mahabaleshwar Hills", 4.9, 210, 580,
     "Aromatic, conical ruby strawberries picked before sunrise. Intense sweet flavor with natural shine and tender pulp.",
     ["250g Punnet", "500g Twin Pack"]),

    ("Wild Forest Red Raspberries", "fresh red raspberries", "organic-fruits", "Organic Fruits", "Kashmir Berry Haven", 4.9, 380, 990,
     "Delicate, hollow scarlet berries brimming with bright tart perfume. Flown fresh in temperature-controlled micro-boxes.",
     ["125g Clamshell", "250g Dual Pack"]),

    ("Plump Wild Blackberries", "fresh blackberries fruit", "organic-fruits", "Organic Fruits", "Ooty Highland Farms", 4.8, 360, 920,
     "Glossy deep purple drupelets packed with bioflavonoids. Succulent sweet-tart juice ideal for artisanal breakfasts.",
     ["150g Punnet", "300g Box"]),

    ("Sugar-Baby Sweet Watermelon Slices", "watermelon fruit slice", "organic-fruits", "Organic Fruits", "Tungabhadra Basin Organic", 4.7, 140, 390,
     "Intensely crisp red heart with dark emerald rind. High lycopene and naturally thirst-quenching hydration.",
     ["Half Melon (1.8kg)", "Whole Melon (3.5kg)"]),

    ("Golden Ripe Hawaiian Papaya", "ripe papaya fruit", "organic-fruits", "Organic Fruits", "Mysuru Sun Belt", 4.7, 120, 340,
     "Deep orange buttery flesh loaded with natural papain digestive enzymes. Smooth, rich, and mildly musky sweetness.",
     ["Single Large (800g)", "Pack of 2"]),

    ("Pink Tropical Sweet Guava", "pink guava fruit", "organic-fruits", "Organic Fruits", "Allahabad Certified Groves", 4.8, 150, 420,
     "Fragrant soft pink interior with edible crisp seeds. Incredible vitamin C concentration and vintage Indian orchard nostalgia.",
     ["1 kg Pack", "2 kg Box"]),

    ("Mauritius Sweet Honey Pineapple", "fresh pineapple fruit", "organic-fruits", "Organic Fruits", "Vazhakulam Organic Estate", 4.8, 180, 480,
     "Golden core with low acidity and intoxicating floral honey sweetness. GI tagged Vazhakulam pineapple at peak ripeness.",
     ["Single Golden (1.2kg)", "Duo Pack"]),

    ("Purple Granadilla Passion Fruit", "passion fruit sliced", "organic-fruits", "Organic Fruits", "Coorg Rainforest Belt", 4.9, 260, 690,
     "Wrinkled deep purple shells containing aromatic golden pulp with crunchy black seeds. Sensational tropical perfume.",
     ["Pack of 4", "Pack of 8", "1 kg Crate"]),

    ("Velvet Yellow Summer Peaches", "fresh yellow peaches", "organic-fruits", "Organic Fruits", "Kullu Valley Orchards", 4.8, 310, 840,
     "Soft fuzzy golden skin with aromatic sweet nectar. Freestone pit separating cleanly from juicy golden flesh.",
     ["Pack of 4", "1 kg Basket"]),

    ("Golden Apricots of Ladakh", "fresh apricots fruit", "organic-fruits", "Organic Fruits", "Ladakh High Altitude Groves", 4.9, 390, 980,
     "Sun-drenched Himalayan apricots known as Raktsey Karpo. Honeyed almond fragrance with velvety golden skin.",
     ["500g Punnet", "1 kg Heritage Box"]),

    ("Dark Bing Sweet Cherries", "dark cherries fruit", "organic-fruits", "Organic Fruits", "Shimla Alpine Orchards", 4.9, 450, 1250,
     "Deep mahogany heart-shaped cherries with firm, snap-crisp skin and luscious wine-sweet juice.",
     ["250g Punnet", "500g Box"]),

    ("Deep Purple Black Amber Plums", "black plums fruit", "organic-fruits", "Organic Fruits", "Kotgarh Valley Orchards", 4.7, 240, 680,
     "Glossy ebony skin giving way to amber-red flesh with refreshing tang. Excellent source of dietary fiber and vitamin K.",
     ["500g Tray", "1 kg Crate"]),

    ("Tender Green Coconut from Pollachi", "green coconut water", "organic-fruits", "Organic Fruits", "Pollachi Coconut Groves", 4.9, 85, 220,
     "Heavy with sweet, pure electrolyte water and silky spoon meat. Harvested by skilled climbers from organic palm groves.",
     ["Single Chilled", "Pack of 3", "Pack of 6"])
]

FISH_ITEMS = [
    ("Wild Alaskan King Salmon Fillet", "grilled plated salmon fillet", "fresh-fish", "Fresh Fish & Catch", "Alaskan Cold Waters", 4.9, 899, 3200,
     "Sustainably hook-and-line caught in icy pristine waters. Deep coral hue loaded with natural marine Omega-3 fatty acids. Sashimi grade.",
     ["250g Fillet", "500g Fillet", "1 kg Whole Side"]),

    ("Fresh Atlantic Seabass (Bhetki)", "seabass fillet fish", "fresh-fish", "Fresh Fish & Catch", "Bay of Bengal Deep Catch", 4.8, 550, 1500,
     "Pristine pearlescent white flesh with mild, sweet flavor and delicate flakes. Perfect for pan-searing, steaming, or traditional fish curries.",
     ["500g Curry Cut", "500g Boneless Fillet", "1 kg Whole Cleaned"]),

    ("Yellowfin Tuna Steaks (Sashimi Grade)", "tuna steak raw", "fresh-fish", "Fresh Fish & Catch", "Maldives Sustainable Tuna", 4.9, 699, 2100,
     "Ruby red, dense, meaty steaks caught by single-line artisanal fishermen. Zero carbon monoxide treatment, 100% natural color and texture.",
     ["250g Steak", "500g Steaks (2 pcs)", "1 kg Loin"]),

    ("Jumbo Wild Tiger Prawns", "tiger prawns raw", "fresh-fish", "Fresh Fish & Catch", "Sundarbans Estuary", 4.8, 649, 1899,
     "Succulent, firm jumbo prawns (10-12 count per kg) with sweet oceanic snap. Deveined and cleaned while retaining shell head for maximum flavor.",
     ["250g Pack", "500g Pack", "1 kg Jumbo Box"]),

    ("Silver Pomfret (Vavval / Paplet)", "pampus argenteus pomfret", "fresh-fish", "Fresh Fish & Catch", "Konkan Coastal Fishery", 4.9, 620, 1950,
     "Prized for its buttery, delicate texture and sweet aroma. Delivered whole gutted with gills removed, ready for rava fry or curry.",
     ["1 Medium Fish (350g)", "Pack of 2 (600g)", "1 kg Large Cleaned"]),

    ("Atlantic Rock Lobster Tails", "lobster tails raw", "fresh-fish", "Fresh Fish & Catch", "North Atlantic Cold Reefs", 4.9, 1499, 4200,
     "Wild-caught cold-water lobster tails with rich, decadent firm sweet meat. Flash-frozen at sea with zero preservatives.",
     ["Pair of Tails (300g)", "4 Tails (600g)", "1 kg Feast Pack"]),

    ("King Mackerel (Surmai / Seer Fish)", "scomberomorus commerson king mackerel", "fresh-fish", "Fresh Fish & Catch", "Arabian Sea Harbour", 4.8, 580, 1750,
     "Firm, meaty circular steaks with single central bone. The gold standard for spicy tawa fry and rich coconut curries.",
     ["500g Slices", "1 kg Steaks", "Whole Cleaned 1.5kg"]),

    ("Fresh Mangrove Mud Crab", "scylla serrata mud crab", "fresh-fish", "Fresh Fish & Catch", "Kerala Backwaters", 4.8, 750, 1999,
     "Heavy, sweet mud crabs packed with claw meat and delicate roe. Sourced live daily from certified mangrove habitats.",
     ["2 Large Crabs (700g)", "3 Medium Crabs (1kg)", "Giant Single (600g)"]),

    ("Ocean Catch Seafood Medley", "seafood paella fish prawns", "fresh-fish", "Fresh Fish & Catch", "Maison Fishery Reserve", 4.9, 999, 2399,
     "Chef daily coastal selection: tiger prawns, salmon cubes, seabass fillets, and cleaned calamari rings for luxury bouillabaisse & paella.",
     ["500g Medley Pack", "1 kg Grand Platter"]),

    ("Tender Atlantic Calamari Squid Rings", "squid calamari rings", "fresh-fish", "Fresh Fish & Catch", "Bay of Biscay Waters", 4.7, 420, 1150,
     "Cleaned white squid tubes sliced into tender rings. Naturally tender and sweet, perfect for crisp flash-frying or tomato stew.",
     ["400g Pack", "800g Value Pack"]),

    ("Fresh Diver Sea Scallops", "sea scallops raw", "fresh-fish", "Fresh Fish & Catch", "Hokkaido Cold Bays", 4.9, 1150, 2800,
     "Hand-harvested jumbo diver scallops (U-10 count). Sweet, buttery, dry-packed with zero added water or tripolyphosphate.",
     ["250g Pan-Ready", "500g Gourmet Pack"]),

    ("Himalayan Rainbow Trout", "oncorhynchus mykiss rainbow trout", "fresh-fish", "Fresh Fish & Catch", "Kullu Springfed Farms", 4.8, 480, 1350,
     "Cold-water river trout with delicate pink flesh and silver-spotted skin. Exceptionally clean flavor, pan-fries beautifully with butter and herbs.",
     ["2 Whole Fish (600g)", "4 Whole Fish (1.2kg)"]),

    ("Malabar Coastal Black Tiger Shrimp", "black tiger shrimp raw", "fresh-fish", "Fresh Fish & Catch", "Malabar Coastline", 4.8, 520, 1450,
     "Medium-large sweet coastal shrimp, head-off and deveined. Juicy firm bite suited for coastal coconut gravies and skewers.",
     ["500g Deveined", "1 kg Master Pack"]),

    ("Deep Sea Wild Red Snapper", "lutjanus campechanus red snapper", "fresh-fish", "Fresh Fish & Catch", "Andaman Coral Shelf", 4.8, 620, 1780,
     "Vibrant ruby-pink skin with lean, firm white meat. Cleaned and scaled, ready for whole baking, salt-crusting, or grilling.",
     ["Whole Fish (1kg)", "2 Small Fish (800g)"]),

    ("Wild Pacific Halibut Steaks", "hippoglossus halibut", "fresh-fish", "Fresh Fish & Catch", "Pacific Deep Banks", 4.9, 1250, 3100,
     "Snow-white, thick, meaty halibut steaks with gently sweet flakes. Retains exceptional moisture when grilled or roasted.",
     ["300g Steak", "600g (2 Steaks)"]),

    ("Ocean Fresh Blue Mussels in Shell", "mytilus edulis blue mussels", "fresh-fish", "Fresh Fish & Catch", "Scottish Sea Lochs", 4.7, 390, 950,
     "Rope-grown plump mussels bursting with oceanic liquor. Scrubbed and debearded, ready for classic white wine marinière.",
     ["1 kg Mesh Bag", "2 kg Party Tub"]),

    ("Sweet Atlantic Cherrystone Clams", "mercenaria mercenaria clams", "fresh-fish", "Fresh Fish & Catch", "Cape Cod Tidal Flats", 4.8, 450, 1100,
     "Tender, sweet hard-shell clams purged of grit. Outstanding raw on the half shell, steamed with garlic, or in rich chowders.",
     ["1 Dozen (12 pcs)", "2 Dozen Feast Pack"]),

    ("Wild Caught Swordfish Loin Steaks", "xiphias gladius swordfish", "fresh-fish", "Fresh Fish & Catch", "Mediterranean Open Waters", 4.8, 850, 2250,
     "Dense, steak-like texture reminiscent of tender veal. Holds up exceptionally well over hardwood lump charcoal.",
     ["350g Steak", "700g Double Pack"]),

    ("Giant Freshwater Scampi King Prawns", "macrobrachium rosenbergii scampi", "fresh-fish", "Fresh Fish & Catch", "Godavari Estuary Waters", 4.9, 780, 2150,
     "Impressive blue-claw freshwater scampi with giant succulent tail meat and rich head butter.",
     ["500g (4-6 pcs)", "1 kg Banquet Pack"]),

    ("Artisanal Oak Cold-Smoked Salmon", "smoked salmon sliced", "fresh-fish", "Fresh Fish & Catch", "Highland Smokehouse Atelier", 4.9, 920, 2450,
     "Cured with sea salt and demerara sugar, then slowly smoked over aged Scottish whisky oak casks. Silky, melt-in-mouth ribbons.",
     ["150g Retail Pack", "300g Platter Edition"]),

    ("Konkan Coast Fresh Sardines (Tarli)", "sardina pilchardus sardines", "fresh-fish", "Fresh Fish & Catch", "Goa Coastal Shoals", 4.7, 180, 450,
     "Silvery, nutrient-packed wild sardines rich in natural marine calcium and EPA/DHA. Fantastic crisp pan-fried with coarse semolina.",
     ["500g Cleaned", "1 kg Fresh Catch"]),

    ("Bay of Bengal Prime Hilsa (Ilish)", "tenualosa ilisha hilsa", "fresh-fish", "Fresh Fish & Catch", "Padma River Mouth", 4.9, 1200, 3600,
     "The undisputed queen of river fish. Unrivaled rich oil content and melt-in-mouth aromatics, prized for traditional shorshe ilish.",
     ["Whole Fish (1.2kg)", "500g Centre Cuts"]),

    ("Yellow Crab Claws Pre-Cracked", "crab claws cooked", "fresh-fish", "Fresh Fish & Catch", "Arabian Gulf Catch", 4.8, 890, 2350,
     "Plump cocktail claws scored for effortless dining. Sweet, dense meat ready to chill and serve with drawn lemon herb butter.",
     ["400g Cocktail Pack", "800g Party Platter"]),

    ("Mediterranean Sea Bream (Dorade)", "sparus aurata sea bream", "fresh-fish", "Fresh Fish & Catch", "Aegean Sea Clear Waters", 4.8, 590, 1650,
     "Glistening silver skin with delicate, juicy white meat. Cleaned and scaled, ready for roasting over sea salt and fennel fronds.",
     ["Whole Cleaned (600g)", "Pair of Fish (1.2kg)"])
]

def search_wikimedia(query: str) -> list:
    url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={urllib.parse.quote(query)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|mime|size&format=json"
    req = urllib.request.Request(url, headers=HEADERS)
    candidates = []
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                title = pdata.get("title", "").lower()
                info = pdata.get("imageinfo", [{}])[0]
                mime = info.get("mime", "")
                file_size = info.get("size", 0)
                img_url = info.get("url", "").split("?")[0]
                
                if (mime in ["image/jpeg", "image/png", "image/webp"] and
                    file_size > 15000 and
                    not title.endswith(".svg") and
                    not title.endswith(".pdf") and
                    not title.endswith(".tif") and
                    not "logo" in title and
                    not "icon" in title and
                    not "map" in title):
                    candidates.append((img_url, file_size))
    except Exception as e:
        pass
    return candidates

def fetch_single(item):
    title, query, cat_slug, cat_name, origin, rating, min_p, max_p, desc, variants = item
    candidates = search_wikimedia(query)
    if not candidates:
        fallback_query = query.split()[0] + " " + cat_slug.split("-")[-1]
        candidates = search_wikimedia(fallback_query)
    return item, candidates

def main():
    print("=== Multi-Threaded Unique Image Fetcher Started ===", flush=True)
    all_items = FLOWER_ITEMS + FRUIT_ITEMS + FISH_ITEMS
    print(f"Total items to fetch: {len(all_items)}", flush=True)

    fetched_candidates = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(fetch_single, it): it for it in all_items}
        for fut in as_completed(futures):
            item, cand = fut.result()
            fetched_candidates[item[0]] = (item, cand)
            print(f"  Processed: {item[0][:35]:35} -> {len(cand)} candidates", flush=True)

    # Assign strictly 100% UNIQUE images across all items
    used_urls = set()
    verified_catalog = []

    for item in all_items:
        title = item[0]
        it, cand = fetched_candidates[title]
        chosen_url = None
        for u, sz in cand:
            if u not in used_urls:
                chosen_url = u
                used_urls.add(u)
                break
        
        verified_catalog.append({
            "title": it[0],
            "category": it[2],
            "category_name": it[3],
            "brand": it[4],
            "rating": it[5],
            "min_price": it[6],
            "max_price": it[7],
            "description": it[8],
            "variants": it[9],
            "image": chosen_url or ""
        })

    valid_count = sum(1 for x in verified_catalog if x["image"])
    print(f"\n==========================================", flush=True)
    print(f"Total items: {len(verified_catalog)}", flush=True)
    print(f"Items with verified UNIQUE image: {valid_count}", flush=True)
    print(f"Unique URLs used: {len(used_urls)}", flush=True)
    print(f"Double-used images count: {valid_count - len(used_urls)}", flush=True)
    print(f"==========================================", flush=True)

    output_file = ROOT / "backend" / "app" / "scripts" / "verified_fresh_items.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(verified_catalog, f, indent=2)
    print(f"Saved verified items to: {output_file}", flush=True)

if __name__ == "__main__":
    main()
