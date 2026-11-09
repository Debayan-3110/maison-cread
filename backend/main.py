"""
ShopCread Modern FastAPI Backend Application.
Fully native Python implementation with pure database persistence and FTS5 search.
"""
import os
import sys
import json
import sqlite3
import re
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request, Response, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.database import (
    DB_PATH,
    init_db,
    create_user,
    get_user_by_email,
    get_user_by_id,
    get_user_by_verification_token,
    get_user_by_reset_token,
    verify_user_email,
    set_user_verification_token,
    set_reset_token,
    update_user_password,
    update_failed_attempts_and_lockout,
    reset_failed_attempts,
    save_2fa_setup,
    enable_2fa,
    disable_2fa,
    consume_backup_code,
    store_refresh_token,
    get_refresh_token,
    revoke_refresh_token,
    revoke_all_user_refresh_tokens,
    record_login_attempt,
    save_mock_email,
    get_mock_emails,
    create_order,
    get_orders as db_get_orders,
    delete_user_account,
    get_all_shops,
    update_shop_verification,
    get_all_buybacks,
    update_buyback_action,
    get_admin_analytics,
    get_admin_products,
    update_admin_product_stock_price,
    store_otp,
    verify_and_consume_otp,
    get_user_by_phone,
    get_user_by_email_or_phone,
    create_or_get_phone_user,
    create_or_get_email_user,
    create_or_get_neon_user,
    reset_password_by_identifier,
    normalize_identifier,
    get_order_by_id,
    update_order_tracking_status
)
from backend.geo_scraper_service import (
    reverse_geocode_coordinates,
    calculate_haversine_distance,
    find_nearby_registered_stores,
    scrape_google_maps_stores
)
from backend.sendmail_service import (
    get_sendmail_status,
    send_otp_email,
    send_offer_email,
    send_order_tracking_email,
    send_security_alert_email,
    dispatch_email
)
from backend.shipment_neon_service import (
    get_complete_shipment,
    list_neon_shipments,
    list_neon_warehouses,
    list_neon_local_stores,
    sync_order_to_shipment_in_neon
)
from backend.smtp_service import (
    get_smtp_status,
    send_email_smtp
)
from backend.neon_auth_service import (
    get_neon_auth_config,
    get_neon_google_auth_url,
    verify_neon_session,
    verify_neon_token_with_jwks
)
from backend.neon_service import (
    get_all_neon_diagnostics,
    test_storage_service,
    test_functions_service,
    test_auth_service,
    test_realtime_service,
    get_neon_postgres_connection,
    get_s3_client,
    NEON_BUCKET
)
from backend.auth_utils import (
    validate_password_strength,
    hash_password,
    verify_password,
    generate_random_token,
    hash_token,
    create_access_token,
    decode_access_token,
    create_2fa_temp_token,
    decode_2fa_temp_token,
    create_refresh_token_pair,
    generate_totp_secret,
    get_totp_uri,
    generate_qr_code_data_url,
    verify_totp_code,
    generate_backup_codes,
)
from backend.security_middleware import (
    SecurityHeadersMiddleware,
    CSRFMiddleware,
    generate_csrf_token,
    sanitize_input
)
from backend.app.core.catalog_search import get_search_results
from backend.bns_service import (
    initiate_bns_verification,
    verify_bns_order,
    get_bns_status
)

app = FastAPI(
    title="ShopCread E-Commerce API",
    description="Production-grade secure e-commerce backend",
    version="2.0.0"
)

