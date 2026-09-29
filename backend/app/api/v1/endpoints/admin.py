from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from backend.app.db.session import get_db
from backend.app.models.analytics import ChatLog, ConversionLog
from backend.app.core.security import require_role

router = APIRouter()

@router.get("/stats", dependencies=[Depends(require_role(["admin", "manager"]))])
def get_admin_stats(db: Session = Depends(get_db)):
    # Total Chat Queries
    total_queries = db.query(ChatLog).count()

    # Popular recommended products
    # Simple count of IDs appearing in recommended_product_ids
    all_logs = db.query(ChatLog.recommended_product_ids).all()
    product_counts = {}
    for entry in all_logs:
        if entry[0]:
            ids = entry[0].split(',')
            for pid in ids:
                product_counts[pid] = product_counts.get(pid, 0) + 1

    sorted_products = sorted(product_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    # Total AI Conversions
    total_conversions = db.query(ConversionLog).filter(ConversionLog.source == "ai_chatbot").count()

    return {
        "stats": {
            "total_queries": total_queries,
            "ai_conversions": total_conversions,
            "conversion_rate": (total_conversions / total_queries * 100) if total_queries > 0 else 0
        },
        "top_recommendations": [
            {"product_id": pid, "count": count} for pid, count in sorted_products
        ]
    }

@router.get("/logs", dependencies=[Depends(require_role(["admin", "manager"]))])
def get_chat_logs(db: Session = Depends(get_db)):
    return db.query(ChatLog).order_by(ChatLog.created_at.desc()).limit(100).all()
