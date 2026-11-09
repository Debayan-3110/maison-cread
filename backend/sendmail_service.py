"""
ShopCread Sendmail & Direct Mail Protocol Engine
================================================
Comprehensive, high-assurance email delivery system handling:
1. One-Time Passcodes (OTPs) for Email Login, Sign-Up, 2FA, and Password Recovery.
2. Curated VIP Offers, Vouchers, Flash Sales, and Benefactor Coupons.
3. High-Fidelity Order Tracking & Confirmation Notices with Unique Order IDs,
   interactive tracking buttons, timeline progress, and atelier telemetry.
4. Critical Security & Account Notices (Password Resets, Login Alerts, Data Exports).

Dispatches via:
- Mode A: System `sendmail` executable (`sendmail -t -i`) piped directly through subprocess.
- Mode B: Python Direct SMTP `sendmail` protocol (`server.sendmail(...)` via TLS/SSL).
- Mode C: Development & Forensic Interceptor (`mock_emails` DB table) ensuring
  instant inspectability in the UI Dev Mailbox and 100% offline development resilience.
"""
import os
import shutil
import smtplib
import socket
import subprocess
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formatdate, make_msgid
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dotenv import load_dotenv

ROOT_ENV = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(ROOT_ENV)

# SMTP / Sendmail Environment Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER or "concierge@shopcread.com").strip()
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Maison Cread Concierge").strip()
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() in ("true", "1", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes")

SENDMAIL_PATH = os.getenv("SENDMAIL_PATH", "").strip()
SENDMAIL_FALLBACK_SMTP = os.getenv("SENDMAIL_FALLBACK_SMTP", "true").lower() in ("true", "1", "yes")


def is_sendmail_binary_available() -> Tuple[bool, Optional[str]]:
    """Checks if a local sendmail executable is present on the host system."""
    if SENDMAIL_PATH and os.path.isfile(SENDMAIL_PATH) and os.access(SENDMAIL_PATH, os.X_OK):
        return True, SENDMAIL_PATH

    # Check system PATH
    sys_sendmail = shutil.which("sendmail")
    if sys_sendmail and os.path.isfile(sys_sendmail):
        return True, sys_sendmail

    # Check standard Unix/Linux locations
    standard_paths = [
        "/usr/sbin/sendmail",
        "/usr/lib/sendmail",
        "/bin/sendmail",
        "/usr/bin/sendmail"
    ]
    for p in standard_paths:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return True, p

    return False, None


def is_smtp_configured() -> bool:
    """Returns True if minimum required SMTP credentials are provided."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def get_sendmail_status() -> Dict[str, Any]:
    """Returns the comprehensive Sendmail and SMTP engine configuration status."""
    has_binary, binary_path = is_sendmail_binary_available()
    smtp_ok = is_smtp_configured()

    masked_user = ""
    if SMTP_USER:
        parts = SMTP_USER.split("@")
        if len(parts) == 2:
            prefix = parts[0]
            masked_user = f"{prefix[:2]}***@{parts[1]}"
        else:
            masked_user = f"{SMTP_USER[:2]}***"

    # Count total recorded mock emails
    total_mock = 0
    try:
        from backend.database import get_mock_emails
        total_mock = len(get_mock_emails(200))
    except Exception:
        pass

    return {
        "status": "active",
        "service": "ShopCread Universal Sendmail Engine",
        "sendmail_binary": {
            "available": has_binary,
            "path": binary_path
        },
        "smtp_gateway": {
            "configured": smtp_ok,
            "host": SMTP_HOST,
            "port": SMTP_PORT,
            "use_tls": SMTP_USE_TLS,
            "use_ssl": SMTP_USE_SSL,
            "account": masked_user if masked_user else None
        },
        "from_address": f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>",
        "dev_mailbox_interceptor": "active",
        "total_dispatched_emails": total_mock,
        "capabilities": [
            "otps",
            "offers_and_vouchers",
            "order_tracking",
            "security_alerts",
            "account_notices"
        ]
    }


def _execute_sendmail_binary(binary_path: str, raw_message: str) -> Tuple[bool, str]:
    """Executes the system sendmail binary with the raw MIME message passed via stdin."""
    try:
        cmd = [binary_path, "-t", "-i"]
        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        stdout, stderr = proc.communicate(input=raw_message, timeout=15)
        if proc.returncode == 0:
            return True, f"Delivered via sendmail binary ({binary_path})"
        return False, f"Sendmail binary returned exit code {proc.returncode}: {stderr.strip()}"
    except Exception as e:
        return False, f"Sendmail execution error: {str(e)}"


def _execute_smtp_sendmail(from_addr: str, to_addr: str, raw_message: str) -> Tuple[bool, str]:
    """Dispatches the raw message via smtplib.sendmail() using SMTP credentials."""
    server = None
    try:
        if SMTP_USE_SSL:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12)

        server.ehlo()
        if SMTP_USE_TLS and not SMTP_USE_SSL:
            server.starttls()
            server.ehlo()

        if SMTP_USER and SMTP_PASSWORD:
            server.login(SMTP_USER, SMTP_PASSWORD)

        server.sendmail(from_addr, [to_addr], raw_message)
        server.quit()
        server = None
        return True, f"Delivered via direct SMTP sendmail ({SMTP_HOST}:{SMTP_PORT})"
    except (smtplib.SMTPException, socket.error, Exception) as e:
        if server:
            try:
                server.quit()
            except Exception:
                pass
        return False, f"SMTP sendmail error: {str(e)}"


def dispatch_email(
    recipient: str,
    subject: str,
    text_body: str,
    html_body: str,
    email_type: str = "general",
    token: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Universal dispatcher that crafts the MIME structure, records to the database
    interceptor for dev/forensics, and sends via Sendmail binary or Python SMTP sendmail.
    """
    clean_recipient = (recipient or "").strip().lower()
    if not clean_recipient or "@" not in clean_recipient:
        return {
            "success": False,
            "error": "Invalid recipient email address.",
            "recipient": clean_recipient
        }

    # Construct standard RFC 822 MIME message
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    from_header = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>" if SMTP_FROM_NAME else SMTP_FROM_EMAIL
    msg["From"] = from_header
    msg["To"] = clean_recipient
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="shopcread.internal" if not SMTP_HOST else SMTP_HOST)

    part_text = MIMEText(text_body, "plain", "utf-8")
    part_html = MIMEText(html_body, "html", "utf-8")
    msg.attach(part_text)
    msg.attach(part_html)

    raw_message = msg.as_string()

    # Always persist to mock_emails for zero-friction development inspectability in UI
    try:
        from backend.database import save_mock_email
        save_mock_email(
            recipient=clean_recipient,
            subject=subject,
            email_type=email_type,
            token=token,
            body=html_body or text_body
        )
    except Exception as db_err:
        print(f"[Sendmail Service] Warning: Failed to store in mock_emails: {db_err}")

    # Transport 1: Try local sendmail binary if available
    has_binary, binary_path = is_sendmail_binary_available()
    if has_binary and binary_path:
        ok, reason = _execute_sendmail_binary(binary_path, raw_message)
        if ok:
            print(f"[Sendmail Service] Successfully delivered email to {clean_recipient} via sendmail CLI: {subject}")
            return {
                "success": True,
                "delivered": True,
                "transport": "sendmail_binary",
                "binary": binary_path,
                "recipient": clean_recipient,
                "subject": subject,
                "email_type": email_type,
                "token": token
            }
        print(f"[Sendmail Service] Binary sendmail failed ({reason}), trying SMTP fallback...")

    # Transport 2: Try direct SMTP sendmail protocol
    if is_smtp_configured():
        ok, reason = _execute_smtp_sendmail(SMTP_FROM_EMAIL, clean_recipient, raw_message)
        if ok:
            print(f"[Sendmail Service] Successfully delivered email to {clean_recipient} via SMTP sendmail: {subject}")
            return {
                "success": True,
                "delivered": True,
                "transport": "smtp_sendmail",
                "host": SMTP_HOST,
                "port": SMTP_PORT,
                "recipient": clean_recipient,
                "subject": subject,
                "email_type": email_type,
                "token": token
            }
        print(f"[Sendmail Service] SMTP sendmail error ({reason}).")

    # Transport 3: Simulated delivery (captured in Dev Mailbox)
    print(f"[Sendmail Service] Dispatched email to {clean_recipient} [SIMULATED / DEV MAILBOX]: {subject}")
    return {
        "success": True,
        "delivered": False,
        "simulated": True,
        "transport": "dev_mailbox_interceptor",
        "recipient": clean_recipient,
        "subject": subject,
        "email_type": email_type,
        "token": token,
        "reason": "Live credentials not supplied. Stored in Dev Mailbox for immediate UI testing."
    }


