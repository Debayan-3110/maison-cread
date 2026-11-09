"""
Cloudinary Image Storage, Transformation & Global CDN Edge Cache Integration.
Provides high-performance media optimization for Maison Cread.
"""
import os
import time
from typing import Dict, Any, Optional, List
from pathlib import Path

# Safe resilient imports for environment and Cloudinary SDK with linter type ignores
try:
    from dotenv import load_dotenv  # type: ignore[import-untyped]
except ImportError:
    def load_dotenv(*args, **kwargs):  # type: ignore
        pass

try:
    import cloudinary  # type: ignore[import-untyped]
    import cloudinary.uploader  # type: ignore[import-untyped]
    import cloudinary.api  # type: ignore[import-untyped]
    import cloudinary.utils  # type: ignore[import-untyped]
except ImportError:
    cloudinary = None

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"

def init_cloudinary() -> str:
    """Initializes Cloudinary SDK configuration with credentials from .env."""
    if ROOT_ENV.exists():
        load_dotenv(ROOT_ENV, override=True)

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "c40zxlko").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "423778744339999").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "gUpmasw1m9zfZS9C-k1SDcYP4Wo").strip()
    cloudinary_url = os.getenv("CLOUDINARY_URL", "").strip()

    if cloudinary_url:
        os.environ["CLOUDINARY_URL"] = cloudinary_url

    if cloudinary is not None:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )

    return cloud_name

def get_cloudinary_status() -> Dict[str, Any]:
    """Returns connectivity, account metrics, and edge features."""
    t0 = time.time()
    if cloudinary is None:
        return {
            "status": "error",
            "error": "Cloudinary SDK is not installed in the active Python environment.",
            "latency_ms": 0.0
        }

    try:
        cloud_name = init_cloudinary()
        ping_res = cloudinary.api.ping()
        usage_res = cloudinary.api.usage()
        latency_ms = round((time.time() - t0) * 1000, 2)
        return {
            "status": "connected",
            "cloud_name": cloud_name,
            "plan": usage_res.get("plan", "Free"),
            "ping": ping_res.get("status", "ok"),
            "credits_used": usage_res.get("credits", {}).get("usage", 0.0),
            "credits_limit": usage_res.get("credits", {}).get("limit", 25.0),
            "resources_count": usage_res.get("resources", 0),
            "cdn_features": [
                "Automatic WebP/AVIF Negotiation (f_auto)",
                "Perceptual Quality Compression (q_auto)",
                "Edge-Cached CDN Delivery (Akamai/Fastly)",
                "On-the-fly Responsive Resizing"
            ],
            "latency_ms": latency_ms
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "latency_ms": round((time.time() - t0) * 1000, 2)
        }

def get_optimized_cdn_url(
    image_url: str,
    width: Optional[int] = 800,
    quality: str = "auto",
    fetch_format: str = "auto"
) -> str:
    """Transforms any image URL into a Cloudinary edge-cached CDN URL with auto WebP/AVIF format."""
    if not image_url:
        return ""
    # If already a cloudinary URL, return as is
    if "res.cloudinary.com" in image_url:
        return image_url

    cloud_name = init_cloudinary()
    if cloudinary is None:
        # Fallback to direct edge fetch format if SDK is unavailable
        w_param = f",w_{width}" if width else ""
        return f"https://res.cloudinary.com/{cloud_name}/image/fetch/c_limit,f_{fetch_format},q_{quality}{w_param}/{image_url}"

    options: Dict[str, Any] = {
        "cloud_name": cloud_name,
        "type": "fetch",
        "fetch_format": fetch_format,
        "quality": quality,
        "secure": True
    }
    if width:
        options["width"] = width
        options["crop"] = "limit"

    cdn_url, _ = cloudinary.utils.cloudinary_url(image_url, **options)
    return cdn_url

def upload_product_image(
    file_or_url: str,
    folder: str = "shopcread/products",
    public_id: Optional[str] = None
) -> Dict[str, Any]:
    """Uploads an image file or remote URL directly into Cloudinary storage."""
    if cloudinary is None:
        raise RuntimeError("Cloudinary SDK is not installed in the active Python environment.")

    init_cloudinary()
    params: Dict[str, Any] = {
        "folder": folder,
        "resource_type": "image",
        "overwrite": True
    }
    if public_id:
        params["public_id"] = public_id

    res = cloudinary.uploader.upload(file_or_url, **params)
    return {
        "success": True,
        "public_id": res.get("public_id"),
        "secure_url": res.get("secure_url"),
        "format": res.get("format"),
        "bytes": res.get("bytes"),
        "width": res.get("width"),
        "height": res.get("height"),
        "created_at": res.get("created_at")
    }

def list_recent_assets(max_results: int = 15) -> List[Dict[str, Any]]:
    """Lists assets stored in Cloudinary."""
    if cloudinary is None:
        return []

    init_cloudinary()
    res = cloudinary.api.resources(type="upload", prefix="shopcread", max_results=max_results)
    return res.get("resources", [])
