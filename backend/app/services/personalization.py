from pydantic import BaseModel, Field
from typing import List, Dict

class UserProfile(BaseModel):
    user_id: str
    preferred_categories: List[str] = Field(default_factory=list)
    avg_budget: float = 100.0
    style_affinities: List[str] = Field(default_factory=list)

def build_personalized_system_prompt(base_prompt: str, profile: UserProfile) -> str:
    """
    Injects real-time user preference signals into the chatbot's system instruction.
    """
    categories_str = ", ".join(profile.preferred_categories) if profile.preferred_categories else "General"
    styles_str = ", ".join(profile.style_affinities) if profile.style_affinities else "Standard"

    personalization_context = f"""

    [CUSTOMER PERSONALIZATION CONTEXT]
    - Preferred Product Categories: {categories_str}
    - Typical Spending Budget: ~${profile.avg_budget:.2f}
    - Style & Feature Preferences: {styles_str}

    Tailor recommendations to subtle preference cues while respecting strict inventory availability.
    """
    return base_prompt + personalization_context
