from fastapi import APIRouter
from backend.app.api.v1.endpoints import auth, products, orders, chat, admin, ws, ingestion, omnichannel

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(orders.router, prefix="/orders", tags=["Orders"])
api_router.include_router(chat.router, prefix="/chat", tags=["AI Recommendations"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Analytics"])
api_router.include_router(ws.router)
api_router.include_router(ingestion.router, prefix="/ingest", tags=["AI Ingestion"])
api_router.include_router(omnichannel.router, prefix="/omnichannel", tags=["Omnichannel AI"])
