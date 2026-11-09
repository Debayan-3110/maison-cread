"""
CockroachDB Cloud / Cockroach Labs Storage Integration Module.
Provides high-resilience distributed SQL storage for Maison Cread.
Compatible with CockroachDB Serverless / Dedicated clusters.
"""
import os
import time
from typing import Dict, Any, Optional
from pathlib import Path
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

COCKROACH_USER = os.getenv("COCKROACH_USER", os.getenv("USER ID", "debayan")).strip()
COCKROACH_PASSWORD = os.getenv("COCKROACH_PASSWORD", os.getenv("PASSWORD", "QIfEFO7_UwPQRU4vFMdYhQ")).strip()
COCKROACH_HOST = os.getenv("COCKROACH_HOST", "").strip()
COCKROACH_PORT = os.getenv("COCKROACH_PORT", "26257").strip()
COCKROACH_DATABASE = os.getenv("COCKROACH_DATABASE", "defaultdb").strip()
COCKROACH_DATABASE_URL = os.getenv("COCKROACH_DATABASE_URL", "").strip()

def get_cockroach_connection_string() -> Optional[str]:
    load_dotenv(ROOT_ENV, override=True)
    db_url = os.getenv("COCKROACH_DATABASE_URL", "").strip()
    if db_url:
        return db_url
    user = os.getenv("COCKROACH_USER", "debayan").strip()
    pw = os.getenv("COCKROACH_PASSWORD", "QIfEFO7_UwPQRU4vFMdYhQ").strip()
    host = os.getenv("COCKROACH_HOST", "").strip()
    port = os.getenv("COCKROACH_PORT", "26257").strip()
    db = os.getenv("COCKROACH_DATABASE", "defaultdb").strip()
    if host and user and pw:
        return f"postgresql://{user}:{pw}@{host}:{port}/{db}?sslmode=verify-full"
    return None

def get_cockroach_connection():
    conn_str = get_cockroach_connection_string()
    if not conn_str:
        return None
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2.connect(conn_str, cursor_factory=RealDictCursor)

def test_cockroach_service() -> Dict[str, Any]:
    t0 = time.time()
    conn_str = get_cockroach_connection_string()
    if not conn_str:
        return {
            "status": "pending_host",
            "message": "CockroachDB user credentials configured. Awaiting Cockroach Labs cluster host (e.g. cluster-name.cockroachlabs.cloud).",
            "user": COCKROACH_USER,
            "has_password": bool(COCKROACH_PASSWORD),
            "latency_ms": 0
        }
    
    try:
        conn = get_cockroach_connection()
        if not conn:
            return {"status": "error", "message": "Could not connect to CockroachDB"}
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version(), current_database(), current_user")
                info = cur.fetchone()
                
                # Check tables and count
                cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
                tables = [r["table_name"] for r in cur.fetchall()]

                product_count = 0
                if "products" in tables:
                    cur.execute("SELECT count(*) FROM products")
                    product_count = cur.fetchone()["count"]
        conn.close()
        latency_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "connected",
            "cluster": "CockroachDB Cloud Serverless (aws-ap-south-1)",
            "version": info.get("version", "").split("\n")[0],
            "database": info.get("current_database"),
            "user": info.get("current_user"),
            "tables": tables,
            "total_products": product_count,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {
            "status": "connection_failed",
            "error": str(e),
            "latency_ms": round((time.time() - t0) * 1000, 2)
        }