# ============================================================================
# 1. OTP EMAIL TEMPLATES & DISPATCHER
# ============================================================================

def send_otp_email(recipient: str, otp: str, purpose: str = "login") -> Dict[str, Any]:
    """Dispatches a 6-digit verification code using Sendmail."""
    purpose_clean = purpose.lower().replace("email_", "").replace("phone_", "").strip()
    title_map = {
        "login": "Vault Authentication Code",
        "signup": "Maison Account Verification",
        "forgot_password": "Password Recovery Passcode",
        "2fa": "Two-Factor Security Passcode",
        "verification": "Identity Verification Passcode"
    }
    title = title_map.get(purpose_clean, "Security Verification Passcode")
    subject = f"Maison Cread • {title}: {otp}"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020202; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020202; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #0A1218; border: 1px solid rgba(0, 123, 167, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 0 40px rgba(0, 123, 167, 0.15);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <span style="display: inline-block; padding: 4px 10px; border: 1px solid rgba(0, 123, 167, 0.6); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #007BA7; font-family: monospace;">
                MAISON CREAD SECURITY • SENDMAIL GATEWAY
              </span>
              <h1 style="margin: 16px 0 6px 0; font-size: 22px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">
                {title}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #888888; line-height: 1.5;">
                Dispatched directly via Sendmail protocol for recipient: <strong style="color: #EEEEEE;">{recipient}</strong>
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 36px; text-align: center;">
              <p style="margin: 0 0 16px 0; font-size: 13px; color: #CCCCCC; line-height: 1.6;">
                Use the following one-time cryptographic code to authenticate your request:
              </p>
              <div style="background: #020202; border: 1px solid #007BA7; border-radius: 14px; padding: 22px 16px; margin: 20px 0; box-shadow: 0 0 25px rgba(0, 123, 167, 0.25);">
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #007BA7; text-shadow: 0 0 12px rgba(0, 123, 167, 0.5); display: inline-block; padding-left: 12px;">
                  {otp}
                </span>
              </div>
              <div style="background: rgba(255, 0, 127, 0.08); border: 1px solid rgba(255, 0, 127, 0.25); border-radius: 10px; padding: 12px 16px; margin-top: 20px; text-align: left;">
                <p style="margin: 0; font-size: 11.5px; color: #FFAFD5; line-height: 1.5;">
                  <strong>Security Guarantee:</strong> Valid for <strong>10 minutes</strong>. Never share this code. Maison Cread will never ask for your code.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #060B0E; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #666666;">
                ShopCread Luxury Commerce OS • Forensic Custody Protocol
              </p>
              <p style="margin: 0; font-size: 10px; color: #444444; font-family: monospace;">
                Timestamp: {formatdate(localtime=True)} • Sendmail Dispatch
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text = f"""MAISON CREAD SECURITY NOTICE
===================================
{title}: {otp}
Recipient: {recipient}
Validity: 10 Minutes

Your authorization code is: {otp}

ShopCread Luxury Commerce OS • Sendmail Protocol
"""

    return dispatch_email(
        recipient=recipient,
        subject=subject,
        text_body=text,
        html_body=html,
        email_type="otp",
        token=otp,
        metadata={"purpose": purpose}
    )


