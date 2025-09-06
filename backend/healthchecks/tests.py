from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from services.models import Service

from .models import HealthCheck


class HealthCheckModelTest(TestCase):
    """Test the HealthCheck model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service", service_type="http", created_by=self.user
        )

    def test_healthcheck_creation(self):
        """Test creating a health check with all enhanced fields"""
        healthcheck = HealthCheck.objects.create(
            service=self.service,
            status="success",
            response_time=150.5,
            message="Service is healthy",
            details={"status_code": 200, "response_size": 1024},
            error_code="",
            http_status=200,
            duration=0.15,
        )

        self.assertEqual(healthcheck.service, self.service)
        self.assertEqual(healthcheck.status, "success")
        self.assertEqual(healthcheck.response_time, 150.5)
        self.assertEqual(healthcheck.message, "Service is healthy")
        self.assertEqual(
            healthcheck.details, {"status_code": 200, "response_size": 1024}
        )
        self.assertEqual(healthcheck.error_code, "")
        self.assertEqual(healthcheck.http_status, 200)
        self.assertEqual(healthcheck.duration, 0.15)
        self.assertIsNotNone(healthcheck.checked_at)

    def test_healthcheck_default_values(self):
        """Test default values for health check fields"""
        healthcheck = HealthCheck.objects.create(service=self.service, status="failure")

        self.assertIsNone(healthcheck.response_time)
        self.assertEqual(healthcheck.message, "")
        self.assertEqual(healthcheck.details, {})
        self.assertEqual(healthcheck.error_code, "")
        self.assertIsNone(healthcheck.http_status)
        self.assertIsNone(healthcheck.duration)

    def test_healthcheck_status_choices(self):
        """Test all health check status choices"""
        status_choices = ["success", "failure", "timeout", "error", "skipped"]

        for status_choice in status_choices:
            healthcheck = HealthCheck.objects.create(
                service=self.service, status=status_choice
            )
            self.assertEqual(healthcheck.status, status_choice)

    def test_healthcheck_string_representation(self):
        """Test health check string representation"""
        healthcheck = HealthCheck.objects.create(service=self.service, status="success")
        expected_str = f"{self.service.name} - success ({healthcheck.checked_at})"
        self.assertEqual(str(healthcheck), expected_str)

    def test_healthcheck_ordering(self):
        """Test health check ordering by checked_at (most recent first)"""
        # Create health checks with different timestamps
        healthcheck1 = HealthCheck.objects.create(
            service=self.service, status="success"
        )

        # Wait a moment to ensure different timestamps
        import time

        time.sleep(0.01)

        healthcheck2 = HealthCheck.objects.create(
            service=self.service, status="failure"
        )

        healthchecks = HealthCheck.objects.all()
        self.assertEqual(healthchecks[0], healthcheck2)  # Most recent first
        self.assertEqual(healthchecks[1], healthcheck1)

    def test_healthcheck_service_relationship(self):
        """Test health check service relationship"""
        healthcheck = HealthCheck.objects.create(service=self.service, status="success")

        # Test forward relationship
        self.assertEqual(healthcheck.service, self.service)

        # Test reverse relationship
        self.assertIn(healthcheck, self.service.health_checks.all())


class HealthCheckAPITest(APITestCase):
    """Test the HealthCheck API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        self.service = Service.objects.create(
            name="API Test Service", service_type="http", created_by=self.user
        )

    def test_list_healthchecks(self):
        """Test listing health checks via API"""
        # Create test health checks
        HealthCheck.objects.create(
            service=self.service, status="success", response_time=100.0, http_status=200
        )
        HealthCheck.objects.create(
            service=self.service,
            status="failure",
            response_time=5000.0,
            http_status=500,
        )

        response = self.client.get("/api/v1/healthchecks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_retrieve_healthcheck(self):
        """Test retrieving a specific health check via API"""
        healthcheck = HealthCheck.objects.create(
            service=self.service,
            status="success",
            response_time=150.5,
            message="Service is healthy",
            details={"status_code": 200},
            error_code="",
            http_status=200,
            duration=0.15,
        )

        response = self.client.get(f"/api/v1/healthchecks/{healthcheck.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "success")
        self.assertEqual(response.data["response_time"], 150.5)
        self.assertEqual(response.data["http_status"], 200)
        self.assertEqual(response.data["duration"], 0.15)
        self.assertEqual(response.data["service_name"], self.service.name)

    def test_healthcheck_filtering_by_service(self):
        """Test filtering health checks by service"""
        other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="otherpass123"
        )
        other_service = Service.objects.create(
            name="Other Service", service_type="http", created_by=other_user
        )

        # Create health check for other service
        HealthCheck.objects.create(service=other_service, status="success")

        # Create health check for current user's service
        HealthCheck.objects.create(service=self.service, status="failure")

        response = self.client.get("/api/v1/healthchecks/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["status"], "failure")

    def test_healthcheck_read_only(self):
        """Test that health checks are read-only via API"""
        healthcheck = HealthCheck.objects.create(service=self.service, status="success")

        data = {"status": "failure", "message": "Updated message"}

        # Test PATCH (should not be allowed)
        response = self.client.patch(
            f"/api/v1/healthchecks/{healthcheck.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Test PUT (should not be allowed)
        response = self.client.put(
            f"/api/v1/healthchecks/{healthcheck.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Test DELETE (should not be allowed)
        response = self.client.delete(f"/api/v1/healthchecks/{healthcheck.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access health checks"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/healthchecks/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_healthcheck_with_error_details(self):
        """Test health check with error details"""
        healthcheck = HealthCheck.objects.create(
            service=self.service,
            status="error",
            response_time=None,
            message="Connection timeout",
            details={"error": "timeout", "retries": 3},
            error_code="TIMEOUT",
            http_status=None,
            duration=30.0,
        )

        response = self.client.get(f"/api/v1/healthchecks/{healthcheck.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "error")
        self.assertEqual(response.data["error_code"], "TIMEOUT")
        self.assertEqual(response.data["duration"], 30.0)
        self.assertEqual(response.data["details"], {"error": "timeout", "retries": 3})
