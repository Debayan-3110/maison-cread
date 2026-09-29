from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.db.session import get_db
from backend.app.services.auth_service import AuthService
from backend.app.repositories.user_repo import UserRepository
from backend.app.core.security import (
    create_access_token, create_refresh_token_pair, 
    decode_access_token, hash_token, get_refresh_token, 
    revoke_refresh_token, revoke_all_user_refresh_tokens,
    generate_random_token
)
from backend.app.core.config import settings

router = APIRouter()

def get_auth_service(db: Session = Depends(get_db)):
    return AuthService(db)

@router.post("/register")
def register(email: str, password: str, fullName: str, address: str = "", auth_service: AuthService = Depends(get_auth_service)):
    result = auth_service.register_user(email, password, fullName, address)
    return {"success": True, "message": "Registration successful", "verificationToken": result["verification_token"]}

@router.post("/login")
def login(email: str, password: str, request: Request, response: Response, auth_service: AuthService = Depends(get_auth_service), db: Session = Depends(get_db)):
    auth_result = auth_service.authenticate_user(email, password)
    
    if auth_result["status"] == "2fa_required":
        # In a real app, we'd create a temp token here
        return {"status": "2fa_required", "message": "Two-factor authentication required"}
    
    user = auth_result["user"]
    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user.id)
    
    # Store refresh token in DB via repository
    user_repo = UserRepository(db)
    # Note: We'll add store_refresh_token to user_repo later or keep it in auth_service
    
    response.set_cookie(key="shopcread_refresh", value=raw_refresh, httponly=True, samesite="lax")
    
    return {
        "status": "authenticated",
        "accessToken": access_token,
        "user": {"id": user.id, "email": user.email, "name": user.full_name}
    }

@router.post("/logout")
def logout(response: Response, request: Request):
    token = request.cookies.get("shopcread_refresh")
    if token:
        revoke_refresh_token(hash_token(token))
    response.delete_cookie("shopcread_refresh")
    return {"success": True}
