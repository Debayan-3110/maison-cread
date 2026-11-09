"""
Setup and Seed Queryable Shipment, Warehouse & Local Store Tables in Neon PostgreSQL
===================================================================================
Creates schema:
- warehouses
- local_stores
- shipments
And populates curated luxury corridors with real-time GPS telemetry and timelines.
"""
import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ROOT_ENV)

DATABASE_URL = os.getenv("DATABASE_URL")

def init_neon_shipment_tables():
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not set in .env")

    print(f"[Neon Setup] Connecting to Neon PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("[Neon Setup] Creating 'warehouses' table in Neon...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(32) UNIQUE NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(128) NOT NULL,
        country VARCHAR(128) NOT NULL,
        latitude NUMERIC(10, 6) NOT NULL,
        longitude NUMERIC(10, 6) NOT NULL,
        capacity_sqft INTEGER DEFAULT 50000,
        status VARCHAR(32) DEFAULT 'active',
        contact_email VARCHAR(255),
        contact_phone VARCHAR(64),
        security_level VARCHAR(64) DEFAULT 'Tier 4 High-Assurance Vault',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)

    print("[Neon Setup] Creating 'local_stores' table in Neon...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS local_stores (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        store_code VARCHAR(32) UNIQUE NOT NULL,
        category VARCHAR(128) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(128) NOT NULL,
        state VARCHAR(128),
        postal_code VARCHAR(32),
        country VARCHAR(128) NOT NULL,
        latitude NUMERIC(10, 6) NOT NULL,
        longitude NUMERIC(10, 6) NOT NULL,
        operating_hours VARCHAR(255) DEFAULT '10:00 AM - 08:00 PM CET',
        manager_name VARCHAR(128),
        phone VARCHAR(64),
        email VARCHAR(255),
        is_pickup_point BOOLEAN DEFAULT TRUE,
        rating NUMERIC(3, 2) DEFAULT 4.95,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)

    print("[Neon Setup] Creating 'shipments' table in Neon...")
    cur.execute("""
    CREATE TABLE IF NOT EXISTS shipments (
        id VARCHAR(64) PRIMARY KEY,
        tracking_number VARCHAR(64) UNIQUE NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255),
        customer_phone VARCHAR(64),
        delivery_address TEXT NOT NULL,
        destination_city VARCHAR(128) NOT NULL,
        destination_lat NUMERIC(10, 6) NOT NULL,
        destination_lng NUMERIC(10, 6) NOT NULL,
        origin_warehouse_id VARCHAR(64) REFERENCES warehouses(id) ON DELETE SET NULL,
        assigned_local_store_id VARCHAR(64) REFERENCES local_stores(id) ON DELETE SET NULL,
        carrier_name VARCHAR(128) DEFAULT 'Maison Armored White-Glove Transit',
        carrier_license VARCHAR(64),
        courier_name VARCHAR(128),
        courier_phone VARCHAR(64),
        current_latitude NUMERIC(10, 6),
        current_longitude NUMERIC(10, 6),
        current_location_name VARCHAR(255),
        status VARCHAR(64) NOT NULL DEFAULT 'dispatched_transit',
        tamper_seal_id VARCHAR(64),
        temperature_celsius NUMERIC(4, 2) DEFAULT 18.2,
        estimated_delivery TIMESTAMP WITH TIME ZONE,
        actual_delivery TIMESTAMP WITH TIME ZONE,
        items_json JSONB DEFAULT '[]'::jsonb,
        timeline_json JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create Indexes for fast querying
    cur.execute("CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);")
    cur.execute("CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);")

    # 1. Seed Warehouses
    warehouses_data = [
        (
            "WH-PARIS-01",
            "Maison Central Cryo-Vault & Logistics Hub, Paris",
            "WH-CDG-PAR",
            "Zone de Fret 4, Aéroport Charles de Gaulle, 95700 Roissy-en-France",
            "Paris",
            "France",
            49.0097,
            2.5479,
            85000,
            "active",
            "vault.paris@shopcread.com",
            "+33 1 48 62 10 00",
            "Tier 4 High-Assurance Hermetic Vault"
        ),
        (
            "WH-LONDON-01",
            "Mayfair Sovereign Logistics & Vault Depot, London",
            "WH-LHR-LON",
            "South Perimeter Road, Heathrow Logistics Park, Hounslow TW6 2GW",
            "London",
            "United Kingdom",
            51.4700,
            -0.4543,
            62000,
            "active",
            "vault.london@shopcread.com",
            "+44 20 8745 0000",
            "Tier 4 Bonded Custody Vault"
        ),
        (
            "WH-TOKYO-01",
            "Tokyo Narita Sub-Orbital Vault Terminal",
            "WH-NRT-TYO",
            "Narita International Cargo Hub, Chiba 282-0004",
            "Tokyo",
            "Japan",
            35.7720,
            140.3929,
            95000,
            "active",
            "vault.tokyo@shopcread.com",
            "+81 476 34 5000",
            "Tier 4 Seismic-Insulated Cryo-Vault"
        ),
        (
            "WH-NY-01",
            "Manhattan JFK High-Security Escrow Terminal",
            "WH-JFK-NYC",
            "Building 77, JFK International Logistics Compound, Queens, NY 11430",
            "New York",
            "United States",
            40.6413,
            -73.7781,
            110000,
            "active",
            "vault.nyc@shopcread.com",
            "+1 718 244 4444",
            "Tier 4 Armed-Guard Armored Compound"
        ),
        (
            "WH-BLR-01",
            "Bangalore Devanahalli Aviation Vault",
            "WH-BLR-IND",
            "Cargo Terminal 2, Kempegowda International Airport, Devanahalli, Bengaluru 560300",
            "Bengaluru",
            "India",
            13.1986,
            77.7066,
            45000,
            "active",
            "vault.blr@shopcread.com",
            "+91 80 6678 2000",
            "Tier 4 Climate-Controlled Gemology Vault"
        )
    ]

    for wh in warehouses_data:
        cur.execute("""
        INSERT INTO warehouses (
            id, name, code, address, city, country, latitude, longitude,
            capacity_sqft, status, contact_email, contact_phone, security_level
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            status = EXCLUDED.status;
        """, wh)

    # 2. Seed Local Stores & Ateliers
    stores_data = [
        (
            "STORE-VENDOME-01",
            "Maison de l'Horlogerie — Place Vendôme",
            "STORE-PAR-01",
            "Haute Horlogerie & Timepieces",
            "12 Place Vendôme, 75001 Paris",
            "Paris",
            "Île-de-France",
            "75001",
            "France",
            48.8675,
            2.3294,
            "10:00 AM - 07:30 PM CET",
            "Henri de Montmirail",
            "+33 1 42 61 50 00",
            "vendome@shopcread.com",
            True,
            4.98
        ),
        (
            "STORE-FAUBOURG-02",
            "Atelier Vaneau Leathercraft & Rare Gems",
            "STORE-PAR-02",
            "Rare Leather Goods & Fine Jewelry",
            "24 Rue du Faubourg Saint-Honoré, 75008 Paris",
            "Paris",
            "Île-de-France",
            "75008",
            "France",
            48.8698,
            2.3204,
            "10:00 AM - 08:00 PM CET",
            "Camille Laurent",
            "+33 1 42 68 00 20",
            "faubourg@shopcread.com",
            True,
            4.95
        ),
        (
            "STORE-BOND-01",
            "Mayfair Haute Joaillerie — Old Bond Street",
            "STORE-LON-01",
            "High Jewelry & Sovereign Diamonds",
            "14 Old Bond Street, Mayfair, London W1S 4PP",
            "London",
            "Greater London",
            "W1S 4PP",
            "United Kingdom",
            51.5090,
            -0.1415,
            "10:00 AM - 06:30 PM GMT",
            "Sir Alistair Sterling",
            "+44 20 7493 0000",
            "bondstreet@shopcread.com",
            True,
            4.97
        ),
        (
            "STORE-GINZA-01",
            "Ginza Heritage Watch & Art Gallery",
            "STORE-TYO-01",
            "Curated Heritage & Grand Complications",
            "6-10-1 Ginza, Chuo-ku, Tokyo 104-0061",
            "Tokyo",
            "Kanto",
            "104-0061",
            "Japan",
            35.6696,
            139.7640,
            "11:00 AM - 08:30 PM JST",
            "Kenji Takahashi",
            "+81 3 3571 0000",
            "ginza@shopcread.com",
            True,
            4.99
        ),
        (
            "STORE-MADISON-01",
            "Madison Avenue Sovereign Collection",
            "STORE-NYC-01",
            "High Jewelry & Timepieces",
            "680 Madison Avenue, New York, NY 10065",
            "New York",
            "New York",
            "10065",
            "United States",
            40.7648,
            -73.9708,
            "10:00 AM - 07:00 PM EST",
            "Victoria Sterling",
            "+1 212 555 0199",
            "madison@shopcread.com",
            True,
            4.96
        ),
        (
            "STORE-UB-01",
            "UB City Luxury Arcade Atelier",
            "STORE-BLR-01",
            "Rare Gems, Silk & Luxury Horology",
            "24 Vittal Mallya Road, UB City, Bengaluru 560001",
            "Bengaluru",
            "Karnataka",
            "560001",
            "India",
            12.9716,
            77.5959,
            "11:00 AM - 09:00 PM IST",
            "Rohan Singhania",
            "+91 80 4000 1000",
            "ubcity@shopcread.com",
            True,
            4.94
        )
    ]

    for st in stores_data:
        cur.execute("""
        INSERT INTO local_stores (
            id, name, store_code, category, address, city, state, postal_code,
            country, latitude, longitude, operating_hours, manager_name, phone,
            email, is_pickup_point, rating
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            address = EXCLUDED.address,
            latitude = EXCLUDED.latitude,
            longitude = EXCLUDED.longitude,
            operating_hours = EXCLUDED.operating_hours;
        """, st)

    # 3. Seed Realistic Shipments with Full Timelines & Telemetry
    now = datetime.now(timezone.utc)

    # Shipment 1: Active in Paris (Out for Delivery)
    timeline_1 = [
        {
            "step": 1,
            "stage": "order_confirmed",
            "title": "Order Sovereign Registration",
            "location": "Maison Cloud Infrastructure Gateway",
            "timestamp": (now - timedelta(hours=14)).isoformat(),
            "status": "completed",
            "details": "Order confirmed and cryptographically verified under escrow contract."
        },
        {
            "step": 2,
            "stage": "warehouse_allocated",
            "title": "Warehouse Custody Allocation",
            "location": "Maison Central Cryo-Vault, Roissy-en-France (WH-PARIS-01)",
            "timestamp": (now - timedelta(hours=11)).isoformat(),
            "status": "completed",
            "details": "Allocated from Vault Chamber 04B. Cold-chain cryo-lock engaged at 18.2°C."
        },
        {
            "step": 3,
            "stage": "vault_authenticated",
            "title": "Sub-Millimeter Forensic Inspection",
            "location": "Roissy Certification Desk",
            "timestamp": (now - timedelta(hours=7)).isoformat(),
            "status": "completed",
            "details": "Tamper-evident holographic micro-seal applied (#SEAL-PAR-89412)."
        },
        {
            "step": 4,
            "stage": "dispatched_transit",
            "title": "Armored High-Security Transit",
            "location": "A1 Autoroute Corridor, Paris Entry Gate",
            "timestamp": (now - timedelta(hours=3)).isoformat(),
            "status": "completed",
            "details": "Armed white-glove transport vehicle FR-782-MC en route."
        },
        {
            "step": 5,
            "stage": "store_received",
            "title": "Partner Boutique Waypoint Check-In",
            "location": "Maison de l'Horlogerie — Place Vendôme (STORE-VENDOME-01)",
            "timestamp": (now - timedelta(hours=1)).isoformat(),
            "status": "completed",
            "details": "Hand-off scan verified by Master Horologist Henri de Montmirail."
        },
        {
            "step": 6,
            "stage": "out_for_delivery",
            "title": "Out for Hand-to-Hand Delivery",
            "location": "Faubourg Saint-Honoré Diplomatic District, Paris",
            "timestamp": (now - timedelta(minutes=25)).isoformat(),
            "status": "active",
            "details": "Dedicated courier Jean-Luc Moreau is 1.2 km away. ETA 20 minutes."
        }
    ]

    items_1 = [
        {
            "id": 101,
            "title": "Patek Philippe Grand Complications Celestial",
            "price": 385000,
            "quantity": 1,
            "serial": "PP-9824-CAL-2026",
            "thumbnail": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
        },
        {
            "id": 102,
            "title": "Hermès Crocodile Porosus 35 Special Order",
            "price": 115000,
            "quantity": 1,
            "serial": "HERM-PAR-7789",
            "thumbnail": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
        }
    ]

    # Shipment 2: London Mayfair (Dispatched in Transit)
    timeline_2 = [
        {
            "step": 1,
            "stage": "order_confirmed",
            "title": "Order Sovereign Registration",
            "location": "London Financial Escrow Gateway",
            "timestamp": (now - timedelta(hours=8)).isoformat(),
            "status": "completed",
            "details": "Bank wire custody cleared."
        },
        {
            "step": 2,
            "stage": "warehouse_allocated",
            "title": "Warehouse Custody Allocation",
            "location": "Mayfair Sovereign Logistics (WH-LONDON-01)",
            "timestamp": (now - timedelta(hours=5)).isoformat(),
            "status": "completed",
            "details": "Secured in high-security biometric vault."
        },
        {
            "step": 3,
            "stage": "vault_authenticated",
            "title": "Gemological Seal Verification",
            "location": "Heathrow Vault Laboratory",
            "timestamp": (now - timedelta(hours=2)).isoformat(),
            "status": "completed",
            "details": "GIA Master Certificate and forensic laser inscription verified."
        },
        {
            "step": 4,
            "stage": "dispatched_transit",
            "title": "Armored High-Security Transit",
            "location": "M4 London Inbound Corridor",
            "timestamp": (now - timedelta(minutes=40)).isoformat(),
            "status": "active",
            "details": "Armored transport vehicle UK-26-MAISON en route to Old Bond Street Atelier."
        }
    ]

    items_2 = [
        {
            "id": 201,
            "title": "Cartier High Jewelry Emerald & Diamond Parure",
            "price": 420000,
            "quantity": 1,
            "serial": "CRT-EMR-0982",
            "thumbnail": "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80"
        }
    ]

    # Shipment 3: Bangalore UB City (Delivered)
    timeline_3 = [
        {
            "step": 1,
            "stage": "order_confirmed",
            "title": "Order Confirmed",
            "location": "Bangalore Cloud Node",
            "timestamp": (now - timedelta(days=2)).isoformat(),
            "status": "completed",
            "details": "Verified."
        },
        {
            "step": 2,
            "stage": "warehouse_allocated",
            "title": "Vault Assigned",
            "location": "Bangalore Airport Vault (WH-BLR-01)",
            "timestamp": (now - timedelta(days=1, hours=18)).isoformat(),
            "status": "completed",
            "details": "Vault clearance complete."
        },
        {
            "step": 3,
            "stage": "store_received",
            "title": "UB City Atelier Inspection",
            "location": "UB City Luxury Arcade (STORE-UB-01)",
            "timestamp": (now - timedelta(hours=20)).isoformat(),
            "status": "completed",
            "details": "Prepped for VIP client handover."
        },
        {
            "step": 4,
            "stage": "delivered",
            "title": "Hand-to-Hand Delivery Completed",
            "location": "Lavelle Road Residence, Bengaluru",
            "timestamp": (now - timedelta(hours=2)).isoformat(),
            "status": "completed",
            "details": "Signed and biometric biometric receipt authenticated."
        }
    ]

    items_3 = [
        {
            "id": 301,
            "title": "Audemars Piguet Royal Oak Double Balance Wheel Openworked",
            "price": 145000,
            "quantity": 1,
            "serial": "AP-RO-OPEN-2026",
            "thumbnail": "https://images.unsplash.com/photo-1547996160-71dfabb19299?auto=format&fit=crop&w=600&q=80"
        }
    ]

    shipments_data = [
        (
            "SHP-2026-89412",
            "SHP-2026-89412",
            "MC-ORD-2026-79102",
            "Lady Jacqueline Vance",
            "jacqueline.vance@maison.luxury",
            "+33 6 12 34 56 78",
            "22 Rue du Faubourg Saint-Honoré, 75008 Paris, France",
            "Paris",
            48.8698,
            2.3204,
            "WH-PARIS-01",
            "STORE-VENDOME-01",
            "Maison Armored White-Glove Transit",
            "ARMOR-FR-782",
            "Jean-Luc Moreau",
            "+33 6 98 76 54 32",
            48.8685,
            2.3245,
            "Rue Royale Corridor, 8th Arrondissement, Paris",
            "out_for_delivery",
            "SEAL-PAR-89412",
            18.2,
            (now + timedelta(minutes=25)).isoformat(),
            None,
            json.dumps(items_1),
            json.dumps(timeline_1)
        ),
        (
            "SHP-2026-90455",
            "SHP-2026-90455",
            "MC-ORD-2026-55120",
            "Lord Archibald Sterling",
            "archibald.sterling@mayfair.co.uk",
            "+44 7700 900123",
            "18 Kensington Palace Gardens, London W8 4QQ",
            "London",
            51.5065,
            -0.1905,
            "WH-LONDON-01",
            "STORE-BOND-01",
            "Sovereign Security Transport UK",
            "UK-ARM-004",
            "Arthur Pendelton",
            "+44 7700 900456",
            51.4920,
            -0.2100,
            "Chiswick Flyover High-Security Transit Corridor",
            "dispatched_transit",
            "SEAL-LON-90455",
            17.8,
            (now + timedelta(hours=2, minutes=15)).isoformat(),
            None,
            json.dumps(items_2),
            json.dumps(timeline_2)
        ),
        (
            "SHP-2026-77810",
            "SHP-2026-77810",
            "MC-ORD-2026-11894",
            "Vikramaditya Roy",
            "v.roy@conglomerate.in",
            "+91 98450 12345",
            "Penthouse 4B, Lavelle Road, Shanthala Nagar, Bengaluru 560001",
            "Bengaluru",
            12.9716,
            77.5959,
            "WH-BLR-01",
            "STORE-UB-01",
            "Apex Luxury Escort India",
            "KA-01-EXP-8899",
            "Devendra Gowda",
            "+91 98450 99887",
            12.9716,
            77.5959,
            "Customer Private Residence, Lavelle Road",
            "delivered",
            "SEAL-BLR-77810",
            19.1,
            (now - timedelta(hours=2)).isoformat(),
            (now - timedelta(hours=2)).isoformat(),
            json.dumps(items_3),
            json.dumps(timeline_3)
        )
    ]

    for shp in shipments_data:
        cur.execute("""
        INSERT INTO shipments (
            id, tracking_number, order_id, customer_name, customer_email, customer_phone,
            delivery_address, destination_city, destination_lat, destination_lng,
            origin_warehouse_id, assigned_local_store_id, carrier_name, carrier_license,
            courier_name, courier_phone, current_latitude, current_longitude,
            current_location_name, status, tamper_seal_id, temperature_celsius,
            estimated_delivery, actual_delivery, items_json, timeline_json
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            current_latitude = EXCLUDED.current_latitude,
            current_longitude = EXCLUDED.current_longitude,
            current_location_name = EXCLUDED.current_location_name,
            timeline_json = EXCLUDED.timeline_json,
            updated_at = CURRENT_TIMESTAMP;
        """, shp)

    cur.close()
    conn.close()
    print("[Neon Setup] Successfully initialized queryable 'warehouses', 'local_stores', and 'shipments' in Neon PostgreSQL!")

if __name__ == "__main__":
    init_neon_shipment_tables()
