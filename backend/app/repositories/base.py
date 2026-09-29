import sqlite3
import os
import json
import datetime
from typing import Optional, List, Dict, Any

import contextlib

DB_PATH = os.path.join(os.path.dirname(__file__), "ecommerce.db")

@contextlib.contextmanager
def get_db_connection():
    """Create a thread-safe connection to the SQLite database with automatic closing."""
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initialize database schema with parameterized constraints."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                full_name TEXT NOT NULL,
                address TEXT DEFAULT '',
                avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                is_verified INTEGER DEFAULT 0,
                verification_token TEXT,
                verification_token_expires_at TEXT,
                reset_token TEXT,
                reset_token_expires_at TEXT,
                two_factor_secret TEXT,
                two_factor_enabled INTEGER DEFAULT 0,
                two_factor_backup_codes TEXT,
                failed_login_attempts INTEGER DEFAULT 0,
                lockout_until TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
        """)

        # 2. Refresh Tokens table (for secure token rotation and revocation)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT UNIQUE NOT NULL,
                expires_at TEXT NOT NULL,
                revoked INTEGER DEFAULT 0,
                user_agent TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        """)

        # 3. Login Attempts table (for IP rate limiting and auditing)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT NOT NULL,
                email TEXT NOT NULL COLLATE NOCASE,
                success INTEGER NOT NULL,
                attempt_time TEXT NOT NULL
            );
        """)

        # 4. Mock/Simulated Emails table (for development & testing without live SMTP)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS mock_emails (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                email_type TEXT NOT NULL, -- 'verification' | 'password_reset'
                token TEXT NOT NULL,
                body TEXT NOT NULL,
                created_at TEXT NOT NULL
            );
        """)

        # 5. Orders table (associating orders with users)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                order_date TEXT NOT NULL,
                items_json TEXT NOT NULL,
                shipping_json TEXT NOT NULL,
                payment_json TEXT NOT NULL,
                summary_json TEXT NOT NULL,
                status TEXT NOT NULL,
                estimated_delivery TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );
        """)

        # Indexes for fast lookup & security checks
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_verification ON users(verification_token);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, attempt_time);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);")

        conn.commit()


# --- Parameterized User Queries (100% SQL Injection Safe) ---

def create_user(
    email: str,
    password_hash: str,
    full_name: str,
    verification_token: str,
    verification_token_expires_at: str,
    address: str = ""
) -> int:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO users (
                email, password_hash, full_name, address,
                is_verified, verification_token, verification_token_expires_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?)
            """,
            (
                email.strip().lower(),
                password_hash,
                full_name.strip(),
                address.strip(),
                verification_token,
                verification_token_expires_at,
                now,
                now
            )
        )
        conn.commit()
        return cursor.lastrowid

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE email = ? LIMIT 1", (email.strip().lower(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ? LIMIT 1", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_verification_token(token: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE verification_token = ? LIMIT 1", (token.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def get_user_by_reset_token(token: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE reset_token = ? LIMIT 1", (token.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None

def verify_user_email(user_id: int):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET is_verified = 1, verification_token = NULL, verification_token_expires_at = NULL, updated_at = ?
            WHERE id = ?
            """,
            (now, user_id)
        )
        conn.commit()

def set_user_verification_token(user_id: int, token: str, expires_at: str):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET verification_token = ?, verification_token_expires_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (token, expires_at, now, user_id)
        )
        conn.commit()

def set_reset_token(user_id: int, token: str, expires_at: str):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET reset_token = ?, reset_token_expires_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (token, expires_at, now, user_id)
        )
        conn.commit()

def update_user_password(user_id: int, password_hash: str):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET password_hash = ?, reset_token = NULL, reset_token_expires_at = NULL,
                failed_login_attempts = 0, lockout_until = NULL, updated_at = ?
            WHERE id = ?
            """,
            (password_hash, now, user_id)
        )
        conn.commit()

def update_failed_attempts_and_lockout(user_id: int, failed_count: int, lockout_until: Optional[str]):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET failed_login_attempts = ?, lockout_until = ?, updated_at = ?
            WHERE id = ?
            """,
            (failed_count, lockout_until, now, user_id)
        )
        conn.commit()

def reset_failed_attempts(user_id: int):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET failed_login_attempts = 0, lockout_until = NULL, updated_at = ?
            WHERE id = ?
            """,
            (now, user_id)
        )
        conn.commit()

# --- 2FA Database Operations ---

