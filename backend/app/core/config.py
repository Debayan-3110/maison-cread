from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Project
    PROJECT_NAME: str = "ShopCread"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    JWT_SECRET_KEY: str = "change-this-in-production-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    # Default to SQLite for local development (no installation required)
    DATABASE_URL: str = "sqlite:///./backend/ecommerce.db"
    
    # AI
    OPENAI_API_KEY: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        env_file_encoding="utf-8",
        case_sensitive=True
    )

settings = Settings()
