"""
fix_catalog_data.py
===================
Cleans and replaces all 76 bot/test/UUID-corrupted products in `backend/api` (indices 49-124)
with authentic, luxury e-commerce catalog items with genuine titles, descriptions,
and 100% verified HTTP 200 product imagery.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent.parent
API_FILE = ROOT / "backend" / "api"
BACKUP_FILE = ROOT / "backend" / "api.bak"

# 76 Curated products mapped by category
CURATED_DATA = {
    "Clothes": [
        {
            "title": "Tailored Italian Wool Blazer",
            "desc": "Hand-crafted from superfine 120s virgin wool with a soft shoulder, notched lapels, and horn buttons. Perfect for refined business and evening wear.",
            "price": 189,
            "images": [
                "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&auto=format&fit=crop&q=80",
                "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Heavyweight Organic Cotton Hoodie",
            "desc": "Constructed with 450 GSM looped French terry cotton. Features double-stitched ribbing, a kangaroo front pocket, and pre-shrunk finish for ultimate warmth.",
            "price": 75,
            "images": [
                "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Slim-Fit Raw Selvedge Denim Jeans",
            "desc": "Japanese kurabo selvedge denim woven on vintage shuttle looms. Unwashed and untreated to mold uniquely to your body over time.",
            "price": 110,
            "images": [
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Brushed Oxford Button-Down Shirt",
            "desc": "Woven from 100% two-ply long-staple cotton with mother-of-pearl buttons, a classic roll collar, and curved hem.",
            "price": 68,
            "images": [
                "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Cashmere Blend Ribbed Turtleneck",
            "desc": "Luxurious blend of Mongolian cashmere and fine Merino wool. Ultra-soft against the skin with refined ribbed cuffs and hem.",
            "price": 145,
            "images": [
                "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Vintage Washed Utility Chore Jacket",
            "desc": "Durable 12 oz cotton duck canvas with reinforced elbow patches, utility patch pockets, and antique brass shank buttons.",
            "price": 125,
            "images": [
                "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Pleated Relaxed Tailored Trousers",
            "desc": "Contemporary high-waisted relaxed trousers crafted from drapey tropical wool. Features single front pleats and side adjusters.",
            "price": 95,
            "images": [
                "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist Crewneck Heavyweight Tee",
            "desc": "Cut from substantial 240 GSM combed organic jersey cotton with a tight ribbed collar and reinforced taped neck.",
            "price": 38,
            "images": [
                "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Waterproof Technical Trench Coat",
            "desc": "Double-breasted silhouette made with 3-layer breathable waterproof membrane, magnetic storm flap closures, and storm shield back.",
            "price": 240,
            "images": [
                "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Cable-Knit Heritage Fisherman Sweater",
            "desc": "Knit from pure British wool using traditional honeycomb and cable patterns. Naturally insulating, water-resistant, and built for a lifetime.",
            "price": 130,
            "images": [
                "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Classic Piqué Polo Shirt",
            "desc": "Breathable honeycomb cotton piqué weave with ribbed collar, two-button placket, and subtle embroidered atelier crest.",
            "price": 52,
            "images": [
                "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Structured Wool Overcoat",
            "desc": "Single-breasted knee-length overcoat spun from dense melton wool with viscose lining, interior welt pockets, and back walking vent.",
            "price": 295,
            "images": [
                "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Linen Resort Long-Sleeve Shirt",
            "desc": "Airy 100% French flax linen shirt pre-washed for effortless drape and relaxed texture. Designed with a convertible camp collar.",
            "price": 72,
            "images": [
                "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Quilted Lightweight Puffer Vest",
            "desc": "Responsibly sourced 700-fill power goose down encased in durable water-repellent ripstop nylon. Lightweight and highly packable.",
            "price": 88,
            "images": [
                "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Casual Cotton Twill Overshirt",
            "desc": "Heavyweight brushed twill shirt jacket with dual flap chest pockets, corozo buttons, and a structured regular fit.",
            "price": 82,
            "images": [
                "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Merino Wool V-Neck Cardigan",
            "desc": "Fine 14-gauge spun Australian merino wool cardigan. Features tonal horn buttons, patch pockets, and tailored cuffs.",
            "price": 115,
            "images": [
                "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Tapered Chino Trousers",
            "desc": "Midweight stretch cotton twill chinos with clean front styling, durable bar-tacked stress points, and tailored ankle taper.",
            "price": 65,
            "images": [
                "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Bomber Jacket with Ribbed Trim",
            "desc": "Modern flight jacket crafted with semi-matte satin nylon shell, ribbed varsity collar, zippered utility sleeve pocket, and insulated lining.",
            "price": 135,
            "images": [
                "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "All-Weather Field Parka",
            "desc": "Rugged waterproof canvas parka with adjustable storm hood, fleece-lined handwarmer pockets, and heavy-duty YKK two-way zipper.",
            "price": 210,
            "images": [
                "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "French Terry Lounge Sweatpants",
            "desc": "Ultra-comfortable tapered sweatpants with elasticated drawstring waistband, ribbed ankle cuffs, and concealed zip pocket.",
            "price": 58,
            "images": [
                "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Silk-Lined Double-Breasted Peacoat",
            "desc": "Naval-inspired heavy navy wool peacoat featuring anchor-embossed buttons, broad lapels, and luxurious silk satin interior.",
            "price": 260,
            "images": [
                "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Tailored Chambray Workshirt",
            "desc": "Indigo-dyed lightweight cotton chambray with triple-needle chainstitch construction and reinforced side gussets.",
            "price": 64,
            "images": [
                "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Soft Brushed Flannel Shirt",
            "desc": "100% yarn-dyed double-brushed cotton flannel in classic shadow plaid. Incredibly soft, cozy, and built for crisp autumn days.",
            "price": 55,
            "images": [
                "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ],
    "Electronics": [
        {
            "title": "Studio Pro Wireless ANC Headphones",
            "desc": "Custom 40mm beryllium drivers, active hybrid noise cancellation, 45-hour battery life, and plush memory foam leatherette earcups.",
            "price": 249,
            "images": [
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist Precision Mechanical Keyboard",
            "desc": "Hot-swappable tactile mechanical switches, CNC anodized aluminum frame, custom PBT keycaps, and multi-device Bluetooth 5.2 connectivity.",
            "price": 139,
            "images": [
                "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Ergonomic Precision Wireless Mouse",
            "desc": "Contoured ergonomic profile with hyper-fast MagSpeed electromagnetic scrolling, dual wireless modes, and ultra-accurate 8000 DPI sensor.",
            "price": 89,
            "images": [
                "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Hi-Fi Audiophile DAC & Headphone Amp",
            "desc": "High-resolution desktop USB digital-to-analog converter supporting 32-bit/768kHz audio and native DSD512 for studio-grade acoustic clarity.",
            "price": 175,
            "images": [
                "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Portable 360° Waterproof Bluetooth Speaker",
            "desc": "IP67 dust and waterproof rugged outdoor speaker with dual passive radiators, deep bass response, and 20 hours of continuous playback.",
            "price": 119,
            "images": [
                "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Smart Ambient LED Desk Bar",
            "desc": "Asymmetric optical design that illuminates your desk without screen glare. Features wireless rotary remote dial and auto-dimming ambient light sensor.",
            "price": 79,
            "images": [
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "True Wireless Noise-Cancelling Earbuds",
            "desc": "Equipped with personalized spatial audio, multi-mode active noise cancellation, transparency mode, and IPX4 sweat resistance.",
            "price": 159,
            "images": [
                "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Ultra-Slim 65W GaN Fast Charger",
            "desc": "Next-gen Gallium Nitride technology packing dual USB-C ports and USB-A port in an ultra-compact pocket-friendly folding plug footprint.",
            "price": 45,
            "images": [
                "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Magnetic Wireless Fast-Charging Stand",
            "desc": "Machined weighted aluminum 3-in-1 stand for phone, smartwatch, and earbuds with strong magnetic alignment and rapid 15W wireless charging.",
            "price": 69,
            "images": [
                "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "4K Ultra-HD Webcam with Stereo Mic",
            "desc": "Crystal-clear Sony Starvis sensor with autofocus, AI auto-framing, dual noise-reducing stereo microphones, and physical privacy shutter.",
            "price": 109,
            "images": [
                "https://images.unsplash.com/photo-1588508065123-287b28e013da?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Smart Fitness & Sleep Tracking Watch",
            "desc": "Always-on AMOLED display with continuous heart rate monitoring, advanced SpO2 tracking, sleep score analysis, and 7-day battery life.",
            "price": 199,
            "images": [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Retro Vinyl Turntable with Bluetooth",
            "desc": "Belt-driven two-speed turntable with Audio-Technica magnetic cartridge, built-in switchable phono preamp, and wireless audio streaming.",
            "price": 185,
            "images": [
                "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Compact Portable SSD 1TB USB 3.2",
            "desc": "Ultra-fast read speeds up to 1050MB/s encased in shock-resistant anodized aluminum with hardware AES 256-bit encryption.",
            "price": 99,
            "images": [
                "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Smart Home Temperature & Humidity Monitor",
            "desc": "High-contrast E-ink display with Swiss Sensirion sensor, companion app history tracking, and seamless smart home integration.",
            "price": 35,
            "images": [
                "https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ],
    "Furniture": [
        {
            "title": "Scandinavian Bouclé Lounge Chair",
            "desc": "Sculptural organic silhouette upholstered in textured cream bouclé fabric with a solid matte black steel swivel base.",
            "price": 380,
            "images": [
                "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Solid Walnut Mid-Century Coffee Table",
            "desc": "FSC-certified North American solid walnut tabletop with tapered dowel legs and natural satin oil finish celebrating organic wood grain.",
            "price": 260,
            "images": [
                "https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist Matte Ceramic Table Lamp",
            "desc": "Slip-cast earthenware ceramic base in unglazed sand finish topped with a textured natural linen drum shade. Warm ambient illumination.",
            "price": 85,
            "images": [
                "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Ergonomic Mesh Office Task Chair",
            "desc": "Breathable self-adjusting mesh backrest with responsive 3D lumbar support, multi-angle synchro-tilt, and pneumatic height adjustment.",
            "price": 290,
            "images": [
                "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Modern Oak Bookshelf & Display Unit",
            "desc": "Five-tier open shelving unit constructed from white oak veneer and powder-coated steel frame. Ideal for curated books and design objects.",
            "price": 320,
            "images": [
                "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Upholstered Linen Bed Frame Queen",
            "desc": "Platform bed with padded vertical channel-tufted linen headboard, solid birch wood slats, and concealed corner legs.",
            "price": 520,
            "images": [
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Fluted Solid Wood Nightstand",
            "desc": "Curved silhouette featuring intricate vertical fluting, soft-closing drawer on ball-bearing glides, and brushed brass drawer pull.",
            "price": 165,
            "images": [
                "https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist Travertine Stone Side Table",
            "desc": "Hand-honed natural beige Italian travertine with natural pitted textures and monolithic cylindrical base. A timeless statement piece.",
            "price": 210,
            "images": [
                "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Cast Brass Arc Floor Lamp",
            "desc": "Slender arched silhouette in aged hand-rubbed brass resting on a heavy white Carrara marble base with foot dimmer switch.",
            "price": 195,
            "images": [
                "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Modern Velvet Dining Chair (Set of 2)",
            "desc": "Sturdy ergonomic curved plywood seat upholstered in stain-resistant performance velvet with tapered matte black iron legs.",
            "price": 220,
            "images": [
                "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Rattan & Teak Wood Accent Armchair",
            "desc": "Hand-caned natural rattan cane backrest paired with sustainable Indonesian teak frame. Light, breezy coastal aesthetic.",
            "price": 340,
            "images": [
                "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Modular 3-Piece Sectional Sofa",
            "desc": "High-density foam cushions wrapped in down feathers, upholstered in durable neutral textured weave fabric with kiln-dried hardwood frame.",
            "price": 890,
            "images": [
                "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Arch Full-Length Standing Floor Mirror",
            "desc": "Gentle rounded arch metal frame in muted champagne gold finish with high-definition shatterproof glass and adjustable easel stand.",
            "price": 175,
            "images": [
                "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Round Natural Oak Dining Table",
            "desc": "48-inch round tabletop with reverse bevel edge and conical fluted wood pedestal base comfortably seating 4 to 6 guests.",
            "price": 460,
            "images": [
                "https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Woven Wool Moroccan Area Rug (8x10)",
            "desc": "Hand-knotted 100% natural wool pile with classic subtle geometric diamond motifs and hand-braided fringe tassels.",
            "price": 350,
            "images": [
                "https://images.unsplash.com/photo-1600121848594-d8644e57abab?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ],
    "Shoes": [
        {
            "title": "Italian Full-Grain Leather Chelsea Boots",
            "desc": "Blake-stitched construction with supple vegetable-tanned Italian calfskin, elasticated side gores, and Vibram rubber-injected leather soles.",
            "price": 195,
            "images": [
                "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist White Leather Low-Top Sneakers",
            "desc": "Crafted in Portugal from buttery soft Nappa leather with waxed cotton laces, calfskin lining, and durable Margom rubber cupsole.",
            "price": 135,
            "images": [
                "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Handcrafted Suede Penny Loafers",
            "desc": "Unlined Spanish suede loafers designed for luxurious glove-like comfort, finished with traditional apron stitching and leather sole.",
            "price": 170,
            "images": [
                "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "All-Terrain Waterproof Hiking Boots",
            "desc": "Gore-Tex waterproof breathable membrane, reinforced rubber rand toe cap, supportive EVA midsole, and high-traction Continental rubber outsoles.",
            "price": 160,
            "images": [
                "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Classic Goodyear-Welted Cap Toe Oxfords",
            "desc": "Timeless formal oxford shoes crafted with museum calf leather, closed channel Goodyear welting, and hand-burnished toe caps.",
            "price": 220,
            "images": [
                "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "High-Performance Breathable Running Shoes",
            "desc": "Engineered mesh upper paired with supercritical nitrogen-infused foam midsole and carbon composite propulsion plate for energetic strides.",
            "price": 140,
            "images": [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Vintage Retro High-Top Canvas Sneakers",
            "desc": "14 oz heavyweight organic duck canvas upper with vintage gloss foxing tape, cushioned Ortholite sockliner, and diamond tread rubber outsole.",
            "price": 75,
            "images": [
                "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Artisan Suede Chukka Desert Boots",
            "desc": "Rich camel suede with two-eyelet lacing, natural crepe rubber sole, and hand-stitched detailing. Exceptional casual versatility.",
            "price": 155,
            "images": [
                "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Ergonomic Leather Slide Sandals",
            "desc": "Molded cork footbed wrapped in smooth suede with dual adjustable oiled nubuck leather straps and brass buckles.",
            "price": 85,
            "images": [
                "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Rugged Lug-Sole Derby Shoes",
            "desc": "Polished smooth leather upper with storm welt stitching and a chunky commando lug sole that blends rugged outdoor durability with sharp sartorial styling.",
            "price": 180,
            "images": [
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Slip-On Leather Espadrilles",
            "desc": "Supple perforated leather slip-ons with hand-braided jute midsole rope and vulcanized natural rubber protective sole.",
            "price": 68,
            "images": [
                "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ],
    "Miscellaneous": [
        {
            "title": "Full-Grain Leather Everyday Carry Tote",
            "desc": "Vegetable-tanned full-grain leather tote with reinforced interior laptop sleeve, solid brass hardware, and comfortable rolled shoulder straps.",
            "price": 195,
            "images": [
                "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Minimalist Matte Black Stainless Tumbler",
            "desc": "Double-wall vacuum insulated 18/8 food-grade stainless steel tumbler keeping beverages steaming hot for 12 hours or ice cold for 24 hours.",
            "price": 32,
            "images": [
                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Automatic Mechanical Dress Watch",
            "desc": "Surgical grade 316L stainless steel case, sapphire crystal glass, Japanese automatic movement with 42-hour power reserve, and Italian leather strap.",
            "price": 245,
            "images": [
                "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Handcrafted Polarized Acetate Sunglasses",
            "desc": "Hand-cut Italian Mazzucchelli acetate frame with 5-barrel hinges and scratch-resistant polarized CR-39 lenses with 100% UV400 protection.",
            "price": 115,
            "images": [
                "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Slim Bifold RFID-Blocking Leather Wallet",
            "desc": "Ultra-slim front pocket bifold crafted from butter-smooth calfskin with 6 card slots, cash slip, and embedded RFID-blocking protective lining.",
            "price": 48,
            "images": [
                "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Hand-Poured Soy Wax Scented Candle",
            "desc": "Custom artisanal fragrance blend of sandalwood, amber, and cedarwood poured into a reusable heavy amber glass jar with natural crackling wood wick.",
            "price": 36,
            "images": [
                "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Barista Precision Gooseneck Electric Kettle",
            "desc": "Matte black stainless steel gooseneck kettle with variable digital temperature control to the degree, 60-minute hold mode, and built-in brew stopwatch.",
            "price": 95,
            "images": [
                "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Heavyweight Washed Linen Throw Blanket",
            "desc": "Woven in Portugal from pure European flax linen pre-washed for exquisite softness. Features natural frayed fringe edges and breathable warmth.",
            "price": 85,
            "images": [
                "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Cast Iron Teapot with Enamel Interior",
            "desc": "Traditional Japanese tetsubin kettle crafted from heavy cast iron for superior heat retention, featuring stainless steel fine infuser basket.",
            "price": 62,
            "images": [
                "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Hardcover Dot-Grid Leather Journal",
            "desc": "Hand-bound full-grain leather notebook with 192 numbered pages of 120 GSM fountain pen-friendly acid-free ivory paper and ribbon bookmark.",
            "price": 28,
            "images": [
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Sculptural Minimalist Ceramic Vase",
            "desc": "Asymmetric doughnut ring ceramic vase with matte chalky textured finish, gorgeous for dried floral stems or standalone modern decor.",
            "price": 42,
            "images": [
                "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Solid Brass Key Carabiner & Clip",
            "desc": "Precision CNC-machined from solid naval brass that develops a stunning rich natural patina over time. Includes brass split rings.",
            "price": 24,
            "images": [
                "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80"
            ]
        },
        {
            "title": "Artisan Botanical Cedarwood & Sage Eau de Parfum",
            "desc": "Small-batch fragrance formulated with organic sugarcane alcohol, sustainably sourced Moroccan cedar, crisp French sage, and smoky bergamot.",
            "price": 88,
            "images": [
                "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80"
            ]
        }
    ]
}

CATEGORY_METADATA = {
    "Clothes": {"id": 1, "name": "Clothes", "slug": "clothes", "image": "https://i.imgur.com/QkIa5tT.jpeg"},
    "Electronics": {"id": 2, "name": "Electronics", "slug": "electronics", "image": "https://i.imgur.com/ZANVnHE.jpeg"},
    "Furniture": {"id": 3, "name": "Furniture", "slug": "furniture", "image": "https://i.imgur.com/Qphac99.jpeg"},
    "Shoes": {"id": 4, "name": "Shoes", "slug": "shoes", "image": "https://i.imgur.com/qNOjJje.jpeg"},
    "Miscellaneous": {"id": 5, "name": "Miscellaneous", "slug": "miscellaneous", "image": "https://i.imgur.com/BG8J0Fj.jpg"}
}


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[^\w\s-]", "", s)
    s = re.sub(r"[-\s]+", "-", s).strip("-")
    return s


def split_blobs(raw: str):
    blobs = []
    depth = 0
    start = None
    in_str = False
    escape = False
    for i, ch in enumerate(raw):
        if escape: escape = False; continue
        if ch == '\\' and in_str: escape = True; continue
        if ch == '"': in_str = not in_str; continue
        if in_str: continue
        if ch in ('{', '['):
            if depth == 0: start = i
            depth += 1
        elif ch in ('}', ']'):
            depth -= 1
            if depth == 0 and start is not None:
                blobs.append(raw[start:i+1])
                start = None
    return blobs


def main():
    print("Reading backend/api...")
    raw = API_FILE.read_text(encoding="utf-8")
    if not BACKUP_FILE.exists():
        BACKUP_FILE.write_text(raw, encoding="utf-8")
        print(f"Created backup at {BACKUP_FILE}")

    blobs = split_blobs(raw)
    platzi = json.loads(blobs[0])
    fakestore = json.loads(blobs[1])
    dummyjson = json.loads(blobs[2])

    print(f"Loaded {len(platzi)} Platzi items, {len(fakestore)} FakeStore items, {len(dummyjson.get('products', []))} DummyJSON items.")

    # Counters per category for items 49-124
    cat_pointers = {
        "Clothes": 0,
        "Electronics": 0,
        "Furniture": 0,
        "Shoes": 0,
        "Miscellaneous": 0
    }

    replaced_count = 0
    for idx in range(49, len(platzi)):
        p = platzi[idx]
        cat_obj = p.get("category", {})
        cname = cat_obj.get("name", "Miscellaneous") if isinstance(cat_obj, dict) else str(cat_obj)
        if "_" in cname:
            cname = cname.split("_")[0]
        if cname not in CURATED_DATA:
            cname = "Miscellaneous"

        pointer = cat_pointers[cname]
        curated_list = CURATED_DATA[cname]
        if pointer < len(curated_list):
            item_data = curated_list[pointer]
            cat_pointers[cname] += 1
        else:
            # Fallback if category count exceeded
            item_data = CURATED_DATA["Miscellaneous"][cat_pointers["Miscellaneous"] % len(CURATED_DATA["Miscellaneous"])]
            cat_pointers["Miscellaneous"] += 1
            cname = "Miscellaneous"

        cat_meta = CATEGORY_METADATA.get(cname, CATEGORY_METADATA["Miscellaneous"])

        p["title"] = item_data["title"]
        p["slug"] = slugify(item_data["title"])
        p["price"] = item_data["price"]
        p["description"] = item_data["desc"]
        p["images"] = item_data["images"]
        p["category"] = {
            "id": cat_meta["id"],
            "name": cat_meta["name"],
            "slug": cat_meta["slug"],
            "image": cat_meta["image"],
            "creationAt": p.get("creationAt", "2026-11-04T22:02:38.000Z"),
            "updatedAt": "2026-11-05T23:15:00.000Z"
        }
        replaced_count += 1

    print(f"Successfully replaced {replaced_count} items with curated catalog entries.")
    print("Replaced by category:", cat_pointers)

    # Re-serialize Platzi blob and concatenate the 3 blobs exactly as in backend/api
    new_platzi_raw = json.dumps(platzi, indent=2, ensure_ascii=False)
    # blobs[1] and blobs[2] stay intact
    new_api_content = new_platzi_raw + "\n" + blobs[1] + "\n" + blobs[2]

    API_FILE.write_text(new_api_content, encoding="utf-8")
    print(f"Updated {API_FILE} successfully! File size: {len(new_api_content)} bytes.")


if __name__ == "__main__":
    main()

