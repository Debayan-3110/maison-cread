"""
SMTP Mail Delivery Protocol Service for ShopCread.
Directly dispatches 6-digit verification passcodes and authentication tokens to recipient email inboxes.
Powered by the unified Sendmail & SMTP protocol engine.
"""
from typing import Dict, Any, Optional
from backend.sendmail_service import (
    is_smtp_configured,
    get_sendmail_status as get_smtp_status,
    send_otp_email,
    send_offer_email,
    send_order_tracking_email,
    send_security_alert_email,
    dispatch_email
)

def send_email_smtp(recipient: str, subject: str, otp: str, purpose: str = "verification") -> Dict[str, Any]:
    """
    Directly dispatches an email using the SMTP / Sendmail protocol.
    Delegates directly to Sendmail service for high-assurance delivery.
    """
    return send_otp_email(recipient=recipient, otp=otp, purpose=purpose)

