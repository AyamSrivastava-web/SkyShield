import time
from unittest.mock import patch
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

User = get_user_model()


class AccountsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_01_new_user_registration(self):
        """Scenario 1: New user registration"""
        payload = {
            "name": "Captain Sully",
            "email": "sully@skyshield.com",
            "password": "ValidPassword123!",
        }
        res = self.client.post("/api/auth/signup/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["email"], "sully@skyshield.com")
        self.assertEqual(res.data["user"]["name"], "Captain Sully")
        self.assertEqual(res.data["user"]["loginMethod"], "email")

        # Verify user persisted in database with hashed password
        user = User.objects.get(email="sully@skyshield.com")
        self.assertTrue(user.check_password("ValidPassword123!"))

    def test_02_duplicate_email_registration(self):
        """Scenario 2: Duplicate email registration returns 409 Conflict"""
        User.objects.create_user(
            username="existing@skyshield.com",
            email="existing@skyshield.com",
            password="Password123!",
            first_name="Existing User",
        )
        payload = {
            "name": "Duplicate User",
            "email": "existing@skyshield.com",
            "password": "Password123!",
        }
        res = self.client.post("/api/auth/signup/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertIn("detail", res.data)

    def test_03_correct_email_password_login(self):
        """Scenario 3: Correct email/password login returns 200 and access token"""
        User.objects.create_user(
            username="pilot@skyshield.com",
            email="pilot@skyshield.com",
            password="PilotPassword123!",
            first_name="First Officer",
        )
        payload = {
            "email": "pilot@skyshield.com",
            "password": "PilotPassword123!",
        }
        res = self.client.post("/api/auth/login/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)
        self.assertEqual(res.data["user"]["name"], "First Officer")

    def test_04_incorrect_password(self):
        """Scenario 4: Incorrect password returns 401 Unauthorized"""
        User.objects.create_user(
            username="pilot@skyshield.com",
            email="pilot@skyshield.com",
            password="PilotPassword123!",
        )
        payload = {
            "email": "pilot@skyshield.com",
            "password": "WrongPassword!",
        }
        res = self.client.post("/api/auth/login/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", res.data)

    @patch("accounts.views.id_token.verify_oauth2_token")
    def test_05_google_signin_valid_credential(self, mock_verify):
        """Scenario 5: Google sign-in with a valid verified credential creates/logs in user"""
        mock_client_id = settings.GOOGLE_CLIENT_ID or "test-google-client-id"
        with self.settings(GOOGLE_CLIENT_ID=mock_client_id):
            mock_verify.return_value = {
                "aud": mock_client_id,
                "email": "googlepilot@skyshield.com",
                "email_verified": True,
                "name": "Google Aviator",
            }
            res = self.client.post("/api/auth/google/", {"credential": "mock_valid_jwt_token"}, format="json")
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertIn("access", res.data)
            self.assertEqual(res.data["user"]["email"], "googlepilot@skyshield.com")
            self.assertEqual(res.data["user"]["name"], "Google Aviator")
            self.assertEqual(res.data["user"]["loginMethod"], "google")

            # Check that user is created in database with unusable password
            user = User.objects.get(email="googlepilot@skyshield.com")
            self.assertFalse(user.has_usable_password())

    def test_06_google_signin_invalid_credential(self):
        """Scenario 6: Google sign-in with invalid credential returns 401"""
        mock_client_id = settings.GOOGLE_CLIENT_ID or "test-google-client-id"
        with self.settings(GOOGLE_CLIENT_ID=mock_client_id):
            res = self.client.post("/api/auth/google/", {"credential": "invalid_token_string"}, format="json")
            self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_07_access_protected_api_without_token(self):
        """Scenario 7: Access protected /api/auth/me/ without token returns 401"""
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_08_access_protected_api_with_valid_token(self):
        """Scenario 8: Access protected API with valid token returns user profile"""
        user = User.objects.create_user(
            username="dispatcher@skyshield.com",
            email="dispatcher@skyshield.com",
            password="Password123!",
            first_name="Lead",
            last_name="Dispatcher",
        )
        token = str(AccessToken.for_user(user))
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["email"], "dispatcher@skyshield.com")
        self.assertEqual(res.data["user"]["name"], "Lead Dispatcher")

    def test_09_expired_token(self):
        """Scenario 9: Expired token returns 401 Unauthorized"""
        user = User.objects.create_user(
            username="expired@skyshield.com",
            email="expired@skyshield.com",
            password="Password123!",
        )
        token = AccessToken.for_user(user)
        # Manually force expiration in the past
        token.set_exp(lifetime=-timedelta(seconds=10))
        expired_token_str = str(token)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {expired_token_str}")
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_10_logout(self):
        """Scenario 10: Logout API returns 200 OK"""
        res = self.client.post("/api/auth/logout/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("detail", res.data)