# Attach Security Middlewares
app.add_middleware(CSRFMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================

class RegisterRequest(BaseModel):
    email: str
    password: str
    fullName: str = ""
    address: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str
    rememberMe: bool = False

class TwoFactorLoginRequest(BaseModel):
    tempToken: str
    code: str
    rememberMe: bool = False

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    email: str

class RefreshTokenRequest(BaseModel):
    refreshToken: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    newPassword: str

class Enable2FARequest(BaseModel):
    code: str

class Disable2FARequest(BaseModel):
    password: str

class CouponRequest(BaseModel):
    code: str

class AIChatRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = None
    sessionId: Optional[str] = None

class BnsInitiateRequest(BaseModel):
    order_id: str
    phone: Optional[str] = None

class BnsVerifyRequest(BaseModel):
    order_id: str
    verification_pin: str
    session_id: Optional[str] = None

class DeleteAccountRequest(BaseModel):
    password: str
    confirmation: str

class DonationCalculateRequest(BaseModel):
    amount: float = 100.0
    beneficiary: Optional[str] = "Sunshine Children's Sanctuary"

class SellerProductCreateRequest(BaseModel):
    title: str
    category: str
    brand: str
    price: float
    mrp: Optional[float] = None
    discountPercentage: Optional[float] = 0.0
    stock: int = 50
    description: str
    thumbnail: str
    images: Optional[List[str]] = None
    packagingProtocol: Optional[List[str]] = None
    freshnessWindow: Optional[str] = "7 Days Peak Freshness"
    storageTemp: Optional[str] = "1.4°C Continuous Cold Chain"
    harvestTimestamp: Optional[str] = None
    surplusPledge: Optional[str] = None

class SellerInventoryUpdateRequest(BaseModel):
    stock: int
    harvestTimestamp: Optional[str] = None

class EmailOtpSendRequest(BaseModel):
    email: str
    purpose: str = "login"

class EmailOtpVerifyRequest(BaseModel):
    email: str
    otp: str
    fullName: str = ""
    rememberMe: bool = False

class SmtpTestRequest(BaseModel):
    recipient: str

class PhoneOtpSendRequest(BaseModel):
    phone: str
    purpose: str = "login"

class PhoneOtpVerifyRequest(BaseModel):
    phone: str
    otp: str
    fullName: str = ""
    rememberMe: bool = False

class ForgotPasswordOtpSendRequest(BaseModel):
    identifier: str

class ForgotPasswordOtpVerifyRequest(BaseModel):
    identifier: str
    otp: str
    newPassword: str

class NeonGoogleUrlRequest(BaseModel):
    origin: Optional[str] = None

class NeonVerifySessionRequest(BaseModel):
    token: Optional[str] = None
    sessionToken: Optional[str] = None
    rememberMe: bool = False

class SendOfferMailRequest(BaseModel):
    recipient: str
    offerTitle: str = "Exclusive VIP Privilege Drop"
    discountPercent: int = 20
    couponCode: str = "MAISON20"
    description: str = "Enjoy an exclusive 20% privilege deduction across our Haute Horlogerie & Curated Rare Collections."
    expiryDate: str = "Within 7 Days"
    freeShipping: bool = True

class SendOrderTrackingMailRequest(BaseModel):
    orderId: str
    recipient: Optional[str] = None

class SendSecurityAlertMailRequest(BaseModel):
    recipient: str
    alertTitle: str
    alertMessage: str

class SendMailTestRequest(BaseModel):
    recipient: str
    category: str = "otp"
    token: Optional[str] = None

# Helper to format user for responses
def format_user_response(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "fullName": user.get("full_name") or "",
        "phone": user.get("phone") or "",
        "phoneVerified": bool(user.get("phone_verified")),
        "authProvider": user.get("auth_provider") or "local",
        "avatar": user.get("avatar") or "",
        "address": user.get("address") or "",
        "isVerified": bool(user.get("is_verified")),
        "is2FAEnabled": bool(user.get("two_factor_enabled")),
        "createdAt": user.get("created_at")
    }

def get_current_user_from_header(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication required")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    user_id = payload.get("user_id") or payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired session token")
    user = get_user_by_id(int(user_id))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_optional_current_user(authorization: Optional[str] = Header(None)) -> Optional[Dict[str, Any]]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            return None
        return get_user_by_id(int(user_id))
    except Exception:
        return None

# ============================================================================
# SYSTEM & HEALTH ENDPOINTS
# ============================================================================

@app.get("/")
def root_endpoint():
    return {"status": "online", "message": "ShopCread Maison Atelier active"}

@app.get("/api/health")
def health_check():
    return {"status": "online", "message": "Atelier services running smoothly"}

@app.get("/api/csrf-token")
def get_csrf_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("shopcread_csrf") or generate_csrf_token()
    response.set_cookie(
        key="shopcread_csrf",
        value=token,
        httponly=False,
        samesite="lax",
        path="/"
    )
    return {"csrfToken": token}

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/register")
def register(req: RegisterRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    ok, err_msg = validate_password_strength(req.password)
    if not ok:
        raise HTTPException(status_code=400, detail=err_msg)

    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    pwd_hash = hash_password(req.password)
    verification_token = generate_random_token(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()

    user = create_user(
        email=email,
        password_hash=pwd_hash,
        full_name=sanitize_input(req.fullName),
        verification_token=verification_token,
        verification_token_expires_at=expires_at,
        address=sanitize_input(req.address)
    )

    save_mock_email(
        recipient=email,
        subject="Verify your Maison Cread account",
        email_type="verification",
        token=verification_token,
        body=f"Click here to verify: https://maisoncread.com/verify?token={verification_token}"
    )

    return {
        "success": True,
        "message": "Account created. Please check your inbox to verify your email.",
        "verificationToken": verification_token,
        "user": format_user_response(user)
    }

@app.post("/api/auth/verify-email")
def verify_email(req: VerifyEmailRequest):
    user = get_user_by_verification_token(req.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token.")

    verify_user_email(user["id"])
    return {"success": True, "message": "Email successfully verified."}

@app.post("/api/auth/resend-verification")
def resend_verification(req: ResendVerificationRequest):
    user = get_user_by_email(req.email)
    if not user:
        return {"success": True, "message": "If the account exists, a new verification link has been sent."}

    token = generate_random_token(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    set_user_verification_token(user["id"], token, expires_at)
    save_mock_email(
        recipient=user["email"],
        subject="New verification link",
        email_type="verification",
        token=token,
        body=f"Verify here: https://maisoncread.com/verify?token={token}"
    )
    return {"success": True, "message": "Verification link sent.", "verificationToken": token}

@app.post("/api/auth/login")
def login(req: LoginRequest, request: Request, response: Response):
    email = req.email.strip().lower()
    ip = request.client.host if request.client else "unknown"

    user = get_user_by_email(email)
    if not user:
        record_login_attempt(ip, email, False)
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    # Check lockout
    lockout_until = user.get("lockout_until")
    if lockout_until:
        try:
            lockout_dt = datetime.fromisoformat(lockout_until)
            if datetime.now(timezone.utc) < lockout_dt.replace(tzinfo=timezone.utc):
                raise HTTPException(status_code=403, detail="Account temporarily locked due to too many failed attempts. Please try again later.")
        except ValueError:
            pass

    # Verify password
    if not verify_password(req.password, user["password_hash"]):
        record_login_attempt(ip, email, False)
        failed = (user.get("failed_login_attempts") or 0) + 1
        if failed >= 5:
            lockout_time = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            update_failed_attempts_and_lockout(user["id"], failed, lockout_time)
            raise HTTPException(status_code=403, detail="Account locked: 5 failed attempts reached. Please try again after 15 minutes or reset your password.")
        else:
            update_failed_attempts_and_lockout(user["id"], failed, None)
            remaining = 5 - failed
            raise HTTPException(status_code=401, detail=f"Invalid email or password. {remaining} attempts remaining before account lockout.")

    # Success: reset failed attempts
    reset_failed_attempts(user["id"])
    record_login_attempt(ip, email, True)

    # 2FA check
    if user.get("two_factor_enabled"):
        temp_token = create_2fa_temp_token(user["id"], user["email"])
        return {
            "status": "2fa_required",
            "tempToken": temp_token,
            "message": "Two-factor authentication code required."
        }

    # Issue tokens
    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user["id"], req.rememberMe)
    store_refresh_token(user["id"], token_hash, expires_at, request.headers.get("user-agent", ""))

    response.set_cookie(
        key="shopcread_refresh",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        path="/"
    )

    return {
        "status": "authenticated",
        "accessToken": access_token,
        "refreshToken": raw_refresh,
        "user": format_user_response(user)
    }

@app.post("/api/auth/login-2fa")
def login_2fa(req: TwoFactorLoginRequest, request: Request, response: Response):
    payload = decode_2fa_temp_token(req.tempToken)
    if not payload:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    secret = user.get("two_factor_secret")
    is_valid = False
    if secret and verify_totp_code(secret, req.code):
        is_valid = True
    elif consume_backup_code(user["id"], req.code):
        is_valid = True

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid authentication code.")

    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user["id"], req.rememberMe)
    store_refresh_token(user["id"], token_hash, expires_at, request.headers.get("user-agent", ""))

    return {
        "status": "authenticated",
        "accessToken": access_token,
        "refreshToken": raw_refresh,
        "user": format_user_response(user)
    }

@app.post("/api/auth/refresh")
def refresh_token(req: RefreshTokenRequest, request: Request):
    token_str = req.refreshToken or request.cookies.get("shopcread_refresh")
    if not token_str:
        raise HTTPException(status_code=401, detail="Refresh token required.")

    thash = hash_token(token_str)
    row = get_refresh_token(thash)
    if not row:
        raise HTTPException(status_code=401, detail="Invalid refresh token.")

    # Breach detection: reuse of revoked token!
    if row.get("revoked"):
        revoke_all_user_refresh_tokens(row["user_id"])
        raise HTTPException(status_code=401, detail="Security breach detected: refresh token reuse. All sessions revoked.")

    user = get_user_by_id(row["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    # Rotate token: revoke current, issue new
    revoke_refresh_token(thash)
    new_raw, new_hash, exp = create_refresh_token_pair(user["id"])
    store_refresh_token(user["id"], new_hash, exp, request.headers.get("user-agent", ""))
    new_access = create_access_token(user)

    return {
        "accessToken": new_access,
        "refreshToken": new_raw
    }

@app.post("/api/auth/logout")
def logout(request: Request, response: Response, req: Optional[RefreshTokenRequest] = None):
    token_str: Optional[str] = None
    if req and req.refreshToken:
        token_str = req.refreshToken
    else:
        token_str = request.cookies.get("shopcread_refresh")
    if token_str:
        revoke_refresh_token(hash_token(token_str))
    response.delete_cookie("shopcread_refresh")
    return {"success": True, "message": "Logged out successfully."}

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    user = get_user_by_email(req.email)
    if not user:
        return {"success": True, "message": "Instructions sent if email is registered."}

    token = generate_random_token(32)
    expires_at = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    set_reset_token(user["id"], token, expires_at)

    save_mock_email(
        recipient=user["email"],
        subject="Reset your password",
        email_type="password_reset",
        token=token,
        body=f"Reset link: https://maisoncread.com/reset-password?token={token}"
    )

    return {
        "success": True,
        "message": "Password reset instructions sent.",
        "resetToken": token
    }

@app.post("/api/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    ok, err = validate_password_strength(req.newPassword)
    if not ok:
        raise HTTPException(status_code=400, detail=err)

    user = get_user_by_reset_token(req.token)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    update_user_password(user["id"], hash_password(req.newPassword))
    revoke_all_user_refresh_tokens(user["id"])
    return {"success": True, "message": "Password successfully updated."}

# ============================================================================
# NEON AUTH & SOVEREIGN AUTH PROTOCOLS (GOOGLE, PHONE OTP, FORGOT PW OTP)
# ============================================================================

@app.get("/api/auth/neon/config")
def api_get_neon_auth_config(request: Request):
    """
    Returns Neon Auth JWKS, endpoints, dynamic backlink callback,
    and reports automatic Vercel.env bypass status.
    """
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
    return get_neon_auth_config(request_host=host, request_scheme=scheme)

@app.post("/api/auth/neon/google-url")
def api_neon_google_url(req: NeonGoogleUrlRequest, request: Request):
    """
    Initiates Google Social Login via Neon Auth with backlink callback URL.
    """
    origin = req.origin
    if not origin:
        host = request.headers.get("x-forwarded-host") or request.headers.get("host")
        scheme = request.headers.get("x-forwarded-proto") or request.url.scheme
        origin = f"{scheme}://{host}" if host else "http://localhost:5173"
    
    res = get_neon_google_auth_url(origin=origin)
    if not res.get("success"):
        raise HTTPException(status_code=500, detail=res.get("error", "Failed to initialize Neon Google Auth"))
    return res

@app.post("/api/auth/neon/verify-session")
def api_neon_verify_session(req: NeonVerifySessionRequest, request: Request, response: Response):
    """
    Validates a Neon Auth returned token or session, creates/links user in database,
    and returns sovereign ShopCread JWT tokens.
    """
    cookie_header = request.headers.get("cookie")
    profile = verify_neon_session(token=req.token or req.sessionToken, cookie_header=cookie_header)
    
    if not profile or not profile.get("email"):
        raise HTTPException(status_code=400, detail="Invalid Neon Auth session or token.")

    user = create_or_get_neon_user(
        email=profile["email"],
        full_name=profile.get("name", ""),
        avatar=profile.get("avatar", ""),
        neon_user_id=profile.get("id", ""),
        provider="neon_google"
    )

    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user["id"], remember_me=req.rememberMe)
    store_refresh_token(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent", "")
    )

    response.set_cookie(
        key="shopcread_refresh",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/"
    )

    return {
        "success": True,
        "message": f"Welcome back, {user.get('full_name') or user.get('email')}!",
        "accessToken": access_token,
        "refreshToken": raw_refresh,
        "user": format_user_response(user)
    }

@app.get("/api/auth/smtp/status")
def api_get_smtp_status():
    """
    Returns live SMTP protocol configuration, port, and security posture.
    """
    return get_smtp_status()

@app.post("/api/auth/smtp/test")
def api_test_smtp(req: SmtpTestRequest):
    """
    Directly tests SMTP transmission by dispatching a verification test code.
    """
    res = send_email_smtp(
        recipient=req.recipient,
        subject="Maison Cread Security • SMTP Protocol Test",
        otp="888999",
        purpose="verification"
    )
    return res

@app.post("/api/auth/email/send-otp")
def api_email_send_otp(req: EmailOtpSendRequest):
    """
    Dispatches a 6-digit verification code directly to the user's email address using Sendmail / SMTP Protocol.
    """
    clean_email = req.email.strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")

    purpose = f"email_{req.purpose.lower().strip()}" if req.purpose in ("login", "signup") else "email_login"
    otp = store_otp(clean_email, purpose=purpose, expires_minutes=10)

    # Dispatched via Sendmail protocol
    delivery_res = send_otp_email(recipient=clean_email, otp=otp, purpose=req.purpose)

    print(f"[ShopCread Sendmail Protocol] Dispatched 6-digit OTP for {clean_email} ({purpose}): {otp} -> {delivery_res.get('transport')}")

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched directly to {clean_email} via Sendmail.",
        "email": clean_email,
        "expiresInSeconds": 600,
        "delivery": delivery_res,
        "devOtp": otp
    }

@app.post("/api/auth/email/verify-otp")
def api_email_verify_otp(req: EmailOtpVerifyRequest, request: Request, response: Response):
    """
    Verifies the 6-digit OTP sent to the email via SMTP, authenticates the user,
    and returns session tokens.
    """
    clean_email = req.email.strip().lower()
    clean_otp = req.otp.strip()

    ok, msg = verify_and_consume_otp(clean_email, clean_otp, purpose="email_login")
    if not ok:
        ok_signup, _ = verify_and_consume_otp(clean_email, clean_otp, purpose="email_signup")
        if ok_signup:
            ok = True
        else:
            raise HTTPException(status_code=400, detail=msg)

    user = create_or_get_email_user(clean_email, full_name=req.fullName)

    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user["id"], remember_me=req.rememberMe)
    store_refresh_token(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent", "")
    )

    response.set_cookie(
        key="shopcread_refresh",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/"
    )

    record_login_attempt(request.client.host if request.client else "unknown", clean_email, True)

    return {
        "success": True,
        "message": f"Authentication confirmed via SMTP. Welcome to Maison Cread.",
        "accessToken": access_token,
        "refreshToken": raw_refresh,
        "user": format_user_response(user)
    }

@app.post("/api/auth/phone/send-otp")
def api_phone_send_otp(req: PhoneOtpSendRequest):
    """
    Generates and dispatches a cryptographically secure 6-digit OTP to a mobile phone number.
    Logs dispatch to console and mock_emails/dev mailbox for zero-friction development.
    """
    raw_phone = req.phone.strip()
    cleaned = re.sub(r"[^\d+]", "", raw_phone)
    if not cleaned or len(re.sub(r"\D", "", cleaned)) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number (at least 10 digits).")

    normalized_phone = normalize_identifier(cleaned)
    purpose = f"phone_{req.purpose.lower().strip()}" if req.purpose in ("login", "signup") else "phone_login"

    otp = store_otp(normalized_phone, purpose=purpose, expires_minutes=10)
    print(f"[ShopCread SMS Gateway] Generated 6-digit OTP for {normalized_phone} ({purpose}): {otp}")

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {normalized_phone}.",
        "phone": normalized_phone,
        "expiresInSeconds": 600,
        "devOtp": otp
    }

@app.post("/api/auth/phone/verify-otp")
def api_phone_verify_otp(req: PhoneOtpVerifyRequest, request: Request, response: Response):
    """
    Verifies a 6-digit OTP for phone login or sign-up.
    Creates account automatically if new, issues JWT tokens.
    """
    normalized_phone = normalize_identifier(req.phone)
    clean_otp = req.otp.strip()

    ok, msg = verify_and_consume_otp(normalized_phone, clean_otp, purpose="phone_login")
    if not ok:
        ok_signup, _ = verify_and_consume_otp(normalized_phone, clean_otp, purpose="phone_signup")
        if ok_signup:
            ok = True
        else:
            raise HTTPException(status_code=400, detail=msg)

    user = create_or_get_phone_user(normalized_phone, full_name=req.fullName)

    access_token = create_access_token(user)
    raw_refresh, token_hash, expires_at = create_refresh_token_pair(user["id"], remember_me=req.rememberMe)
    store_refresh_token(
        user_id=user["id"],
        token_hash=token_hash,
        expires_at=expires_at,
        user_agent=request.headers.get("user-agent", "")
    )

    response.set_cookie(
        key="shopcread_refresh",
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/"
    )

    record_login_attempt(request.client.host if request.client else "unknown", normalized_phone, True)

    return {
        "success": True,
        "message": f"Authentication confirmed. Welcome to Maison Cread.",
        "accessToken": access_token,
        "refreshToken": raw_refresh,
        "user": format_user_response(user)
    }

@app.post("/api/auth/forgot-password/send-otp")
def api_forgot_password_send_otp(req: ForgotPasswordOtpSendRequest):
    """
    Initiates password reset using 6-digit OTP verification for either personal Gmail/email or phone number.
    Dispatches via Sendmail when target is an email address or has a linked user email.
    """
    raw_id = req.identifier.strip()
    if not raw_id:
        raise HTTPException(status_code=400, detail="Please enter your registered Gmail or phone number.")

    normalized = normalize_identifier(raw_id)
    otp = store_otp(normalized, purpose="forgot_password", expires_minutes=10)

    delivery_res = None
    target_email = None
    if "@" in normalized:
        target_email = normalized
    else:
        linked_user = get_user_by_phone(normalized)
        if linked_user and linked_user.get("email"):
            target_email = linked_user["email"]

    if target_email:
        delivery_res = send_otp_email(recipient=target_email, otp=otp, purpose="forgot_password")

    print(f"[ShopCread Password Recovery] Dispatched 6-digit OTP for {normalized} (Email: {target_email}): {otp}")

    return {
        "success": True,
        "message": f"A 6-digit verification code has been dispatched to {normalized} via Sendmail.",
        "identifier": normalized,
        "expiresInSeconds": 600,
        "delivery": delivery_res,
        "devOtp": otp
    }

@app.post("/api/auth/forgot-password/verify-otp")
def api_forgot_password_verify_otp(req: ForgotPasswordOtpVerifyRequest):
    """
    Verifies 6-digit OTP and resets the password for either Gmail/email or phone number.
    Dispatches a security confirmation notice via Sendmail.
    """
    normalized = normalize_identifier(req.identifier)
    clean_otp = req.otp.strip()

    ok_pwd, err_msg = validate_password_strength(req.newPassword)
    if not ok_pwd:
        raise HTTPException(status_code=400, detail=err_msg or "Password does not meet security requirements.")

    ok_otp, msg_otp = verify_and_consume_otp(normalized, clean_otp, purpose="forgot_password")
    if not ok_otp:
        raise HTTPException(status_code=400, detail=msg_otp)

    new_hash = hash_password(req.newPassword)
    updated = reset_password_by_identifier(normalized, new_hash)
    if not updated:
        raise HTTPException(status_code=404, detail="User account not found.")

    # Dispatch security alert via Sendmail
    try:
        sec_email = normalized if "@" in normalized else None
        if not sec_email:
            linked_user = get_user_by_phone(normalized)
            if linked_user and linked_user.get("email"):
                sec_email = linked_user["email"]
        if sec_email:
            send_security_alert_email(
                recipient=sec_email,
                alert_title="Password Successfully Updated",
                alert_message="The master credentials for your Maison Cread account were recently changed. If you initiated this change, no further action is necessary. If not, please contact security immediately."
            )
    except Exception as mail_err:
        print(f"[Sendmail Service] Warning: Failed to send password reset security notice: {mail_err}")

    return {
        "success": True,
        "message": "Your password has been successfully reset. You may now sign in."
    }

@app.get("/api/auth/me")
def get_me(user: Dict[str, Any] = Depends(get_current_user_from_header)):
    return {"user": format_user_response(user)}

@app.post("/api/auth/2fa/setup")
def setup_2fa(user: Dict[str, Any] = Depends(get_current_user_from_header)):
    secret = generate_totp_secret()
    uri = get_totp_uri(secret, user["email"])
    qr_code = generate_qr_code_data_url(uri)
    backup_codes = generate_backup_codes(8)
    save_2fa_setup(user["id"], secret, backup_codes)

    return {
        "secret": secret,
        "qrCode": qr_code,
        "backupCodes": backup_codes
    }

@app.post("/api/auth/2fa/enable")
def complete_enable_2fa(req: Enable2FARequest, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    secret = user.get("two_factor_secret")
    if not secret or not verify_totp_code(secret, req.code):
        raise HTTPException(status_code=400, detail="Invalid verification code.")

    enable_2fa(user["id"])
    return {"success": True, "message": "Two-factor authentication successfully enabled."}

@app.post("/api/auth/2fa/disable")
def complete_disable_2fa(req: Disable2FARequest, user: Dict[str, Any] = Depends(get_current_user_from_header)):
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password.")

    disable_2fa(user["id"])
    return {"success": True, "message": "Two-factor authentication disabled."}

@app.get("/api/auth/dev-emails")
def fetch_mock_emails():
    return get_mock_emails(50)

# ============================================================================
# UNIVERSAL SENDMAIL PROTOCOL & CAMPAIGN DISPATCH ENDPOINTS
# ============================================================================

@app.get("/api/mail/status")
def api_get_mail_status():
    """Returns the operational status, transport capabilities, and delivery metrics of Sendmail."""
    return get_sendmail_status()

@app.post("/api/mail/send-offer")
def api_send_offer_email(req: SendOfferMailRequest):
    """
    Dispatches curated promotional vouchers, VIP drops, and seasonal discounts
    to customer emails using the Sendmail protocol.
    """
    clean_recip = req.recipient.strip().lower()
    if not clean_recip or "@" not in clean_recip:
        raise HTTPException(status_code=400, detail="Please enter a valid recipient email address.")

    res = send_offer_email(
        recipient=clean_recip,
        offer_title=req.offerTitle,
        discount_percent=req.discountPercent,
        coupon_code=req.couponCode,
        description=req.description,
        expiry_date=req.expiryDate,
        free_shipping=req.freeShipping
    )
    return {"success": True, "result": res}

@app.post("/api/mail/send-tracking")
def api_send_tracking_email(req: SendOrderTrackingMailRequest):
    """
    Dispatches or re-sends high-fidelity order tracking and telemetry emails
    for a specific unique order ID using Sendmail.
    """
    order = get_order_by_id(req.orderId)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{req.orderId}' not found.")

    shipping_info = order.get("shipping") or order.get("shippingInfo") or {}
    recipient = (req.recipient or shipping_info.get("email") or "").strip().lower()
    if not recipient or "@" not in recipient:
        raise HTTPException(status_code=400, detail="No valid recipient email address found for this order.")

    res = send_order_tracking_email(
        recipient=recipient,
        order_id=order["id"],
        stage=order.get("status", "confirmed_by_shop"),
        items=order.get("items", []),
        summary=order.get("summary", {}),
        shipping_address=order.get("delivery_address") or "Client Destination",
        assigned_shop_name=order.get("assigned_shop_name"),
        est_delivery=order.get("estimated_delivery")
    )
    return {"success": True, "result": res}

@app.post("/api/mail/send-security-alert")
def api_send_security_alert(req: SendSecurityAlertMailRequest):
    """Dispatches account security alerts and important compliance notices using Sendmail."""
    clean_recip = req.recipient.strip().lower()
    if not clean_recip or "@" not in clean_recip:
        raise HTTPException(status_code=400, detail="Please enter a valid recipient email address.")

    res = send_security_alert_email(
        recipient=clean_recip,
        alert_title=req.alertTitle,
        alert_message=req.alertMessage
    )
    return {"success": True, "result": res}

@app.post("/api/mail/test")
def api_sendmail_test(req: SendMailTestRequest):
    """Tests Sendmail delivery across any supported category (otp, offer, tracking, security)."""
    clean_recip = req.recipient.strip().lower()
    cat = req.category.lower().strip()
    if cat == "offer":
        res = send_offer_email(clean_recip, "Maison Cread Welcome Privilege", 20, req.token or "MAISON20", "Exclusive welcome offer across curated boutique items.")
    elif cat == "tracking":
        res = send_order_tracking_email(clean_recip, req.token or "MC-ORD-2026-99999", "dispatched", [{"title": "Royal Oak Perpetual Chronograph", "price": 48500, "quantity": 1}], {"subtotal": 48500, "total": 48500}, "10 Place Vendôme, Paris")
    elif cat == "security":
        res = send_security_alert_email(clean_recip, "Account Security Verification", "This is an automated verification of your Maison Cread account security via Sendmail.")
    else:
        res = send_otp_email(clean_recip, req.token or "777888", purpose="verification")

    return {"success": True, "result": res}

# ============================================================================
# DATA PRIVACY & SOVEREIGNTY (DPDP ACT 2023 & GDPR ARTICLE 17 ERASURE)
# ============================================================================

@app.post("/api/auth/delete-account")
def api_delete_account(
    req: DeleteAccountRequest,
    user: Dict[str, Any] = Depends(get_current_user_from_header)
):
    """
    DPDP Act 2023 (Sec 12) & GDPR (Art 17) Right to Erasure endpoint.
    Hard-deletes customer personal data while retaining anonymized transaction
    records strictly necessary for statutory tax/GST compliance.
    """
    if req.confirmation.strip() != "DELETE MY ACCOUNT":
        raise HTTPException(status_code=400, detail="Please type 'DELETE MY ACCOUNT' to confirm permanent erasure.")
    
    if not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect password. Authentication required for account erasure.")
    
    delete_user_account(user["id"])
    return {
        "success": True,
        "message": "Your personal data and account have been permanently erased pursuant to Section 12 of the DPDP Act 2023 and GDPR Article 17. Statutory GST audit records have been anonymized."
    }

@app.get("/api/auth/export-data")
def api_export_data(user: Dict[str, Any] = Depends(get_current_user_from_header)):
    """
    Data Portability export under GDPR Art 20 and DPDP Act Sec 11.
    Returns all personal data and order records held on the user in machine-readable JSON format.
    """
    orders = db_get_orders(user_id=user["id"])
    return {
        "user_profile": format_user_response(user),
        "order_history": orders,
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "compliance_standard": "DPDP Act 2023 Sec 11 / GDPR Art 20 Data Portability"
    }

# ============================================================================
# CATALOG & PRODUCT ENDPOINTS
# ============================================================================

@app.get("/api/categories")
def api_get_categories():
    """Returns dynamic categories present in the database, ordered by frequency."""
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT category, COUNT(*) as cnt
        FROM products
        WHERE category IS NOT NULL AND category != '' AND status = 'active'
        GROUP BY category
        ORDER BY cnt DESC, category ASC
    """)
    rows = cur.fetchall()
    conn.close()

    cats = ["all"]
    for r in rows:
        c = r[0]
        if c not in cats:
            cats.append(c)

    return cats

@app.get("/api/products")
def api_get_products(
    limit: int = 50,
    skip: int = 0,
    category: Optional[str] = "all",
    subcategory: Optional[str] = None,
    search: Optional[str] = "",
    sortBy: Optional[str] = "featured",
    order: Optional[str] = "asc",
    maxPrice: Optional[float] = None,
    minPrice: Optional[float] = None,
    brand: Optional[str] = "all",
    cursor: Optional[int] = None
):
    """Catalog search supporting all products from backend/api."""
    conn = sqlite3.connect(DB_PATH)
    res = get_search_results(
        conn=conn,
        search_query=search or "",
        category=category or "all",
        subcategory=subcategory or None,
        brand=brand or "all",
        min_price=minPrice,
        max_price=maxPrice,
        sort_by=sortBy or "featured",
        limit=limit,
        cursor=cursor or (skip if skip > 0 else None)
    )
    conn.close()

    return {
        "products": res["products"],
        "total": res["total"],
        "skip": skip,
        "limit": limit,
        "hasMore": res["hasMore"],
        "nextCursor": res["nextCursor"]
    }

@app.get("/api/products/{product_id}")
def api_get_product_by_id(product_id: int):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sku, slug, title, description, currency, price, mrp, discount_percentage,
               category, brand, thumbnail, images, tags, specs, rating, review_count, stock,
               weight_g, is_serialized, is_obd_required, is_fragile, is_bulky, is_returnable,
               shop_id, shop_name, expiry_date, manufacturing_date, batch_number, is_perishable
        FROM products WHERE id = ?
    """, (product_id,))
    r = cur.fetchone()
    conn.close()

    if not r:
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        images = json.loads(r[12]) if r[12] else []
    except Exception:
        images = [r[11]] if r[11] else []

    try:
        tags = json.loads(r[13]) if r[13] else []
    except Exception:
        tags = []

    try:
        specs = json.loads(r[14]) if r[14] else {}
    except Exception:
        specs = {}

    return {
        "id": r[0],
        "sku": r[1],
        "slug": r[2],
        "title": r[3],
        "description": r[4],
        "currency": r[5] or "INR",
        "price": float(r[6] or 0),
        "mrp": float(r[7] or r[6] or 0),
        "discountPercentage": float(r[8] or 0),
        "category": r[9],
        "brand": r[10] or "Maison Cread",
        "thumbnail": r[11],
        "images": images,
        "tags": tags,
        "specs": specs,
        "rating": float(r[15] or 4.5),
        "reviewCount": r[16] or 24,
        "stock": r[17] or 50,
        "weight_g": r[18] or 250,
        "isSerialized": bool(r[19]),
        "isObdRequired": bool(r[20]),
        "isFragile": bool(r[21]),
        "isBulky": bool(r[22]),
        "isReturnable": bool(r[23]),
        "shopId": r[24] if len(r) > 24 else None,
        "shopName": r[25] if len(r) > 25 else None,
        "expiryDate": r[26] if len(r) > 26 else None,
        "manufacturingDate": r[27] if len(r) > 27 else None,
        "batchNumber": r[28] if len(r) > 28 else None,
        "isPerishable": bool(r[29]) if len(r) > 29 and r[29] is not None else False,
        "status": "active"
    }

# ============================================================================
# SELLER PORTAL & INVENTORY CREATION ENDPOINTS
# ============================================================================

ROOT_DB_PATH = Path(DB_PATH).resolve().parent.parent / "ecommerce.db"

@app.post("/api/seller/products", status_code=201)
def api_seller_create_product(req: SellerProductCreateRequest):
    title = sanitize_input(req.title)
    if not title or len(title) < 3:
        raise HTTPException(status_code=400, detail="Product title must be at least 3 characters")
    if req.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")
    if req.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")
    if not req.thumbnail or not req.thumbnail.startswith("http"):
        raise HTTPException(status_code=400, detail="Valid HTTP image URL is required")

    cat_slug = req.category.strip().lower().replace(" ", "-")
    cat_name = req.category.strip().title()

    now = datetime.now(timezone.utc)
    harvest_time = req.harvestTimestamp or f"{now.strftime('%Y-%m-%d %I:%M %p')} IST (Fresh Harvest Batch)"

    packaging = req.packagingProtocol or [
        "Thermal Insulated Eco-Shield Container",
        "Cold-Chain Cryo Gel Mat (0-2°C Continuous)",
        "Zero-Impact Shock Padded Interior",
        "Tamper-Evident Security Seal"
    ]

    specs = {
        "Farm / Origin": req.brand or "Maison Partner Estate",
        "Harvested / Published": harvest_time,
        "Freshness Guarantee": req.freshnessWindow or "7 Days Peak Freshness Window",
        "Storage Temperature": req.storageTemp or "1.4°C Continuous Cold Chain",
        "Packaging Protocol": ", ".join(packaging),
        "Surplus Pledge": req.surplusPledge or "Unsold daily stock pledged to partner children's sanctuary at dusk",
        "Quality Inspection": "Verified 10-Point Freshness, Quality & Cold-Chain Protocol",
        "Seller ID": "Maison-Verified-Artisan-Partner"
    }

    tags = [cat_slug, "daily-fresh", "artisan-verified", "zero-waste", "certified-handling"]

    price_usd = round(req.price / 83.5, 2)
    mrp_usd = round((req.mrp or (req.price * 1.15)) / 83.5, 2)

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COALESCE(MAX(id), 0) FROM products")
    new_id = cur.fetchone()[0] + 1

    sku = f"SELLER-{cat_slug[:3].upper()}-{new_id:06d}"
    slug = f"{cat_slug}-{new_id}-{title.lower().replace(' ', '-')[:25]}"

    images = req.images if req.images and len(req.images) > 0 else [req.thumbnail]

    cur.execute("""
        INSERT INTO products (
            id, sku, slug, title, description, currency, price, mrp, discount_percentage,
            category, category_name, brand, thumbnail, images, tags, specs, rating, review_count, stock, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        new_id,
        sku,
        slug,
        title,
        f"{req.description} Handled and packaged under strict Maison White-Glove standards. Published fresh from {req.brand}.",
        "USD",
        price_usd,
        mrp_usd,
        float(req.discountPercentage or 0),
        cat_slug,
        cat_name,
        req.brand,
        req.thumbnail,
        json.dumps(images),
        json.dumps(tags),
        json.dumps(specs),
        5.0,
        1,
        req.stock,
        "active"
    ))

    # Also update products_fts index
    try:
        cur.execute("INSERT INTO products_fts (rowid, title, description, category, brand, tags) VALUES (?, ?, ?, ?, ?, ?)",
                    (new_id, title, req.description, cat_slug, req.brand, json.dumps(tags)))
    except Exception:
        pass

    conn.commit()
    conn.close()

    # Sync into root DB if exists
    if ROOT_DB_PATH.exists() and str(ROOT_DB_PATH) != str(Path(DB_PATH).resolve()):
        try:
            rconn = sqlite3.connect(ROOT_DB_PATH)
            rcur = rconn.cursor()
            rcur.execute("""
                INSERT OR REPLACE INTO products (
                    id, sku, slug, title, description, currency, price, mrp, discount_percentage,
                    category, category_name, brand, thumbnail, images, tags, specs, rating, review_count, stock, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                new_id, sku, slug, title,
                f"{req.description} Handled and packaged under strict Maison White-Glove standards. Published fresh from {req.brand}.",
                "USD", price_usd, mrp_usd, float(req.discountPercentage or 0),
                cat_slug, cat_name, req.brand, req.thumbnail, json.dumps(images), json.dumps(tags), json.dumps(specs),
                5.0, 1, req.stock, "active"
            ))
            try:
                rcur.execute("INSERT INTO products_fts (rowid, title, description, category, brand, tags) VALUES (?, ?, ?, ?, ?, ?)",
                            (new_id, title, req.description, cat_slug, req.brand, json.dumps(tags)))
            except Exception:
                pass
            rconn.commit()
            rconn.close()
        except Exception:
            pass

    return {
        "success": True,
        "message": f"Product '{title}' published and live in inventory!",
        "product": {
            "id": new_id,
            "sku": sku,
            "slug": slug,
            "title": title,
            "category": cat_slug,
            "brand": req.brand,
            "price": price_usd,
            "mrp": mrp_usd,
            "stock": req.stock,
            "thumbnail": req.thumbnail,
            "images": images,
            "specs": specs,
            "rating": 5.0,
            "reviewCount": 1
        }
    }

@app.get("/api/seller/inventory")
def api_get_seller_inventory():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sku, slug, title, category, brand, thumbnail, price, mrp, stock, rating, specs, created_at
        FROM products
        WHERE sku LIKE 'SELLER-%' OR id > 175
        ORDER BY id DESC
        LIMIT 50
    """)
    rows = cur.fetchall()

    cur.execute("SELECT COUNT(*), SUM(stock) FROM products WHERE status = 'active'")
    tot_p, tot_stock = cur.fetchone()
    conn.close()

    items = []
    for r in rows:
        try:
            specs = json.loads(r[11]) if r[11] else {}
        except Exception:
            specs = {}
        items.append({
            "id": r[0],
            "sku": r[1],
            "slug": r[2],
            "title": r[3],
            "category": r[4],
            "brand": r[5],
            "thumbnail": r[6],
            "price": float(r[7] or 0),
            "mrp": float(r[8] or r[7] or 0),
            "stock": r[9] or 0,
            "rating": float(r[10] or 5.0),
            "specs": specs,
            "createdAt": r[12]
        })

    return {
        "totalProducts": tot_p,
        "totalInventoryUnits": tot_stock or 0,
        "recentListings": items
    }

@app.patch("/api/seller/inventory/{product_id}/stock")
def api_update_product_stock(product_id: int, req: SellerInventoryUpdateRequest):
    if req.stock < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT specs FROM products WHERE id = ?", (product_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found")

    try:
        specs = json.loads(row[0]) if row[0] else {}
    except Exception:
        specs = {}

    if req.harvestTimestamp:
        specs["Harvested / Published"] = req.harvestTimestamp

    cur.execute("UPDATE products SET stock = ?, specs = ? WHERE id = ?", (req.stock, json.dumps(specs), product_id))
    conn.commit()
    conn.close()

    return {"success": True, "productId": product_id, "newStock": req.stock}

# ============================================================================
# ORDERS & COMMERCE ENDPOINTS
# ============================================================================

VALID_COUPONS = {
    "WELCOME10": {"discountPercent": 10, "freeShipping": False},
    "SHOPCREAD": {"discountPercent": 15, "freeShipping": True},
    "MAISON20": {"discountPercent": 20, "freeShipping": True},
    "FREESHIP": {"discountPercent": 0, "freeShipping": True},
    "HOPE-BLOOM-20": {"discountPercent": 20, "freeShipping": True},
    "ORPHANAGE-LOVE": {"discountPercent": 20, "freeShipping": True},
    "ZERO-WASTE-15": {"discountPercent": 15, "freeShipping": True},
    "MAISON-IMPACT": {"discountPercent": 25, "freeShipping": True},
}

@app.get("/api/fresh/daily-status")
def get_daily_fresh_status():
    now = datetime.now(timezone.utc)
    batch_date = now.strftime("%Y-%m-%d")
    batch_id = f"HARVEST-{now.strftime('%Y%m%d')}-0500"

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM products WHERE category = 'organic-fruits' AND status = 'active'")
    fruit_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM products WHERE category = 'fresh-flowers' AND status = 'active'")
    flower_cnt = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM products WHERE category = 'fresh-fish' AND status = 'active'")
    fish_cnt = cur.fetchone()[0]
    conn.close()

    return {
        "batchId": batch_id,
        "harvestDate": batch_date,
        "harvestTime": "05:00 AM Daily Fresh Cycle",
        "coldChainTemp": "1.4°C (Optimal 0–2°C Continuous Cold Chain)",
        "varietyCount": {
            "organicFruits": fruit_cnt,
            "freshFlowers": flower_cnt,
            "freshFish": fish_cnt,
            "totalFreshVariety": fruit_cnt + flower_cnt + fish_cnt,
            "dailyHarvestUnits": "50,000+ Units Daily"
        },
        "zeroWastePledge": {
            "policy": "100% Zero-Waste Farm-to-Sanctuary Cycle. Daily morning harvests are updated automatically at 05:00 AM. At dusk, all surplus unsold floral arrangements are personally delivered to decorate partner orphanages, pediatric care rooms, and hospice centers for free. Unsold organic fruits are distributed to children's food programs for free or nominal micro-cost.",
            "orphanagesDecoratedToday": 24,
            "flowerArrangementsDonated": 340,
            "childrenMealsSponsored": 2850,
            "surplusRedistributionRate": "99.4% Waste Diverted",
            "partnerShelters": [
                {"name": "Sunshine Children's Sanctuary", "city": "Bengaluru", "children": 120, "impact": "Study hall floral decor & fruit breakfast"},
                {"name": "Lotus Child Welfare Home", "city": "Mumbai", "children": 85, "impact": "Classroom cheer bouquets & daily nutrition"},
                {"name": "Hope Haven Children's Home", "city": "Delhi NCR", "children": 140, "impact": "Living quarters floral warmth & fresh fruit feast"},
                {"name": "Little Angels Pediatric Care", "city": "Pune", "children": 60, "impact": "Aromatherapy lavender & botanical ward decoration"},
                {"name": "Grace Foundation Youth Shelter", "city": "Kolkata", "children": 95, "impact": "High-protein fish nutrition & fresh fruits"}
            ]
        }
    }

@app.post("/api/donations/calculate")
def calculate_donation_impact(req: DonationCalculateRequest):
    amt = max(10.0, float(req.amount))

    if amt < 75:
        impact_desc = f"Provides 1 kg fresh organic fruit breakfast basket for 5 children at {req.beneficiary}."
        meals = int(amt / 10)
        decor = "1 tabletop classroom floral cheer arrangement"
    elif amt < 200:
        impact_desc = f"Sponsors a 2.5 kg organic fruit basket and fresh morning bloom bouquets to decorate the children's study library at {req.beneficiary}."
        meals = int(amt / 12)
        decor = "2 study hall floral arrangements"
    elif amt < 400:
        impact_desc = f"Funds a full week of high-protein fresh fish and organic seasonal fruit nutrition for a child at {req.beneficiary}."
        meals = int(amt / 15)
        decor = "Full dormitory room fresh botanical decoration"
    else:
        impact_desc = f"Decorates the main celebration hall with fresh harvest florals and sponsors a grand organic fruit and wild catch feast for 30+ children at {req.beneficiary}."
        meals = int(amt / 16)
        decor = "Full campus floral sanctuary decoration"

    return {
        "amount": amt,
        "beneficiary": req.beneficiary or "Sunshine Children's Sanctuary",
        "impactDescription": impact_desc,
        "mealsSponsored": max(3, meals),
        "decorContribution": decor,
        "rewardCoupon": {
            "code": "HOPE-BLOOM-20",
            "discountPercent": 20,
            "freeShipping": True,
            "message": "Instant 20% Off Benefactor Coupon unlocked with your pledge!"
        },
        "badge": "Maison Hope Angel"
    }

@app.post("/api/coupons/validate")
def validate_coupon(req: CouponRequest):
    code = req.code.strip().upper()
    if code in VALID_COUPONS:
        info = VALID_COUPONS[code]
        return {
            "valid": True,
            "code": code,
            "discountPercent": info["discountPercent"],
            "freeShipping": info["freeShipping"],
            "message": f"Coupon {code} applied successfully!"
        }
    raise HTTPException(status_code=400, detail="Invalid coupon code.")

@app.post("/api/orders")
def place_order(order_data: Dict[str, Any], current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_id = current_user.get("id") if current_user else None
    order_result = create_order(order_data, user_id=user_id)

    # Dispatched via Sendmail: Order Confirmation and Tracking Telemetry
    try:
        shipping_info = order_data.get("shipping") or order_data.get("shippingInfo") or {}
        recipient_email = (
            shipping_info.get("email") or
            (current_user.get("email") if current_user else None) or
            order_data.get("customerEmail")
        )
        if recipient_email and "@" in str(recipient_email):
            clean_recip = str(recipient_email).strip().lower()
            send_order_tracking_email(
                recipient=clean_recip,
                order_id=order_result["id"],
                stage=order_result.get("status", "confirmed_by_shop"),
                items=order_result.get("items", []),
                summary=order_result.get("summary", {}),
                shipping_address=order_result.get("delivery_address") or "Client Private Address",
                assigned_shop_name=order_result.get("assigned_shop_name"),
                est_delivery=order_result.get("estimated_delivery")
            )
            print(f"[Sendmail Service] Dispatched Order Confirmation email for #{order_result['id']} to {clean_recip}")
    except Exception as mail_err:
        print(f"[Sendmail Service] Warning: Failed to dispatch order confirmation email: {mail_err}")

    # Synchronize order into Neon queryable shipments table
    try:
        sync_order_to_shipment_in_neon(order_result)
    except Exception as neon_err:
        print(f"[Neon Sync] Warning: Failed to sync order to Neon shipment: {neon_err}")

    return order_result

@app.get("/api/orders")
def fetch_orders(current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_id = current_user.get("id") if current_user else None
    return db_get_orders(user_id=user_id)

@app.get("/api/orders/track/{order_id}")
def api_track_order(order_id: str):
    """
    Retrieves full real-time tracking details for a unique order ID.
    Includes active pipeline step, origin atelier, distance, map coordinates, and items.
    """
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' was not found in the Maison ledger.")
    return order

@app.put("/api/orders/track/{order_id}/status")
def api_update_order_status(order_id: str, payload: Dict[str, Any]):
    new_stage = payload.get("status") or payload.get("stage")
    notes = payload.get("notes")
    if not new_stage:
        raise HTTPException(status_code=400, detail="New status/stage must be provided.")
    updated = update_order_tracking_status(order_id, new_stage, notes)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")

    # Dispatched via Sendmail: Real-time status update to customer email
    try:
        shipping_info = updated.get("shipping") or updated.get("shippingInfo") or {}
        recipient_email = shipping_info.get("email")
        if recipient_email and "@" in str(recipient_email):
            clean_recip = str(recipient_email).strip().lower()
            send_order_tracking_email(
                recipient=clean_recip,
                order_id=order_id,
                stage=new_stage,
                items=updated.get("items", []),
                summary=updated.get("summary", {}),
                shipping_address=updated.get("delivery_address") or "Client Destination",
                assigned_shop_name=updated.get("assigned_shop_name"),
                est_delivery=updated.get("estimated_delivery"),
                notes=notes
            )
            print(f"[Sendmail Service] Dispatched Order Tracking Stage Update ({new_stage}) email for #{order_id} to {clean_recip}")
    except Exception as mail_err:
        print(f"[Sendmail Service] Warning: Failed to dispatch order tracking update email: {mail_err}")

    return updated

# ============================================================================
# NEON QUERYABLE SHIPMENT, WAREHOUSE & LOCAL STORE TRACKING ENDPOINTS
# ============================================================================

@app.get("/api/shipments/track/{tracking_or_id}")
def api_get_complete_shipment(tracking_or_id: str):
    """
    Queries Neon PostgreSQL for high-assurance shipment tracking, joining
    origin warehouses, local store ateliers, live telemetry, and manifest items.
    """
    clean_id = tracking_or_id.strip()
    shipment = get_complete_shipment(clean_id)
    if not shipment:
        raise HTTPException(status_code=404, detail=f"Shipment or Order '{clean_id}' was not found in Neon tracking ledger.")
    return shipment

@app.get("/api/shipments")
def api_list_shipments(limit: int = 50, status: Optional[str] = None):
    """Lists queryable shipments from Neon PostgreSQL."""
    return list_neon_shipments(limit=limit, status=status)

@app.get("/api/shipments/warehouses")
def api_list_warehouses():
    """Lists queryable regional warehouses and cryogenic vaults from Neon PostgreSQL."""
    return list_neon_warehouses()

@app.get("/api/shipments/stores")
def api_list_stores(city: Optional[str] = None):
    """Lists queryable partner boutiques and ateliers from Neon PostgreSQL."""
    return list_neon_local_stores(city=city)

# ============================================================================
# GEOLOCATION & GOOGLE MAPS STORE DISTRIBUTOR ENDPOINTS
# ============================================================================

@app.get("/api/geo/reverse-geocode")
def api_reverse_geocode(lat: float, lng: float):
    """
    Resolves client GPS coordinates into a verified, exact delivery address.
    """
    return reverse_geocode_coordinates(lat, lng)

@app.get("/api/geo/nearby-stores")
def api_get_nearby_stores(lat: float, lng: float, radius: float = 5000.0):
    """
    Calculates geodesic distance from customer coordinates to all registered ateliers,
    ranking them nearest first with delivery SLAs and dispatch readiness.
    """
    shops = get_all_shops()
    return find_nearby_registered_stores(lat, lng, shops, max_radius_km=radius)

@app.post("/api/geo/scrape-stores")
def api_scrape_stores(payload: Dict[str, Any]):
    """
    Open-source map scraper endpoint: searches Google Maps / OSM for boutiques,
    ateliers, and partner shops in a given city or query, with optional direct registration.
    """
    query = payload.get("query", "luxury boutique")
    city = payload.get("city")
    max_results = int(payload.get("maxResults", 8))
    register_new = bool(payload.get("registerNew", False))

    results = scrape_google_maps_stores(query, city=city, max_results=max_results)

    if register_new and results:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        for s in results:
            s_id = f"SHOP-SCRAPE-{abs(hash(s['name'])) % 9000 + 1000}"
            cur.execute("""
                INSERT OR IGNORE INTO shops (
                    shop_id, name, location, latitude, longitude, address, city,
                    phone, operating_hours, delivery_radius_km, category
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 35.0, ?)
            """, (
                s_id,
                s["name"],
                f"{s.get('city', 'Paris')}, {s.get('country', 'International')}",
                s["latitude"],
                s["longitude"],
                s.get("display_name", s["name"]),
                s.get("city", "Paris"),
                s.get("phone", "+33 1 42 68 00 00"),
                s.get("operating_hours", "10:00 AM - 08:00 PM"),
                s.get("category", "Partner Boutique")
            ))
        conn.commit()
        conn.close()

    return {
        "success": True,
        "query": query,
        "city": city,
        "count": len(results),
        "stores": results,
        "registered": register_new
    }

# ============================================================================
# GROUNDED AI SHOPPING ASSISTANT
# ============================================================================

@app.post("/api/chat")
@app.post("/api/chat/recommend")
def api_chat(req: AIChatRequest, current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user)):
    user_msg = req.message.strip()
    if not user_msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    from backend.ai_concierge_service import process_concierge_chat
    return process_concierge_chat(user_msg, current_user=current_user, conversation_history=req.history)

@app.post("/api/chat/reset")
def reset_ai_chat():
    return {"status": "reset", "message": "Conversation history reset."}

# ============================================================================
# BNS (Bridge Numbering Service) Phone Number Hiding Protocol & Order Verification
# ============================================================================

@app.post("/api/support/bns/initiate")
def api_bns_initiate(req: BnsInitiateRequest):
    """
    Initiates BNS Phone Number Hiding Protocol for customer support order verification.
    Generates a virtual bridge hotline, masks customer phone number (Zero-Knowledge),
    and mints an encrypted 6-digit verification PIN.
    """
    if not req.order_id or not req.order_id.strip():
        raise HTTPException(status_code=400, detail="Order ID is required to initiate BNS verification.")
    return initiate_bns_verification(req.order_id.strip(), req.phone)

@app.post("/api/support/bns/verify")
def api_bns_verify(req: BnsVerifyRequest):
    """
    Verifies the customer order using the 6-digit BNS one-time verification PIN.
    Authenticates delivery clearance without ever exposing the customer's raw phone number.
    """
    if not req.order_id or not req.verification_pin:
        raise HTTPException(status_code=400, detail="Order ID and Verification PIN are required.")
    return verify_bns_order(req.order_id.strip(), req.verification_pin.strip(), req.session_id)

@app.get("/api/support/bns/status")
def api_bns_status():
    """
    Returns real-time health, virtual bridge hotline availability, and DPDP privacy metrics.
    """
    return get_bns_status()

# ============================================================================
# Neon Backend Services (Postgres, Storage, Functions, Auth, Realtime)
# ============================================================================

@app.get("/api/neon/health")
def api_neon_health():
    """Returns real-time diagnostics of all 5 Neon cloud services."""
    return get_all_neon_diagnostics()

@app.get("/api/neon/functions/hello")
def api_neon_functions_hello():
    """Directly invokes the deployed Neon serverless Function."""
    return test_functions_service()

@app.get("/api/neon/storage/files")
def api_neon_storage_files():
    """Lists files in the Neon Object Storage bucket."""
    return test_storage_service()

class NeonUploadRequest(BaseModel):
    filename: str
    content: str
    contentType: Optional[str] = "text/plain"

@app.post("/api/neon/storage/upload")
def api_neon_storage_upload(req: NeonUploadRequest):
    """Uploads a file to the Neon Object Storage assets bucket."""
    s3 = get_s3_client()
    if not s3:
        raise HTTPException(status_code=500, detail="Neon Object Storage not configured")
    try:
        key = f"uploads/{req.filename}"
        s3.put_object(
            Bucket=NEON_BUCKET,
            Key=key,
            Body=req.content.encode('utf-8'),
            ContentType=req.contentType
        )
        presigned_url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': NEON_BUCKET, 'Key': key},
            ExpiresIn=7200
        )
        return {
            "success": True,
            "bucket": NEON_BUCKET,
            "key": key,
            "url": presigned_url,
            "message": f"Successfully uploaded '{key}' to Neon Object Storage"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/neon/products")
def api_neon_products(limit: int = 10):
    """Queries products directly from Neon Lakebase Postgres."""
    conn = get_neon_postgres_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="Neon Postgres not configured")
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, sku, title, category, price, thumbnail, stock, rating FROM products ORDER BY id LIMIT %s", (limit,))
                rows = cur.fetchall()
        conn.close()
        return {
            "source": "Neon Lakebase Postgres (AWS ap-southeast-1)",
            "count": len(rows),
            "products": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/neon/auth/config")
def api_neon_auth_config():
    """Returns Neon Auth JWKS and Base URL configuration."""
    return test_auth_service()

@app.get("/api/neon/realtime/info")
def api_neon_realtime_info():
    """Returns Neon Realtime WebSocket connection info."""
    return test_realtime_service()

# ============================================================================
# CockroachDB Labs Storage Integration
# ============================================================================

from backend.cockroach_service import test_cockroach_service, get_cockroach_connection

@app.get("/api/cockroach/status")
def api_cockroach_status():
    """Returns the live connection status of Cockroach Labs storage."""
    return test_cockroach_service()

@app.get("/api/cockroach/products")
def api_cockroach_products(limit: int = 10):
    """Queries products directly from CockroachDB Cloud storage."""
    conn = get_cockroach_connection()
    if not conn:
        raise HTTPException(status_code=500, detail="CockroachDB storage not connected")
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, sku, title, category, price, thumbnail, stock, rating FROM products ORDER BY id LIMIT %s", (limit,))
                rows = cur.fetchall()
        conn.close()
        return {
            "source": "CockroachDB Cloud Serverless (aws-ap-south-1)",
            "count": len(rows),
            "products": rows
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Cloudinary Image Storage & CDN Edge Cache Integration
# ============================================================================

from backend.cloudinary_service import (
    get_cloudinary_status,
    upload_product_image,
    get_optimized_cdn_url,
    list_recent_assets
)

class CloudinaryUploadRequest(BaseModel):
    file: str
    folder: Optional[str] = "shopcread/products"
    public_id: Optional[str] = None

@app.get("/api/cloudinary/status")
def api_cloudinary_status():
    """Returns live connection and account status for Cloudinary."""
    return get_cloudinary_status()

@app.post("/api/cloudinary/upload")
def api_cloudinary_upload(req: CloudinaryUploadRequest):
    """Uploads an image to Cloudinary storage."""
    try:
        res = upload_product_image(req.file, folder=req.folder or "shopcread/products", public_id=req.public_id)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cloudinary/optimize")
def api_cloudinary_optimize(url: str, width: Optional[int] = 800):
    """Generates an edge-cached, WebP/AVIF auto-optimized Cloudinary CDN URL for any remote image."""
    cdn_url = get_optimized_cdn_url(url, width=width)
    return {
        "original_url": url,
        "optimized_cdn_url": cdn_url,
        "format": "f_auto (WebP/AVIF)",
        "quality": "q_auto (Perceptual Compression)"
    }

@app.get("/api/cloudinary/assets")
def api_cloudinary_assets(limit: int = 15):
    """Lists recent assets in Cloudinary storage."""
    try:
        return {"assets": list_recent_assets(max_results=limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# SOVEREIGN ADMINISTRATIVE CONSOLE & INTELLIGENCE APIs
# ============================================================================

class AdminAuthRequest(BaseModel):
    passkey: str

class AdminShopStatusRequest(BaseModel):
    verification_status: str
    commission_rate: Optional[float] = None

class AdminBuybackActionRequest(BaseModel):
    status: str
    offered_buyout: Optional[float] = None
    notes: Optional[str] = None

class AdminProductUpdateRequest(BaseModel):
    price: Optional[float] = None
    stock: Optional[int] = None
    status: Optional[str] = None

SOVEREIGN_ADMIN_PASSKEYS = {
    "SHOPCREAD-ATELIER-2026",
    "MAISON-SOVEREIGN-ALPHA",
    "SUPERADMIN-VAULT-KEY"
}

@app.post("/api/admin/auth/verify")
def api_admin_auth_verify(req: AdminAuthRequest):
    """Authenticates administrator via cryptographic passkey."""
    if req.passkey.strip() in SOVEREIGN_ADMIN_PASSKEYS:
        return {
            "authenticated": True,
            "role": "superadmin",
            "access_level": "SOVEREIGN_COMMANDER",
            "session_token": "ADM-SEC-" + generate_random_token(24),
            "issued_at": datetime.now(timezone.utc).isoformat()
        }
    raise HTTPException(status_code=403, detail="Invalid Sovereign Administrative Passkey. Access Denied.")

@app.get("/api/admin/analytics")
def api_admin_analytics():
    """Returns platform business intelligence, GMV, velocity, and buy-back metrics."""
    return get_admin_analytics()

@app.get("/api/admin/shops")
def api_admin_shops():
    """Returns directory of luxury vendor storefronts."""
    return {"shops": get_all_shops()}

@app.post("/api/admin/shops/{shop_id}/status")
def api_admin_shop_status(shop_id: str, req: AdminShopStatusRequest):
    """Updates shop verification status or commission rate."""
    updated = update_shop_verification(shop_id, req.verification_status, req.commission_rate)
    if not updated:
        raise HTTPException(status_code=404, detail="Shop not found")
    return {"success": True, "shop": updated}

@app.get("/api/admin/buyback")
def api_admin_buyback():
    """Returns customer buy-back and circular luxury trade-in requests."""
    return {"requests": get_all_buybacks()}

@app.post("/api/admin/buyback/{buyback_id}/action")
def api_admin_buyback_action(buyback_id: str, req: AdminBuybackActionRequest):
    """Processes buy-back evaluation, appraisal, and payout dispatches."""
    updated = update_buyback_action(buyback_id, req.status, req.offered_buyout, req.notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Buy-back request not found")
    return {"success": True, "buyback": updated}

@app.get("/api/admin/products")
def api_admin_products(
    category: Optional[str] = None,
    low_stock: bool = False,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50
):
    """Returns catalog products with admin stock/pricing controls."""
    offset = max(0, (page - 1) * limit)
    return get_admin_products(category=category, low_stock=low_stock, search=search, limit=limit, offset=offset)

@app.patch("/api/admin/products/{product_id}")
def api_admin_product_update(product_id: int, req: AdminProductUpdateRequest):
    """Quick inline update for product stock, price, or active status."""
    updated = update_admin_product_stock_price(product_id, price=req.price, stock=req.stock, status=req.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "product": updated}

# ============================================================================
# MULTI-CLOUD PHILANTHROPIC & DONATION INITIATIVE (ORPHANAGE & OLD AGE HOMES)
# Linked with: Neon PostgreSQL, Cockroach Labs Serverless & Cloudinary CDN
# ============================================================================

from backend.donation_service import (
    get_all_beneficiaries,
    get_beneficiary_by_id,
    record_donation_pledge,
    get_philanthropic_ledger,
    get_donation_cloud_status
)

class DonationPledgeRequest(BaseModel):
    donor_name: Optional[str] = "Generous Benefactor"
    donor_email: str
    donor_phone: Optional[str] = None
    amount_usd: float
    beneficiary_id: str
    cause_category: Optional[str] = "general_philanthropy"
    message: Optional[str] = ""
    tribute_name: Optional[str] = None
    is_anonymous: Optional[bool] = False

@app.get("/api/donations/beneficiaries")
def api_get_donation_beneficiaries(type: Optional[str] = None):
    """
    Returns registered orphanages and old age homes from Neon PostgreSQL,
    with Cloudinary CDN media optimization.
    """
    try:
        beneficiaries = get_all_beneficiaries(beneficiary_type=type)
        return {
            "success": True,
            "count": len(beneficiaries),
            "beneficiaries": beneficiaries
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/donations/beneficiaries/{beneficiary_id}")
def api_get_donation_beneficiary(beneficiary_id: str):
    """Returns a specific orphanage or old age home by ID."""
    b = get_beneficiary_by_id(beneficiary_id)
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    return {"success": True, "beneficiary": b}

@app.post("/api/donations/pledge")
def api_record_donation_pledge(req: DonationPledgeRequest):
    """
    Records a donation pledge across Neon PostgreSQL, Cockroach Labs ledger,
    and dispatches a receipt and reward voucher (HOPE-BLOOM-20) via Sendmail.
    """
    if not req.donor_email or "@" not in req.donor_email:
        raise HTTPException(status_code=400, detail="A valid donor email address is required for receipt delivery.")
    if req.amount_usd < 1.0:
        raise HTTPException(status_code=400, detail="Minimum donation pledge is $1.00 USD.")

    try:
        result = record_donation_pledge(req.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/donations/ledger")
def api_get_philanthropic_ledger(limit: int = 30):
    """
    Returns tamper-proof immutable audit ledger blocks directly from Cockroach Labs Serverless.
    """
    try:
        blocks = get_philanthropic_ledger(limit=limit)
        return {
            "success": True,
            "count": len(blocks),
            "ledger": blocks,
            "consensus_engine": "CockroachDB Serverless (aws-ap-south-1)",
            "verification": "SHA-256 Merkle Block Hash"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/donations/cloud-status")
def api_get_donation_cloud_status():
    """
    Live diagnostic endpoint verifying multi-cloud connectivity across
    Neon PostgreSQL, Cockroach Labs Serverless, and Cloudinary CDN.
    """
    try:
        return get_donation_cloud_status()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))






