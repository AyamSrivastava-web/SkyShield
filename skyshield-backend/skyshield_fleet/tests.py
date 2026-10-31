from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from .models import Aircraft, ComplianceItem, Incident

User = get_user_model()


class SkyShieldFleetAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="safetyops@skyshield.com",
            email="safetyops@skyshield.com",
            password="SafetyPassword123!",
            first_name="Safety",
            last_name="Manager",
        )
        self.token = str(AccessToken.for_user(self.user))

        self.aircraft = Aircraft.objects.create(
            code="A320",
            name="Airbus A320-200",
            aircraft_type="Narrow-body",
            fleet="24 active",
            reports=5,
            trend="−18%",
            trend_tone="good",
            status="Nominal",
            color="#7dd3fc",
        )
        self.incident = Incident.objects.create(
            incident_id="INC-9999",
            aircraft="A320-200",
            title="Hydraulic indicator flickered",
            location="BOM Gate 2",
            severity="Low",
            status="Investigating",
            progress=20,
            category="Systems",
        )
        self.compliance = ComplianceItem.objects.create(
            name="SMS Audit",
            code="ICAO ANNEX 19",
            owner="Safety office",
            due="10 Oct 2026",
            progress=50,
            status="On track",
        )

    def test_list_aircraft(self):
        """Unauthenticated GET /api/aircraft/ returns 200 list"""
        response = self.client.get("/api/aircraft/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["code"], "A320")

    def test_create_aircraft_unauthenticated_fails(self):
        """Unauthenticated POST /api/aircraft/ returns 401"""
        payload = {"code": "B777", "name": "Boeing 777-300ER"}
        response = self.client.post("/api/aircraft/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_update_aircraft_authenticated(self):
        """Authenticated POST and PATCH /api/aircraft/ succeeds"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        payload = {
            "code": "B777",
            "name": "Boeing 777-300ER",
            "aircraft_type": "Wide-body",
            "fleet": "10 active",
            "status": "Nominal",
        }
        res_create = self.client.post("/api/aircraft/", payload, format="json")
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_create.data["code"], "B777")

        # PATCH update
        res_patch = self.client.patch("/api/aircraft/B777/", {"status": "Maintenance"}, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["status"], "Maintenance")

        # DELETE
        res_del = self.client.delete("/api/aircraft/B777/")
        self.assertEqual(res_del.status_code, status.HTTP_204_NO_CONTENT)

    def test_list_incidents(self):
        """Unauthenticated GET /api/incidents/ returns 200 list"""
        response = self.client.get("/api/incidents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Hydraulic indicator flickered")

    def test_create_incident_unauthenticated_fails(self):
        """Unauthenticated POST /api/incidents/ returns 401"""
        payload = {
            "aircraft": "A320",
            "title": "Unauthenticated incident report",
            "location": "DEL RWY 28",
            "severity": "Medium",
        }
        response = self.client.post("/api/incidents/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_and_update_incident_authenticated(self):
        """Authenticated POST and PATCH /api/incidents/ succeeds"""
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        payload = {
            "aircraft": "A320",
            "title": "Cabin pressure alert",
            "location": "DEL RWY 28",
            "severity": "Medium",
            "category": "Systems",
            "reporter": "First Officer",
        }
        response = self.client.post("/api/incidents/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created_id = response.data["id"]
        self.assertTrue(created_id.startswith("INC-"))
        self.assertEqual(response.data["title"], "Cabin pressure alert")

        # Verify aircraft reports count was incremented
        self.aircraft.refresh_from_db()
        self.assertEqual(self.aircraft.reports, 6)

        # Retrieve detail
        res_detail = self.client.get(f"/api/incidents/{created_id}/")
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data["title"], "Cabin pressure alert")

        # Update status
        res_update = self.client.patch(f"/api/incidents/{created_id}/", {"status": "Closed"}, format="json")
        self.assertEqual(res_update.status_code, status.HTTP_200_OK)
        self.assertEqual(res_update.data["status"], "Closed")

    def test_list_and_create_compliance(self):
        """GET /api/compliance/ returns 200, authenticated POST succeeds"""
        response = self.client.get("/api/compliance/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")
        res_post = self.client.post(
            "/api/compliance/",
            {
                "name": "DGCA Fuel Safety Review",
                "code": "DGCA CAR 7",
                "owner": "Line Maintenance",
                "due": "15 Nov 2026",
                "progress": 30,
                "status": "On track",
            },
            format="json",
        )
        self.assertEqual(res_post.status_code, status.HTTP_201_CREATED)

    def test_dashboard_stats(self):
        """GET /api/stats/ returns valid metrics structure"""
        response = self.client.get("/api/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("safety_index", response.data)
        self.assertIn("open_incidents", response.data)
        self.assertIn("total_incidents", response.data)
        self.assertIn("closed_incidents", response.data)
        self.assertIn("total_aircraft", response.data)

