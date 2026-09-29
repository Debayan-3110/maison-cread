from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.api.v1.api import api_router
from backend.app.core.config import settings
from backend.app.core.middleware import SecurityHeadersMiddleware, CSRFMiddleware, RateLimitMiddleware
from backend.app.core.ai_observability import AIObservabilityMiddleware
from backend.app.core.redis_cache import RedisSemanticCacheMiddleware
from backend.app.core.exceptions import global_exception_handler
from backend.app.core.logging import logger

app = FastAPI(
    title="ShopCread Enterprise API",
    version=settings.VERSION,
    description="""
    ShopCread is a high-performance, secure e-commerce backend.

    ### Key Features:
    *   **Enterprise Auth**: JWT with Refresh Token Rotation.
    *   **Multi-Factor**: TOTP-based 2FA with recovery codes.
    *   **Security**: Strict CSP, HSTS, and CSRF protection.
    *   **Data Layer**: PostgreSQL with SQLAlchemy 2.0.
    """,
    openapi_tags=[
        {"name": "Authentication", "description": "User registration, login, and security settings"},
        {"name": "Products", "description": "Product catalog, searching, and filtering"},
        {"name": "Orders", "description": "Checkout process and order history tracking"},
    ]
)

# Register Global Exception Handler
app.add_exception_handler(Exception, global_exception_handler)

# Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RedisSemanticCacheMiddleware)
app.add_middleware(AIObservabilityMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(CSRFMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def startup_event():
    # Auto-create all tables (SQLite local dev convenience)
    from backend.app.db.session import engine, Base
    import backend.app.models.user  # noqa: F401
    import backend.app.models.product  # noqa: F401
    import backend.app.models.order  # noqa: F401
    import backend.app.models.analytics  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("🚀 ShopCread Enterprise API starting up...")
    logger.info(f"Running version {settings.VERSION} in {settings.PROJECT_NAME} mode")

@app.get("/")
def root():
    return {"status": "online", "message": f"Welcome to {settings.PROJECT_NAME} API"}