def save_2fa_setup(user_id: int, secret: str, backup_codes: List[str]):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET two_factor_secret = ?, two_factor_backup_codes = ?, updated_at = ?
            WHERE id = ?
            """,
            (secret, json.dumps(backup_codes), now, user_id)
        )
        conn.commit()

def enable_2fa(user_id: int):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET two_factor_enabled = 1, updated_at = ?
            WHERE id = ?
            """,
            (now, user_id)
        )
        conn.commit()

def disable_2fa(user_id: int):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE users
            SET two_factor_enabled = 0, two_factor_secret = NULL, two_factor_backup_codes = NULL, updated_at = ?
            WHERE id = ?
            """,
            (now, user_id)
        )
        conn.commit()

def consume_backup_code(user_id: int, code: str) -> bool:
    user = get_user_by_id(user_id)
    if not user or not user.get("two_factor_backup_codes"):
        return False
    try:
        codes = json.loads(user["two_factor_backup_codes"])
    except Exception:
        return False
    
    clean_code = code.strip().upper()
    if clean_code in [c.upper() for c in codes]:
        remaining = [c for c in codes if c.upper() != clean_code]
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE users
                SET two_factor_backup_codes = ?, updated_at = ?
                WHERE id = ?
                """,
                (json.dumps(remaining), now, user_id)
            )
            conn.commit()
        return True
    return False


# --- Refresh Token Operations (Session Management & Rotation) ---

def store_refresh_token(user_id: int, token_hash: str, expires_at: str, user_agent: str = ""):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked, user_agent, created_at)
            VALUES (?, ?, ?, 0, ?, ?)
            """,
            (user_id, token_hash, expires_at, user_agent, now)
        )
        conn.commit()

def get_refresh_token(token_hash: str) -> Optional[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1",
            (token_hash,)
        )
        row = cursor.fetchone()
        return dict(row) if row else None

def revoke_refresh_token(token_hash: str):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?",
            (token_hash,)
        )
        conn.commit()

def revoke_all_user_refresh_tokens(user_id: int):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?",
            (user_id,)
        )
        conn.commit()


# --- Rate Limiting & Auditing Queries ---

def record_login_attempt(ip_address: str, email: str, success: bool):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO login_attempts (ip_address, email, success, attempt_time)
            VALUES (?, ?, ?, ?)
            """,
            (ip_address, email.strip().lower(), 1 if success else 0, now)
        )
        conn.commit()

def count_recent_failed_attempts(ip_address: str, minutes: int = 15) -> int:
    cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=minutes)).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT COUNT(*) FROM login_attempts
            WHERE ip_address = ? AND success = 0 AND attempt_time >= ?
            """,
            (ip_address, cutoff)
        )
        return cursor.fetchone()[0]


# --- Mock Emails (Dev Mailbox) ---

def save_mock_email(recipient: str, subject: str, email_type: str, token: str, body: str):
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO mock_emails (recipient, subject, email_type, token, body, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (recipient.strip().lower(), subject, email_type, token, body, now)
        )
        conn.commit()

def get_mock_emails(limit: int = 30) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT * FROM mock_emails
            ORDER BY id DESC LIMIT ?
            """,
            (limit,)
        )
        return [dict(r) for r in cursor.fetchall()]


# --- Orders Management ---

def create_order(order_dict: Dict[str, Any], user_id: Optional[int] = None) -> Dict[str, Any]:
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO orders (
                id, user_id, order_date, items_json, shipping_json, payment_json,
                summary_json, status, estimated_delivery, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                order_dict["id"],
                user_id,
                order_dict["date"],
                json.dumps(order_dict["items"]),
                json.dumps(order_dict["shippingInfo"]),
                json.dumps(order_dict["paymentInfo"]),
                json.dumps(order_dict["summary"]),
                order_dict["status"],
                order_dict["estimatedDelivery"],
                now
            )
        )
        conn.commit()
        return order_dict

def get_orders(user_id: Optional[int] = None) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,)
            )
        else:
            cursor.execute("SELECT * FROM orders ORDER BY created_at DESC")
        rows = cursor.fetchall()
        orders = []
        for r in rows:
            orders.append({
                "id": r["id"],
                "userId": r["user_id"],
                "date": r["order_date"],
                "items": json.loads(r["items_json"]),
                "shippingInfo": json.loads(r["shipping_json"]),
                "paymentInfo": json.loads(r["payment_json"]),
                "summary": json.loads(r["summary_json"]),
                "status": r["status"],
                "estimatedDelivery": r["estimated_delivery"]
            })
        return orders
