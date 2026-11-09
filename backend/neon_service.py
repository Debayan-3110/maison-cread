"""
Neon Cloud Backend Primitives Integration Module.
Provides high-performance clients for:
1. Lakebase Postgres (DATABASE_URL / DATABASE_URL_UNPOOLED)
2. Neon Object Storage (S3 S3-compatible bucket 'assets')
3. Neon Functions (Deployed long-running serverless functions)
4. Neon Auth (Managed Better Auth / JWKS verification)
5. Neon Realtime (Live SQL engine / WebSocket interface)
"""
import os
import time
import json
import urllib.request
from typing import Dict, Any, Optional, List
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

# 1. Environment Configurations
DATABASE_URL = os.getenv("DATABASE_URL")
DATABASE_URL_UNPOOLED = os.getenv("DATABASE_URL_UNPOOLED")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_ENDPOINT_URL_S3 = os.getenv("AWS_ENDPOINT_URL_S3")
AWS_REGION = os.getenv("AWS_REGION", "ap-southeast-1")
NEON_BUCKET = "assets"

NEON_FUNCTION_HOST_SUFFIX = os.getenv("NEON_FUNCTION_HOST_SUFFIX")
NEON_AUTH_BASE_URL = os.getenv("NEON_AUTH_BASE_URL")
NEON_AUTH_JWKS_URL = os.getenv("NEON_AUTH_JWKS_URL")
NEON_REALTIME_URL = os.getenv("NEON_REALTIME_URL")
NEON_REALTIME_SECRET = os.getenv("NEON_REALTIME_SECRET")

# Cached Boto3 S3 client
_s3_client = None

def get_s3_client():
    global _s3_client
    if _s3_client is None and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_ENDPOINT_URL_S3:
        import boto3
        from botocore.client import Config
        _s3_client = boto3.client(
            's3',
            endpoint_url=AWS_ENDPOINT_URL_S3,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            region_name=AWS_REGION,
            config=Config(s3={'addressing_style': 'path'}, signature_version='s3v4')
        )
    return _s3_client

# 1. Neon Postgres Connection Helper
def get_neon_postgres_connection():
    if not DATABASE_URL:
        return None
    import psycopg2
    from psycopg2.extras import RealDictCursor
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

# 2. Test Postgres
def test_postgres_service() -> Dict[str, Any]:
    t0 = time.time()
    try:
        conn = get_neon_postgres_connection()
        if not conn:
            return {"status": "error", "message": "DATABASE_URL not configured"}
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT version(), current_database(), current_user")
                info = cur.fetchone()
                cur.execute("SELECT COUNT(*), COUNT(DISTINCT thumbnail) FROM products")
                counts = cur.fetchone()
        conn.close()
        latency_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "connected",
            "latency_ms": latency_ms,
            "database": info["current_database"],
            "user": info["current_user"],
            "version": info["version"].split(",")[0],
            "total_products": counts["count"],
            "unique_thumbnails": counts["count_1"] if "count_1" in counts else counts["count"]
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "latency_ms": round((time.time() - t0) * 1000, 2)}

# 3. Test Object Storage
def test_storage_service() -> Dict[str, Any]:
    t0 = time.time()
    try:
        s3 = get_s3_client()
        if not s3:
            return {"status": "error", "message": "S3 credentials not configured"}
        
        # List objects in assets bucket
        res = s3.list_objects_v2(Bucket=NEON_BUCKET, MaxKeys=5)
        objects = [obj["Key"] for obj in res.get("Contents", [])]
        
        # Generate presigned sample URL
        presigned_sample = ""
        if objects:
            presigned_sample = s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': NEON_BUCKET, 'Key': objects[0]},
                ExpiresIn=3600
            )
        
        latency_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "connected",
            "bucket": NEON_BUCKET,
            "endpoint": AWS_ENDPOINT_URL_S3,
            "region": AWS_REGION,
            "sample_objects": objects,
            "sample_presigned_url": presigned_sample,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "latency_ms": round((time.time() - t0) * 1000, 2)}

# 4. Test Functions
def test_functions_service() -> Dict[str, Any]:
    t0 = time.time()
    func_url = f"https://br-billowing-dream-b3s5htej-hello{NEON_FUNCTION_HOST_SUFFIX}/"
    try:
        req = urllib.request.Request(func_url, headers={"User-Agent": "MaisonCread/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            body = response.read().decode("utf-8").strip()
            status_code = response.status
        latency_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "connected",
            "function_url": func_url,
            "http_status": status_code,
            "response": body,
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "function_url": func_url, "latency_ms": round((time.time() - t0) * 1000, 2)}

# 5. Test Auth
def test_auth_service() -> Dict[str, Any]:
    t0 = time.time()
    if not NEON_AUTH_JWKS_URL:
        return {"status": "error", "message": "NEON_AUTH_JWKS_URL not configured"}
    try:
        req = urllib.request.Request(NEON_AUTH_JWKS_URL, headers={"User-Agent": "MaisonCread/1.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
        latency_ms = round((time.time() - t0) * 1000, 2)
        keys = data.get("keys", [])
        return {
            "status": "connected",
            "base_url": NEON_AUTH_BASE_URL,
            "jwks_url": NEON_AUTH_JWKS_URL,
            "keys_count": len(keys),
            "key_ids": [k.get("kid") for k in keys],
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {"status": "error", "error": str(e), "latency_ms": round((time.time() - t0) * 1000, 2)}

# 6. Test Realtime
def test_realtime_service() -> Dict[str, Any]:
    t0 = time.time()
    has_secret = bool(NEON_REALTIME_SECRET and NEON_REALTIME_SECRET.startswith("nrt_live_"))
    return {
        "status": "configured" if has_secret else "unconfigured",
        "url": NEON_REALTIME_URL,
        "protocol": "wss",
        "secret_configured": has_secret,
        "secret_prefix": NEON_REALTIME_SECRET[:12] + "..." if has_secret else None,
        "latency_ms": round((time.time() - t0) * 1000, 2)
    }

# Comprehensive diagnostic
def get_all_neon_diagnostics() -> Dict[str, Any]:
    return {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "neon_project": {
            "id": "still-bonus-40391702",
            "branch": os.getenv("NEON_BRANCH", "production"),
            "branch_id": os.getenv("NEON_BRANCH_ID", "br-billowing-dream-b3s5htej"),
            "region": AWS_REGION
        },
        "services": {
            "postgres": test_postgres_service(),
            "object_storage": test_storage_service(),
            "functions": test_functions_service(),
            "auth": test_auth_service(),
            "realtime": test_realtime_service()
        }
    }

