from decimal import Decimal
from typing import Dict
from pydantic import BaseModel, Field

# Fixed currency rates relative to USD
CURRENCY_RATES: Dict[str, Decimal] = {
    "USD": Decimal("1.00"),
    "EUR": Decimal("0.92"),
    "GBP": Decimal("0.79"),
    "JPY": Decimal("155.20")
}

class LocalizedPrice(BaseModel):
    currency: str = Field(..., example="EUR")
    amount: float
    formatted_symbol: str

def convert_currency(amount_usd: float, target_currency: str) -> LocalizedPrice:
    """
    Converts a USD amount to the target currency using fixed rates.
    """
    currency_code = target_currency.upper()
    rate = CURRENCY_RATES.get(currency_code, Decimal("1.00"))
    converted = Decimal(str(amount_usd)) * rate

    symbols = {"USD": "$", "EUR": "€", "GBP": "£", "JPY": "¥"}
    symbol = symbols.get(currency_code, "$")

    return LocalizedPrice(
        currency=currency_code,
        amount=round(float(converted), 2),
        formatted_symbol=f"{symbol}{converted:.2f}"
    )
