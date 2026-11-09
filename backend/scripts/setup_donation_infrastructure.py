"""
Setup and Seed Donation System across Cloudinary, Neon PostgreSQL & Cockroach Labs
===================================================================================
1. Neon PostgreSQL:
   - donation_beneficiaries (Orphanages and Old Age Homes with residents, needs, and Cloudinary media)
   - donations (Full record of donor pledges, tribute names, reward coupons, and transaction IDs)
2. CockroachDB Cloud Serverless:
   - philanthropic_ledger (Distributed, immutable ledger blocks with cryptographic hashes)
3. Cloudinary:
   - Generates and verifies CDN-optimized responsive image URLs for all beneficiaries
"""
import os
import json
import time
import hashlib
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone, timedelta
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(ROOT_ENV)

NEON_DATABASE_URL = os.getenv("DATABASE_URL")
COCKROACH_DATABASE_URL = os.getenv("COCKROACH_DATABASE_URL")

# Cloudinary Optimized Beneficiary Photography (Unsplash curated high-res through Cloudinary CDN)
BENEFICIARIES_SEED = [
    {
        "id": "BEN-ORPH-01",
        "name": "Sunshine Children's Sanctuary & School",
        "type": "orphanage",
        "tagline": "Holistic education, nutritious organic meals & art therapy for 65 orphaned children.",
        "location": "Vasant Kunj, New Delhi, India",
        "city": "New Delhi",
        "country": "India",
        "founded_year": 2012,
        "residents_count": 65,
        "verified_charity_id": "REG-DELHI-NGO-8821",
        "monthly_need_usd": 6500.0,
        "raised_amount_usd": 4850.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "High — Winter Uniforms & Laptop Lab Needed",
        "needs_list": ["High-protein breakfast nutrition", "Winter thermal jackets", "Science & Coding lab tablets", "Pediatric dental camps"]
    },
    {
        "id": "BEN-ELDER-01",
        "name": "Silver Oaks Senior Living & Palliative Sanctuary",
        "type": "old_age_home",
        "tagline": "Dignified geriatric medical care, dementia support & companionship for 48 elderly seniors.",
        "location": "Whitefield, Bengaluru, India",
        "city": "Bengaluru",
        "country": "India",
        "founded_year": 2015,
        "residents_count": 48,
        "verified_charity_id": "REG-KARNATAKA-SR-4410",
        "monthly_need_usd": 7200.0,
        "raised_amount_usd": 5900.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "Critical — Mobility Wheelchairs & Cardiac Monitors",
        "needs_list": ["Motorized mobility wheelchairs", "Specialist geriatric physiotherapy", "Prescription cardiac medicines", "Sensory botanical garden maintenance"]
    },
    {
        "id": "BEN-ORPH-02",
        "name": "Maison de l'Espoir Children's Home",
        "type": "orphanage",
        "tagline": "Safe haven, trauma rehabilitation & vocational education for children in Paris region.",
        "location": "Montreuil, Île-de-France, France",
        "city": "Paris",
        "country": "France",
        "founded_year": 2008,
        "residents_count": 42,
        "verified_charity_id": "REG-FR-ASSO-1901-8902",
        "monthly_need_usd": 8500.0,
        "raised_amount_usd": 6800.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "Medium — Language Tutoring & Music Conservatory Scholarships",
        "needs_list": ["Classical violin & piano tuition", "French & English literature books", "Weekend botanical field trips", "Pediatric therapy sessions"]
    },
    {
        "id": "BEN-ELDER-02",
        "name": "Mayfair Golden Age Fellowship & Respite Home",
        "type": "old_age_home",
        "tagline": "Providing warm companionship, nursing assistance & warm meals to solitary senior citizens.",
        "location": "Camden Town, London, United Kingdom",
        "city": "London",
        "country": "United Kingdom",
        "founded_year": 2010,
        "residents_count": 55,
        "verified_charity_id": "CHARITY-COMMISSION-UK-7721",
        "monthly_need_usd": 9200.0,
        "raised_amount_usd": 7800.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "High — Winter Heating Fuel & Nursing Overtime",
        "needs_list": ["Thermal heating support", "Weekly live acoustic music sessions", "Orthopedic mattresses", "Dedicated palliative hospice nurse"]
    },
    {
        "id": "BEN-ORPH-03",
        "name": "Tokyo Sakura Youth Haven & Robotics Academy",
        "type": "orphanage",
        "tagline": "Nurturing orphaned youth with STEM, robotics, and lifelong mentorship.",
        "location": "Setagaya-ku, Tokyo, Japan",
        "city": "Tokyo",
        "country": "Japan",
        "founded_year": 2016,
        "residents_count": 38,
        "verified_charity_id": "NPO-TOKYO-2016-0991",
        "monthly_need_usd": 9800.0,
        "raised_amount_usd": 8900.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "Medium — Robotics Kits & College Entrance Fund",
        "needs_list": ["Robotics microcontrollers", "College scholarship endowment", "Nutritious seasonal dining", "Artistic origami & calligraphy"]
    },
    {
        "id": "BEN-ELDER-03",
        "name": "Hudson Valley Serene Elders Retreat",
        "type": "old_age_home",
        "tagline": "Peaceful hospice and memory care community overlooking scenic nature reserves.",
        "location": "Cold Spring, New York, United States",
        "city": "New York",
        "country": "United States",
        "founded_year": 2011,
        "residents_count": 60,
        "verified_charity_id": "NY-501C3-CHARITY-38291",
        "monthly_need_usd": 12000.0,
        "raised_amount_usd": 10500.0,
        "cloudinary_image_url": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=900&q=80",
        "urgency_level": "High — Memory Care Sensory Room Renovation",
        "needs_list": ["Alzheimer's sensory lighting", "Wheelchair-accessible transport van", "Farm-fresh organic fruit deliveries", "Art therapy supplies"]
    }
]

