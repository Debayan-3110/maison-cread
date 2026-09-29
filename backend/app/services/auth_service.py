from sqlalchemy.orm import Session
from backend.app.repositories.user_repo import UserRepository
from backend.app.core.security import (
    hash_password, verify_password, create_access_token, 
    create_refresh_token_pair, verify_totp_code, generate_random_token
)
from fastapi import HTTPException, status
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any

class AuthService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.db = db

    def register_user(self, email: str, password: str, full_name: str, address: str) -> Dict[str, Any]:
        if self.user_repo.get_by_email(email):
            raise HTTPException(status_code=400, detail="Email already registered")
        
        pw_hash = hash_password(password)
        token = generate_random_token(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        
        user = self.user_repo.create({
            "email": email.lower(),
            "hashed_password": pw_hash,
            "full_name": full_name,
            "address": address,
            "verification_token": token,
            "verification_token_expires_at": expires_at
        })
        return {"user": user, "verification_token": token}

    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        user = self.user_repo.get_by_email(email.lower())
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        
        if user.two_factor_enabled:
            return {"status": "2fa_required", "user_id": user.id}
            
        return {"status": "authenticated", "user": user}

    def verify_mfa(self, user_id: int, code: str) -> bool:
        user = self.user_repo.get_by_id(user_id)
        if not user or not user.two_factor_secret:
            return False
        return verify_totp_code(user.two_factor_secret, code)
