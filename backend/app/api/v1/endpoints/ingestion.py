from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from openai import OpenAI
import os
import json
from sqlalchemy.orm import Session
from fastapi import Depends
from backend.app.db.session import get_db
from backend.app.repositories.product_repo import ProductRepository
from backend.app.models.product import Product
from backend.app.core.security import require_role

router = APIRouter()
_ingestion_client: Optional[OpenAI] = None

def _get_ingestion_client() -> Optional[OpenAI]:
    global _ingestion_client
    if _ingestion_client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if api_key and api_key != "your_openai_api_key_here":
            try:
                _ingestion_client = OpenAI(api_key=api_key)
            except Exception:
                pass
    return _ingestion_client

class RawProductInput(BaseModel):
    unstructured_text: str

class ProcessedProductCatalog(BaseModel):
    title: str = Field(..., description="Clean commercial product title")
    category: str = Field(..., description="E-commerce taxonomy category")
    suggested_price: float = Field(..., description="Estimated market retail price in USD")
    tags: List[str] = Field(..., description="Search and filter tags")
    seo_description: str = Field(..., description="150-character meta description")

@router.post("/inventory/auto-ingest", response_model=ProcessedProductCatalog, dependencies=[Depends(require_role(["admin", "manager"]))])
async def auto_ingest_product(
    payload: RawProductInput,
    db: Session = Depends(get_db)
):
    prompt = f"""
    Extract structured catalog data from the following raw product text:
    "{payload.unstructured_text}"

    Return JSON adhering strictly to the schema:
    - title (string)
    - category (string)
    - suggested_price (float)
    - tags (list of strings)
    - seo_description (string)
    """

    try:
        client = _get_ingestion_client()
        if client is None:
            raise HTTPException(status_code=503, detail="AI ingestion is not configured. Set OPENAI_API_KEY.")
        completion = client.chat.completions.create(
            model="gpt-4o-mini",
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": prompt}]
        )
        data = json.loads(completion.choices[0].message.content)

        # Validate using the Pydantic model
        processed_data = ProcessedProductCatalog(**data)

        return processed_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion processing failed: {str(e)}")

@router.post("/inventory/confirm-ingestion", dependencies=[Depends(require_role(["admin", "manager"]))])
async def confirm_ingestion(
    product_data: ProcessedProductCatalog,
    db: Session = Depends(get_db)
):
    repo = ProductRepository(db)
    try:
        # Map ProcessedProductCatalog to Product model
        new_product = Product(
            title=product_data.title,
            category=product_data.category,
            price=product_data.suggested_price,
            description=product_data.seo_description,
            stock=0, # Default to 0, admin will set it later
            sku=f"AI-{hash(product_data.title)}", # Simple AI-generated SKU
        )
        repo.create(new_product)
        return {"message": "Product successfully ingested into catalog", "product_id": new_product.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insertion failed: {str(e)}")
