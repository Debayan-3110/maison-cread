import sys
import os
import unittest
import pyotp
from starlette.testclient import TestClient

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
from backend.database import init_db, get_db_connection

class SecureAuthTestSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Initialize DB
        init_db()
        cls.client = TestClient(app)

    def setUp(self):
        # Clear test users and tables for clean tests
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM orders;")
            cursor.execute("DELETE FROM mock_emails;")
            cursor.execute("DELETE FROM login_attempts;")
            cursor.execute("DELETE FROM refresh_tokens;")
            cursor.execute("DELETE FROM users;")
            conn.commit()

    def get_csrf_token_and_cookie(self):
        """Perform a request to obtain the CSRF cookie and token."""
        res = self.client.get("/api/csrf-token")
        csrf_token = res.json()["csrfToken"]
        csrf_cookie = self.client.cookies.get("shopcread_csrf") or csrf_token
        return csrf_cookie, csrf_token

    def test_01_security_headers_and_csrf(self):
        """Verify Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) and CSRF protection."""
        res = self.client.get("/api/health")
        self.assertEqual(res.status_code, 200)
        self.assertIn("Strict-Transport-Security", res.headers)
        self.assertEqual(res.headers["X-Frame-Options"], "DENY")
        self.assertEqual(res.headers["X-Content-Type-Options"], "nosniff")
        self.assertIn("Content-Security-Policy", res.headers)

        # Obtain CSRF token
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        self.assertIsNotNone(csrf_cookie)

        # Mutating request without CSRF token must fail (403)
        res_fail = self.client.post(
            "/api/auth/register",
            json={"email": "bad@test.com", "password": "Password123!", "fullName": "Bad CSRF"},
            cookies={"shopcread_csrf": csrf_cookie}
            # Missing header!
        )
        self.assertEqual(res_fail.status_code, 403)

    def test_02_registration_and_password_strength(self):
        """Verify password strength validation and bcrypt registration."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Weak password (too short)
        res = self.client.post(
            "/api/auth/register",
            json={"email": "alice@test.com", "password": "weak", "fullName": "Alice"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("at least 8 characters", res.json()["detail"])

        # Valid registration
        res = self.client.post(
            "/api/auth/register",
            json={"email": "alice@test.com", "password": "StrongPassword123!", "fullName": "Alice Smith"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.json()["success"])
        token = res.json()["verificationToken"]
        self.assertIsNotNone(token)

        # Check mock email was recorded
        res_emails = self.client.get("/api/auth/dev-emails")
        emails = res_emails.json()
        self.assertTrue(any(e["recipient"] == "alice@test.com" and e["email_type"] == "verification" for e in emails))

    def test_03_email_verification(self):
        """Verify email verification token validation."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Register
        reg_res = self.client.post(
            "/api/auth/register",
            json={"email": "bob@test.com", "password": "StrongPassword123!", "fullName": "Bob"},
            headers=headers, cookies=cookies
        )
        token = reg_res.json()["verificationToken"]

        # Invalid token
        res_invalid = self.client.post(
            "/api/auth/verify-email",
            json={"token": "invalid-token-123"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_invalid.status_code, 400)

        # Valid token
        res_valid = self.client.post(
            "/api/auth/verify-email",
            json={"token": token},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_valid.status_code, 200)
        self.assertTrue(res_valid.json()["success"])

    def test_04_rate_limiting_and_account_lockout(self):
        """Verify 5 failed attempts trigger account lockout."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Register target user
        self.client.post(
            "/api/auth/register",
            json={"email": "lockme@test.com", "password": "CorrectPassword123!", "fullName": "Lock Me"},
            headers=headers, cookies=cookies
        )

        # 4 consecutive bad attempts -> 401 with warning
        for i in range(1, 5):
            res = self.client.post(
                "/api/auth/login",
                json={"email": "lockme@test.com", "password": "WrongPassword!"},
                headers=headers, cookies=cookies
            )
            self.assertEqual(res.status_code, 401)
            self.assertIn("remaining before account lockout", res.json()["detail"])

        # 5th bad attempt -> 403 Account Locked
        res_5th = self.client.post(
            "/api/auth/login",
            json={"email": "lockme@test.com", "password": "WrongPassword!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_5th.status_code, 403)
        self.assertIn("Account locked: 5 failed attempts reached", res_5th.json()["detail"])

        # Even with correct password, account remains locked
        res_locked = self.client.post(
            "/api/auth/login",
            json={"email": "lockme@test.com", "password": "CorrectPassword123!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_locked.status_code, 403)
        self.assertIn("temporarily locked", res_locked.json()["detail"])

    def test_05_login_session_and_token_rotation(self):
        """Verify JWT session issuance and refresh token rotation."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Register user
        self.client.post(
            "/api/auth/register",
            json={"email": "carol@test.com", "password": "CorrectPassword123!", "fullName": "Carol"},
            headers=headers, cookies=cookies
        )

        # Successful login
        res_login = self.client.post(
            "/api/auth/login",
            json={"email": "carol@test.com", "password": "CorrectPassword123!", "rememberMe": True},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_login.status_code, 200)
        data = res_login.json()
        access_token = data["accessToken"]
        refresh_token = data["refreshToken"]
        self.assertIsNotNone(access_token)
        self.assertIsNotNone(refresh_token)

        # Access protected /api/auth/me
        res_me = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        self.assertEqual(res_me.status_code, 200)
        self.assertEqual(res_me.json()["user"]["email"], "carol@test.com")

        # Refresh token rotation: exchange old refresh token for a new pair
        res_refresh = self.client.post(
            "/api/auth/refresh",
            json={"refreshToken": refresh_token},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_refresh.status_code, 200)
        new_refresh_token = res_refresh.json()["refreshToken"]
        self.assertNotEqual(refresh_token, new_refresh_token)

        # Token Reuse Attack Detection: Presenting the OLD refresh token again must fail and revoke sessions!
        res_reuse = self.client.post(
            "/api/auth/refresh",
            json={"refreshToken": refresh_token},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_reuse.status_code, 401)
        self.assertIn("Security breach detected", res_reuse.json()["detail"])

    def test_06_sql_injection_prevention(self):
        """Verify SQL injection payloads are safely sanitized and parameterized."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Attempt SQL injection in email field
        sql_injection_payload = "' OR 1=1; --"
        res = self.client.post(
            "/api/auth/login",
            json={"email": sql_injection_payload, "password": "any"},
            headers=headers, cookies=cookies
        )
        # Should cleanly return 401 Invalid email or password, NOT a 500 database syntax error
        self.assertEqual(res.status_code, 401)

    def test_07_totp_two_factor_authentication(self):
        """Verify 2FA setup, TOTP verification, and 2FA login challenge."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Register and login Carol
        self.client.post(
            "/api/auth/register",
            json={"email": "dave@test.com", "password": "StrongPassword123!", "fullName": "Dave"},
            headers=headers, cookies=cookies
        )
        res_login = self.client.post(
            "/api/auth/login",
            json={"email": "dave@test.com", "password": "StrongPassword123!"},
            headers=headers, cookies=cookies
        )
        token = res_login.json()["accessToken"]

        # Step 1: Initiate 2FA Setup
        res_setup = self.client.post(
            "/api/auth/2fa/setup",
            headers={"Authorization": f"Bearer {token}", "X-CSRF-Token": csrf_header},
            cookies=cookies
        )
        self.assertEqual(res_setup.status_code, 200)
        secret = res_setup.json()["secret"]
        qr_code = res_setup.json()["qrCode"]
        backup_codes = res_setup.json()["backupCodes"]
        self.assertTrue(qr_code.startswith("data:image/png;base64,"))
        self.assertEqual(len(backup_codes), 8)

        # Generate valid TOTP code
        totp = pyotp.TOTP(secret)
        current_code = totp.now()

        # Step 2: Confirm & Enable 2FA
        res_enable = self.client.post(
            "/api/auth/2fa/enable",
            json={"code": current_code},
            headers={"Authorization": f"Bearer {token}", "X-CSRF-Token": csrf_header},
            cookies=cookies
        )
        self.assertEqual(res_enable.status_code, 200)
        self.assertTrue(res_enable.json()["success"])

        # Step 3: Now login again -> Must require 2FA
        res_login_2 = self.client.post(
            "/api/auth/login",
            json={"email": "dave@test.com", "password": "StrongPassword123!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_login_2.status_code, 200)
        self.assertEqual(res_login_2.json()["status"], "2fa_required")
        temp_token = res_login_2.json()["tempToken"]

        # Step 4: Submit 2FA code
        res_2fa_submit = self.client.post(
            "/api/auth/login-2fa",
            json={"tempToken": temp_token, "code": totp.now()},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_2fa_submit.status_code, 200)
        self.assertEqual(res_2fa_submit.json()["status"], "authenticated")
        self.assertIsNotNone(res_2fa_submit.json()["accessToken"])

    def test_08_password_reset_flow(self):
        """Verify password reset token generation, validation, and session revocation."""
        csrf_cookie, csrf_header = self.get_csrf_token_and_cookie()
        headers = {"X-CSRF-Token": csrf_header}
        cookies = {"shopcread_csrf": csrf_cookie}

        # Register user
        self.client.post(
            "/api/auth/register",
            json={"email": "emma@test.com", "password": "OldPassword123!", "fullName": "Emma"},
            headers=headers, cookies=cookies
        )

        # Request password reset
        res_forgot = self.client.post(
            "/api/auth/forgot-password",
            json={"email": "emma@test.com"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_forgot.status_code, 200)
        reset_token = res_forgot.json()["resetToken"]

        # Reset password with invalid strength -> fail
        res_weak = self.client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "newPassword": "short"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_weak.status_code, 400)

        # Reset password with strong new password -> success
        res_reset = self.client.post(
            "/api/auth/reset-password",
            json={"token": reset_token, "newPassword": "NewStrongPassword123!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_reset.status_code, 200)

        # Old password no longer works
        res_old = self.client.post(
            "/api/auth/login",
            json={"email": "emma@test.com", "password": "OldPassword123!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_old.status_code, 401)

        # New password works!
        res_new = self.client.post(
            "/api/auth/login",
            json={"email": "emma@test.com", "password": "NewStrongPassword123!"},
            headers=headers, cookies=cookies
        )
        self.assertEqual(res_new.status_code, 200)
        self.assertEqual(res_new.json()["status"], "authenticated")

if __name__ == "__main__":
    unittest.main()