# ============================================================================
# 2. OFFERS & VIP DEALS TEMPLATES & DISPATCHER
# ============================================================================

def send_offer_email(
    recipient: str,
    offer_title: str,
    discount_percent: int,
    coupon_code: str,
    description: str,
    expiry_date: Optional[str] = "Within 7 Days",
    free_shipping: bool = True
) -> Dict[str, Any]:
    """Dispatches a VIP promotional offer or voucher to a customer email."""
    subject = f"Exclusive Privilege: {discount_percent}% Off with Code {coupon_code}"

    shipping_perk = "• Complimentary White-Glove Shipping Included" if free_shipping else ""

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{offer_title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030303; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030303; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background: #0D1117; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 0 50px rgba(212, 175, 55, 0.15);">
          <!-- Top Accent Banner -->
          <tr>
            <td style="background: linear-gradient(90deg, #D4AF37 0%, #FFDF73 50%, #B38F24 100%); height: 6px;"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <span style="display: inline-block; padding: 4px 10px; border: 1px solid rgba(212, 175, 55, 0.6); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #D4AF37; font-family: monospace;">
                MAISON CREAD PRIVILEGE DROP
              </span>
              <h1 style="margin: 16px 0 6px 0; font-size: 24px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                {offer_title}
              </h1>
              <p style="margin: 0; font-size: 13px; color: #A0A0A0; line-height: 1.5;">
                Curated especially for client <strong style="color: #FFFFFF;">{recipient}</strong>
              </p>
            </td>
          </tr>
          <!-- Main Offer Voucher -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 20px 0; font-size: 14px; color: #DDDDDD; line-height: 1.6;">
                {description}
              </p>
              
              <!-- Luxury Discount Badge -->
              <div style="background: linear-gradient(135deg, rgba(212, 175, 55, 0.12) 0%, rgba(13, 17, 23, 0.9) 100%); border: 1px solid #D4AF37; border-radius: 16px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: #D4AF37; margin-bottom: 6px;">
                  APPLY AT CHECKOUT
                </div>
                <div style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #FFDF73; margin-bottom: 8px;">
                  {coupon_code}
                </div>
                <div style="font-size: 15px; font-weight: 600; color: #FFFFFF;">
                  Instant {discount_percent}% Privilege Reduction
                </div>
                <div style="font-size: 11px; color: #888888; margin-top: 6px;">
                  Valid: {expiry_date} {shipping_perk}
                </div>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin-top: 10px;">
                <a href="http://localhost:5173" style="display: inline-block; background: #D4AF37; color: #000000; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 14px 32px; border-radius: 100px; box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);">
                  Unlock Collection
                </a>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #080A0E; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #666666;">
                Maison Cread • Haute Horlogerie, Fine Jewelry & Curated Heritage
              </p>
              <p style="margin: 0; font-size: 10px; color: #444444; font-family: monospace;">
                Sendmail Protocol Dispatched • Code: {coupon_code}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text = f"""MAISON CREAD PRIVILEGE OFFER
=======================================
Offer: {offer_title}
Coupon Code: {coupon_code}
Benefit: {discount_percent}% Off {shipping_perk}
Description: {description}
Expires: {expiry_date}

Shop now at: http://localhost:5173
Apply code '{coupon_code}' during checkout.
"""

    return dispatch_email(
        recipient=recipient,
        subject=subject,
        text_body=text,
        html_body=html,
        email_type="offer",
        token=coupon_code,
        metadata={"discountPercent": discount_percent, "couponCode": coupon_code}
    )


# ============================================================================
# 3. ORDER TRACKING & CONFIRMATION TEMPLATES & DISPATCHER
# ============================================================================

def send_order_tracking_email(
    recipient: str,
    order_id: str,
    stage: str,
    items: List[Dict[str, Any]],
    summary: Dict[str, Any],
    shipping_address: str,
    assigned_shop_name: Optional[str] = None,
    est_delivery: Optional[str] = None,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Dispatches rich Order Confirmation and real-time courier tracking telemetry
    to customer email via Sendmail.
    """
    stage_titles = {
        "placed": "Order Placed & In Queue",
        "confirmed_by_shop": "Confirmed by Atelier Partner",
        "vault_inspected": "Inspected & Vault Authenticated",
        "dispatched": "Courier Dispatched with Insurance",
        "out_for_delivery": "Out for Hand Delivery",
        "delivered": "Successfully Delivered & Signed"
    }
    stage_title = stage_titles.get(stage, f"Status: {stage.capitalize()}")
    subject = f"Maison Cread Order #{order_id} • {stage_title}"

    total_amount = summary.get("total") or summary.get("finalTotal") or 0.0
    subtotal = summary.get("subtotal") or 0.0
    discount = summary.get("discount") or 0.0
    shipping_fee = summary.get("shipping") or summary.get("shippingFee") or 0.0
    donation = summary.get("donation")

    # Build items rows
    items_html = ""
    for item in (items or [])[:6]:
        title = item.get("title", "Luxury Item")
        price = item.get("price", 0)
        qty = item.get("quantity", 1)
        items_html += f"""
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; color: #FFFFFF;">
            <strong>{title}</strong> <span style="color: #888888; font-size: 11px;">x{qty}</span>
          </td>
          <td align="right" style="padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05); font-size: 13px; font-weight: 600; color: #00F0FF; font-family: monospace;">
            ₹{float(price) * int(qty):,.2f}
          </td>
        </tr>
        """

    # Timeline progress indicator
    stages = ["placed", "confirmed_by_shop", "vault_inspected", "dispatched", "out_for_delivery", "delivered"]
    current_idx = stages.index(stage) if stage in stages else 1
    progress_pct = int(((current_idx + 1) / len(stages)) * 100)

    taxable_val = max(0.0, float(subtotal) - float(discount or 0))
    cgst_val = round(taxable_val * 0.09, 2)
    sgst_val = round(taxable_val * 0.09, 2)
    gst_val = round(cgst_val + sgst_val, 2)

    tracking_url = f"http://localhost:5173/?track={order_id}"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Tracking #{order_id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020202; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020202; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background: #0A1218; border: 1px solid rgba(0, 240, 255, 0.35); border-radius: 20px; overflow: hidden; box-shadow: 0 0 50px rgba(0, 240, 255, 0.1);">
          <!-- Top Neon Line -->
          <tr>
            <td style="background: linear-gradient(90deg, #007BA7 0%, #00F0FF 50%, #10B981 100%); height: 5px;"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="display: inline-block; padding: 4px 10px; border: 1px solid rgba(0, 240, 255, 0.6); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #00F0FF; font-family: monospace;">
                  LIVE CONCIERGE TRACKER
                </span>
              </div>
              <h1 style="margin: 16px 0 6px 0; font-size: 22px; font-weight: 800; color: #FFFFFF;">
                {stage_title}
              </h1>
              <p style="margin: 0; font-size: 12px; color: #888888; font-family: monospace;">
                Unique Order ID: <strong style="color: #00F0FF;">#{order_id}</strong>
              </p>
            </td>
          </tr>
          <!-- Progress Bar -->
          <tr>
            <td style="padding: 24px 36px 12px 36px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #AAAAAA; margin-bottom: 8px;">
                <span>Dispatched Progress</span>
                <span style="color: #00F0FF;">{progress_pct}%</span>
              </div>
              <div style="background: #020202; border-radius: 100px; height: 8px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.1);">
                <div style="background: linear-gradient(90deg, #007BA7, #00F0FF); width: {progress_pct}%; height: 100%; border-radius: 100px;"></div>
              </div>
            </td>
          </tr>
          <!-- Atelier & Address Telemetry -->
          <tr>
            <td style="padding: 12px 36px;">
              <table role="presentation" width="100%" style="background: #050B0E; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 11px; color: #888888; padding-bottom: 4px;">Fulfillment Partner:</td>
                  <td align="right" style="font-size: 12px; font-weight: 700; color: #FFFFFF;">{assigned_shop_name or "Maison Central Atelier"}</td>
                </tr>
                <tr>
                  <td style="font-size: 11px; color: #888888; padding-bottom: 4px;">Destination Address:</td>
                  <td align="right" style="font-size: 11px; color: #CCCCCC; max-width: 250px;">{shipping_address}</td>
                </tr>
                <tr>
                  <td style="font-size: 11px; color: #888888;">Estimated Arrival:</td>
                  <td align="right" style="font-size: 12px; font-weight: 700; color: #10B981;">{est_delivery or "2-3 business days"}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Item Breakdown -->
          <tr>
            <td style="padding: 18px 36px;">
              <h3 style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #888888;">
                Acquisition Manifest
              </h3>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                {items_html}
              </table>
              <table role="presentation" width="100%" style="margin-top: 14px;">
                <tr>
                  <td style="font-size: 12px; color: #888888;">Taxable Amount:</td>
                  <td align="right" style="font-size: 12px; color: #DDDDDD; font-family: monospace;">₹{taxable_val:,.2f}</td>
                </tr>
                {f'<tr><td style="font-size: 12px; color: #10B981;">Privilege Discount:</td><td align="right" style="font-size: 12px; color: #10B981; font-family: monospace;">-₹{float(discount):,.2f}</td></tr>' if discount else ''}
                <tr>
                  <td style="font-size: 12px; color: #888888;">CGST (Central GST 9%):</td>
                  <td align="right" style="font-size: 12px; color: #DDDDDD; font-family: monospace;">₹{cgst_val:,.2f}</td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #888888;">SGST (State GST 9%):</td>
                  <td align="right" style="font-size: 12px; color: #DDDDDD; font-family: monospace;">₹{sgst_val:,.2f}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; font-weight: 700; color: #FFFFFF; padding-top: 8px;">Total Due (Tax Invoice):</td>
                  <td align="right" style="font-size: 16px; font-weight: 800; color: #00F0FF; font-family: monospace; padding-top: 8px;">₹{float(total_amount):,.2f}</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Tracking Action CTA -->
          <tr>
            <td style="padding: 10px 36px 30px 36px; text-align: center;">
              <a href="{tracking_url}" style="display: inline-block; background: #00F0FF; color: #020202; font-size: 12px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; text-decoration: none; padding: 14px 28px; border-radius: 100px; box-shadow: 0 0 25px rgba(0, 240, 255, 0.4);">
                Track Live Shipment
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #04080B; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #666666;">
                Maison Cread Secured Logistics Escrow
              </p>
              <p style="margin: 0; font-size: 10px; color: #444444; font-family: monospace;">
                Dispatched via Sendmail Protocol • Order #{order_id}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text = f"""MAISON CREAD ORDER TRACKING
====================================
Order ID: #{order_id}
Stage: {stage_title}
Destination: {shipping_address}
Partner Atelier: {assigned_shop_name or "Maison Central Atelier"}
Estimated Delivery: {est_delivery or "2-3 business days"}
Total Amount: ₹{float(total_amount):,.2f}

Track your package live: {tracking_url}
"""

    return dispatch_email(
        recipient=recipient,
        subject=subject,
        text_body=text,
        html_body=html,
        email_type="order_tracking",
        token=order_id,
        metadata={
            "orderId": order_id,
            "stage": stage,
            "total": total_amount,
            "assignedShop": assigned_shop_name
        }
    )


# ============================================================================
# 4. IMPORTANT SECURITY & ACCOUNT NOTICES
# ============================================================================

def send_security_alert_email(
    recipient: str,
    alert_title: str,
    alert_message: str,
    action_url: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    """Dispatches a critical account security notification via Sendmail."""
    subject = f"Maison Cread Security Alert • {alert_title}"

    html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{alert_title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #020202; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #FFFFFF;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #020202; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background: #120A0E; border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 20px; overflow: hidden; box-shadow: 0 0 40px rgba(239, 68, 68, 0.15);">
          <!-- Top Warning Banner -->
          <tr>
            <td style="background: #EF4444; height: 5px;"></td>
          </tr>
          <!-- Header -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <span style="display: inline-block; padding: 4px 10px; border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 100px; font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #EF4444; font-family: monospace;">
                ACCOUNT SECURITY TELEMETRY
              </span>
              <h1 style="margin: 16px 0 6px 0; font-size: 22px; font-weight: 700; color: #FFFFFF;">
                {alert_title}
              </h1>
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Notice for account: <strong style="color: #FFFFFF;">{recipient}</strong>
              </p>
            </td>
          </tr>
          <!-- Message Body -->
          <tr>
            <td style="padding: 28px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 13.5px; color: #E0E0E0; line-height: 1.6;">
                {alert_message}
              </p>
              {f'<div style="background: rgba(0,0,0,0.5); padding: 10px 14px; border-radius: 8px; font-size: 11px; color: #AAAAAA; font-family: monospace; margin-bottom: 18px;">IP Origin: {ip_address} • Timestamp: {formatdate(localtime=True)}</div>' if ip_address else ''}
              <div style="background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 10px; padding: 14px 16px;">
                <p style="margin: 0; font-size: 12px; color: #FCA5A5; line-height: 1.5;">
                  If this action was initiated by you, no further steps are needed. If you did not perform this action, please secure your account immediately.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #0A0507; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #666666; font-family: monospace;">
                Maison Cread Forensic Security Protocol • Sendmail Gateway
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    text = f"""MAISON CREAD SECURITY ALERT
=============================
Alert: {alert_title}
Recipient: {recipient}
Details: {alert_message}
Timestamp: {formatdate(localtime=True)}

If you did not authorize this action, please reset your password immediately.
"""

    return dispatch_email(
        recipient=recipient,
        subject=subject,
        text_body=text,
        html_body=html,
        email_type="security",
        token=alert_title,
        metadata={"alert": alert_title}
    )