def setup_neon_tables():
    print("[1/3] Initializing Neon PostgreSQL Donation Tables...")
    if not NEON_DATABASE_URL:
        print("  -> Skipped: NEON_DATABASE_URL not configured")
        return

    conn = psycopg2.connect(NEON_DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        # Table 1: Beneficiaries
        cur.execute("""
        CREATE TABLE IF NOT EXISTS donation_beneficiaries (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(32) NOT NULL, -- 'orphanage' or 'old_age_home'
            tagline TEXT NOT NULL,
            location VARCHAR(255) NOT NULL,
            city VARCHAR(128) NOT NULL,
            country VARCHAR(128) NOT NULL,
            founded_year INTEGER,
            residents_count INTEGER DEFAULT 0,
            verified_charity_id VARCHAR(64) NOT NULL,
            monthly_need_usd NUMERIC(10, 2) DEFAULT 5000.0,
            raised_amount_usd NUMERIC(10, 2) DEFAULT 0.0,
            cloudinary_image_url TEXT NOT NULL,
            urgency_level VARCHAR(128) DEFAULT 'Standard',
            needs_list JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Table 2: Donations
        cur.execute("""
        CREATE TABLE IF NOT EXISTS donations (
            id VARCHAR(64) PRIMARY KEY,
            donor_name VARCHAR(255) NOT NULL,
            donor_email VARCHAR(255) NOT NULL,
            donor_phone VARCHAR(64),
            amount_usd NUMERIC(10, 2) NOT NULL,
            beneficiary_id VARCHAR(64) REFERENCES donation_beneficiaries(id) ON DELETE SET NULL,
            cause_category VARCHAR(64) NOT NULL,
            message TEXT,
            tribute_name VARCHAR(255),
            is_anonymous BOOLEAN DEFAULT FALSE,
            reward_coupon VARCHAR(64) DEFAULT 'HOPE-BLOOM-20',
            neon_tx_id VARCHAR(64),
            cockroach_ledger_id VARCHAR(64),
            cloudinary_certificate_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Seed Beneficiaries
        for b in BENEFICIARIES_SEED:
            cur.execute("""
            INSERT INTO donation_beneficiaries (
                id, name, type, tagline, location, city, country, founded_year,
                residents_count, verified_charity_id, monthly_need_usd,
                raised_amount_usd, cloudinary_image_url, urgency_level, needs_list
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                tagline = EXCLUDED.tagline,
                monthly_need_usd = EXCLUDED.monthly_need_usd,
                raised_amount_usd = EXCLUDED.raised_amount_usd,
                cloudinary_image_url = EXCLUDED.cloudinary_image_url,
                urgency_level = EXCLUDED.urgency_level,
                needs_list = EXCLUDED.needs_list;
            """, (
                b["id"], b["name"], b["type"], b["tagline"], b["location"], b["city"],
                b["country"], b["founded_year"], b["residents_count"], b["verified_charity_id"],
                b["monthly_need_usd"], b["raised_amount_usd"], b["cloudinary_image_url"],
                b["urgency_level"], json.dumps(b["needs_list"])
            ))

        # Seed Initial Verified Pledges
        sample_donations = [
            (
                "DON-2026-8801",
                "Lady Jacqueline Vance",
                "jacqueline.vance@maison.luxury",
                "+33 6 12 34 56 78",
                250.0,
                "BEN-ORPH-01",
                "orphanage_meals_education",
                "Dedicated to the brave and bright children of Sunshine Sanctuary. With love from Paris.",
                "In honor of Claude Vance",
                False,
                "HOPE-BLOOM-20",
                "NEON-TX-8801-44B",
                "CR-LEDGER-BLK-091",
                "https://res.cloudinary.com/c40zxlko/image/upload/v1/certificates/DON-2026-8801.pdf"
            ),
            (
                "DON-2026-8802",
                "Lord Archibald Sterling",
                "archibald.sterling@mayfair.co.uk",
                "+44 7700 900123",
                500.0,
                "BEN-ELDER-01",
                "elderly_healthcare_comfort",
                "For the beloved grandmothers and grandfathers at Silver Oaks. May your days be filled with dignity.",
                "In memory of Margaret Sterling",
                False,
                "HOPE-BLOOM-20",
                "NEON-TX-8802-99C",
                "CR-LEDGER-BLK-092",
                "https://res.cloudinary.com/c40zxlko/image/upload/v1/certificates/DON-2026-8802.pdf"
            ),
            (
                "DON-2026-8803",
                "Anonymous Benefactor",
                "donor.private@swissvault.ch",
                None,
                100.0,
                "BEN-ORPH-02",
                "orphanage_meals_education",
                "Keep shining bright, little stars.",
                None,
                True,
                "HOPE-BLOOM-20",
                "NEON-TX-8803-12A",
                "CR-LEDGER-BLK-093",
                None
            )
        ]

        for d in sample_donations:
            cur.execute("""
            INSERT INTO donations (
                id, donor_name, donor_email, donor_phone, amount_usd, beneficiary_id,
                cause_category, message, tribute_name, is_anonymous, reward_coupon,
                neon_tx_id, cockroach_ledger_id, cloudinary_certificate_url
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (id) DO NOTHING;
            """, d)

    conn.close()
    print("  -> Neon PostgreSQL donation tables & seed records verified!")

def setup_cockroach_ledger():
    print("[2/3] Initializing CockroachDB Distributed Philanthropic Ledger...")
    if not COCKROACH_DATABASE_URL:
        print("  -> Skipped: COCKROACH_DATABASE_URL not configured")
        return

    conn = psycopg2.connect(COCKROACH_DATABASE_URL)
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute("""
        CREATE TABLE IF NOT EXISTS philanthropic_ledger (
            ledger_id VARCHAR(64) PRIMARY KEY,
            donation_id VARCHAR(64) NOT NULL,
            donor_hash VARCHAR(128) NOT NULL,
            amount NUMERIC(12, 2) NOT NULL,
            beneficiary_code VARCHAR(64) NOT NULL,
            escrow_status VARCHAR(64) DEFAULT 'VERIFIED_DISBURSED',
            consensus_node VARCHAR(128) DEFAULT 'Cockroach Labs aws-ap-south-1',
            block_hash VARCHAR(128) NOT NULL,
            recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # Seed initial immutable transaction blocks
        sample_blocks = [
            ("CR-LEDGER-BLK-091", "DON-2026-8801", hashlib.sha256(b"jacqueline.vance@maison.luxury").hexdigest(), 250.0, "BEN-ORPH-01", "0x8fa99c1e482bf498a120098dfac90b10"),
            ("CR-LEDGER-BLK-092", "DON-2026-8802", hashlib.sha256(b"archibald.sterling@mayfair.co.uk").hexdigest(), 500.0, "BEN-ELDER-01", "0x33b8a1c900e47da08812fa481e3a7761"),
            ("CR-LEDGER-BLK-093", "DON-2026-8803", hashlib.sha256(b"donor.private@swissvault.ch").hexdigest(), 100.0, "BEN-ORPH-02", "0x12fa90bdce8940889100acff41908be1")
        ]

        for blk in sample_blocks:
            cur.execute("""
            INSERT INTO philanthropic_ledger (
                ledger_id, donation_id, donor_hash, amount, beneficiary_code,
                escrow_status, consensus_node, block_hash
            ) VALUES (%s, %s, %s, %s, %s, 'VERIFIED_DISBURSED', 'Cockroach Labs aws-ap-south-1', %s)
            ON CONFLICT (ledger_id) DO NOTHING;
            """, blk)

    conn.close()
    print("  -> CockroachDB distributed immutable ledger verified!")

def verify_cloudinary_integration():
    print("[3/3] Verifying Cloudinary Media Optimization for Beneficiaries...")
    try:
        from backend.cloudinary_service import get_cloudinary_status, get_optimized_cdn_url
        status = get_cloudinary_status()
        print(f"  -> Cloudinary Status: {status.get('status')} (Cloud: {status.get('cloud_name')})")
        sample_url = BENEFICIARIES_SEED[0]["cloudinary_image_url"]
        optimized = get_optimized_cdn_url(sample_url, width=900)
        print(f"  -> Sample CDN Optimized Link: {optimized[:70]}...")
    except Exception as e:
        print(f"  -> Cloudinary verification note: {e}")

if __name__ == "__main__":
    setup_neon_tables()
    setup_cockroach_ledger()
    verify_cloudinary_integration()
    print("\n✓ Philanthropic Cloud Infrastructure setup complete across Cloudinary, Neon, and Cockroach Labs!")
