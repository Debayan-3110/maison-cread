"""Central application configuration.

Single source of truth for every tunable. Values may come from the environment
or from ``.env`` / ``backend/.env`` (repo root wins). Defaults are safe for
local development (SQLite, no Redis, mock email); every default is overridable
for production (PostgreSQL, Redis, real SMTP / payment gateway).
"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(REPO_ROOT / ".env"), str(BACKEND_DIR / ".env")),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # --- Project -----------------------------------------------------------
    PROJECT_NAME: str = "ShopCread Commerce OS"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api/v1"
    LEGACY_API_STR: str = "/api"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # --- Identity / tokens -------------------------------------------------
    JWT_SECRET_KEY: str = "dev-only-insecure-secret-change-me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    REFRESH_TOKEN_EXPIRE_DAYS_REMEMBER: int = 30
    TEMP_2FA_TOKEN_EXPIRE_MINUTES: int = 5
    PASSWORD_RESET_EXPIRE_HOURS: int = 1
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 24
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RESEND_COOLDOWN_SECONDS: int = 60
    BCRYPT_ROUNDS: int = 12
    MAX_LOGIN_FAILED_ATTEMPTS: int = 5
    LOCKOUT_DURATION_MINUTES: int = 15
    LOGIN_IP_WINDOW_MINUTES: int = 15
    LOGIN_IP_MAX_FAILURES: int = 25
    MAX_ADDRESSES_PER_USER: int = 10

    # --- Data layer --------------------------------------------------------
    # Exactly one database URL. SQLite by default; point at
    # postgresql+psycopg://user:pass@host:5432/shopcread in production.
    DATABASE_URL: str = f"sqlite:///{(BACKEND_DIR / 'ecommerce.db').as_posix()}"
    SQL_ECHO: bool = False
    SEED_ON_STARTUP: bool = True
    # Optional. When unset, an in-process TTL cache is used so the app runs
    # with zero external services.
    REDIS_URL: Optional[str] = None

    # --- Transport ---------------------------------------------------------
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ]
    STOREFRONT_URL: str = "http://127.0.0.1:5173"
    ENABLE_HTTPS_REDIRECT: bool = False
    HSTS_ENABLED: bool = False

    # --- Rate limits (per client, per minute) ------------------------------
    RATE_LIMIT_CHAT_PER_MIN: int = 20
    RATE_LIMIT_INGEST_PER_MIN: int = 5
    RATE_LIMIT_OTP_PER_MIN: int = 5
    RATE_LIMIT_RESET_PER_MIN: int = 5
    RATE_LIMIT_GLOBAL_PER_MIN: int = 600
    # --- Commerce rules (mirrored by frontend/src/utils/commerce.ts) -------
    USD_TO_INR: float = 83.0
    CURRENCY: str = "INR"
    GST_RATE: float = 0.18
    FREE_DELIVERY_THRESHOLD_INR: float = 1999.0
    BASE_DELIVERY_FEE_INR: float = 99.0
    BULKY_FREIGHT_PER_KG_INR: float = 45.0
    FRAGILE_HANDLING_FEE_INR: float = 150.0
    COD_FEE_INR: float = 49.0
    LOW_STOCK_DEFAULT_THRESHOLD: int = 12
    LOW_STOCK_PREMIUM_THRESHOLD: int = 5
    RETURN_WINDOW_DAYS: int = 7
    RESTOCKING_FEE_PCT: float = 5.0
    EMI_PLANS_MONTHS: List[int] = [3, 6, 9, 12]
    EMI_INTEREST_RATE: float = 0.13

    # --- Loyalty -----------------------------------------------------------
    LOYALTY_EARN_COINS_PER_100_INR: int = 1
    LOYALTY_COIN_VALUE_INR: float = 1.0
    LOYALTY_REDEEM_MAX_PCT: float = 30.0

    # --- AI ----------------------------------------------------------------
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o-mini"
    AI_MAX_CONTEXT_MESSAGES: int = 12
    AI_COST_PER_1K_INPUT: float = 0.150
    AI_COST_PER_1K_OUTPUT: float = 0.600
    AI_DAILY_BUDGET_USD: float = 25.0
    AI_CACHE_TTL_SECONDS: int = 900

    # --- Integration secrets ----------------------------------------------
    PAYMENT_SECRET_KEY: str = "dev-payment-secret"
    COURIER_WEBHOOK_SECRET: str = "dev-courier-secret"
    OMNI_WEBHOOK_SECRET: str = "dev-omni-secret"
    MOCK_EMAILS: bool = True

    # --- Ops ---------------------------------------------------------------
    LOG_DIR: Path = BACKEND_DIR / "logs"
    LOG_LEVEL: str = "INFO"
    LOG_MAX_BYTES: int = 10 * 1024 * 1024
    LOG_BACKUP_COUNT: int = 5

    @field_validator("CORS_ORIGINS", "EMI_PLANS_MONTHS", mode="before")
    @classmethod
    def _split_csv(cls, value):
        """Accept ``A,B,C`` style env vars in addition to JSON arrays."""
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("EMI_PLANS_MONTHS", mode="after")
    @classmethod
    def _coerce_ints(cls, value: List[int]) -> List[int]:
        return [int(item) for item in value]

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() in {"production", "prod"}

    def insecure_configuration(self) -> List[str]:
        """Configuration problems worth failing a deploy on (never raises)."""
        problems: List[str] = []
        if self.JWT_SECRET_KEY.startswith("dev-only") or self.JWT_SECRET_KEY == "enterprise-super-secret-key-12345":
            problems.append("JWT_SECRET_KEY is a development/known placeholder")
        if self.PAYMENT_SECRET_KEY.startswith("dev-"):
            problems.append("PAYMENT_SECRET_KEY is a development default")
        if self.COURIER_WEBHOOK_SECRET.startswith("dev-"):
            problems.append("COURIER_WEBHOOK_SECRET is a development default")
        if self.OMNI_WEBHOOK_SECRET.startswith("dev-"):
            problems.append("OMNI_WEBHOOK_SECRET is a development default")
        if "*" in self.CORS_ORIGINS:
            problems.append("CORS_ORIGINS contains a wildcard")
        if self.DEBUG:
            problems.append("DEBUG is enabled")
        if self.is_sqlite:
            problems.append("SQLite in use — single-writer; use PostgreSQL in production")
        return problems


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

