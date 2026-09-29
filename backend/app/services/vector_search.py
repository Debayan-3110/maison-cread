import numpy as np
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from openai import OpenAI
import os
from pydantic import BaseModel

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class VectorSearchResult(BaseModel):
    id: int
    title: str
    category: str
    price: float
    stock: int
    similarity_score: float

def generate_embedding(text_content: str) -> List[float]:
    """Generates a 1536-dimensional embedding using OpenAI text-embedding-3-small."""
    response = client.embeddings.create(
        input=text_content,
        model="text-embedding-3-small"
    )
    return response.data[0].embedding

def hybrid_product_search(
    db: Session,
    query_text: str,
    category_filter: Optional[str] = None,
    max_price: Optional[float] = None,
    limit: int = 5
) -> List[VectorSearchResult]:
    """
    Executes hybrid search combining pgvector cosine distance and SQL metadata filters.
    Note: This requires the pgvector extension enabled in PostgreSQL.
    """
    query_vector = generate_embedding(query_text)
    vector_str = f"[{','.join(map(str, query_vector))}]"

    # Adjusted table/column names to match our existing Product model:
    # title instead of name, stock instead of stock_quantity
    sql = """
        SELECT id, title, category, price, stock,
               1 - (embedding <=> :vector::vector) AS similarity
        FROM products
        WHERE stock > 0
    """
    params: Dict[str, Any] = {"vector": vector_str, "limit": limit}

    if category_filter:
        sql += " AND category = :category"
        params["category"] = category_filter

    if max_price:
        sql += " AND price <= :max_price"
        params["max_price"] = max_price

    sql += " ORDER BY embedding <=> :vector::vector LIMIT :limit"

    result = db.execute(text(sql), params)

    return [
        VectorSearchResult(
            id=row.id,
            title=row.title,
            category=row.category,
            price=row.price,
            stock=row.stock,
            similarity_score=round(float(row.similarity), 4)
        )
        for row in result
    ]
