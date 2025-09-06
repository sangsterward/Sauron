import json
import time
from unittest.mock import Mock
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from services.models import Service


class MonitoringAPITest(APITestCase):
    """Test the monitoring API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_docker_status_endpoint(self):
        """Test Docker status endpoint"""
        response = self.client.get("/api/v1/monitoring/docker_status/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("docker_available", response.data)
        self.assertIn("message", response.data)

    def test_docker_status_unauthorized(self):
        """Test Docker status endpoint requires authentication"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/monitoring/docker_status/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("services.docker_service.docker_service")
    def test_docker_status_with_mock(self, mock_docker_service):
        """Test Docker status with mocked Docker service"""
        mock_docker_service.is_available.return_value = True

        response = self.client.get("/api/v1/monitoring/docker_status/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["docker_available"])
        self.assertEqual(response.data["message"], "Docker integration ready")

    def test_trigger_check_endpoint(self):
        """Test trigger health check endpoint"""
        data = {"service_id": self.service.id}

        response = self.client.post(
            "/api/v1/monitoring/trigger_check/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertIn("result", response.data)

    def test_trigger_check_invalid_service(self):
        """Test trigger check with invalid service ID"""
        data = {"service_id": 99999}  # Non-existent service

        response = self.client.post(
            "/api/v1/monitoring/trigger_check/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_trigger_check_missing_service_id(self):
        """Test trigger check without service_id"""
        response = self.client.post(
            "/api/v1/monitoring/trigger_check/", {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_trigger_check_unauthorized(self):
        """Test trigger check endpoint requires authentication"""
        self.client.credentials()  # Remove authentication

        data = {"service_id": self.service.id}
        response = self.client.post(
            "/api/v1/monitoring/trigger_check/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch("monitoring.views.event_broadcaster")
    def test_test_broadcast_endpoint(self, mock_broadcaster):
        """Test WebSocket broadcast test endpoint"""
        data = {"service_id": self.service.id}

        response = self.client.post(
            "/api/v1/monitoring/test_broadcast/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("status", response.data)
        self.assertIn("message", response.data)

    def test_test_broadcast_invalid_service(self):
        """Test broadcast with invalid service ID"""
        data = {"service_id": 99999}  # Non-existent service

        response = self.client.post(
            "/api/v1/monitoring/test_broadcast/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)

    def test_test_broadcast_missing_service_id(self):
        """Test broadcast without service_id"""
        response = self.client.post(
            "/api/v1/monitoring/test_broadcast/", {}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", response.data)

    def test_test_broadcast_unauthorized(self):
        """Test broadcast endpoint requires authentication"""
        self.client.credentials()  # Remove authentication

        data = {"service_id": self.service.id}
        response = self.client.post(
            "/api/v1/monitoring/test_broadcast/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class HealthCheckerTest(TestCase):
    """Test the health checker functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_health_checker_initialization(self):
        """Test health checker can be imported and initialized"""
        from monitoring.health_checker import health_checker

        self.assertIsNotNone(health_checker)

    def test_unknown_service_type(self):
        """Test health check for unknown service type"""
        from monitoring.health_checker import health_checker

        self.service.service_type = "unknown"

        result = health_checker.run_check(self.service)

        self.assertFalse(result["success"])
        self.assertIn("Unknown service type", result["error"])

    @patch("monitoring.health_checker.event_broadcaster")
    @patch("monitoring.health_checker.requests.request")
    def test_http_health_check_success(self, mock_request, mock_broadcaster):
        """Test successful HTTP health check"""
        from monitoring.health_checker import health_checker

        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.elapsed.total_seconds.return_value = 0.5
        mock_request.return_value = mock_response

        result = health_checker.run_check(self.service)

        self.assertTrue(result["success"])
        self.assertEqual(result["status_code"], 200)
        self.assertIn("response_time", result)

    @patch("monitoring.health_checker.event_broadcaster")
    @patch("monitoring.health_checker.requests.request")
    def test_http_health_check_failure(self, mock_request, mock_broadcaster):
        """Test failed HTTP health check"""
        from monitoring.health_checker import health_checker

        mock_request.side_effect = Exception("Connection failed")

        result = health_checker.run_check(self.service)

        self.assertFalse(result["success"])
        self.assertIn("error", result)
        self.assertIn("Connection failed", result["error"])
        self.assertIn("timestamp", result)


class DockerServiceTest(TestCase):
    """Test Docker service integration"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_docker_service_initialization(self):
        """Test Docker service initialization"""
        from services.docker_service import docker_service

        self.assertIsNotNone(docker_service)

    def test_docker_service_is_available(self):
        """Test Docker service availability check"""
        from services.docker_service import docker_service

        # Should return a boolean without raising exceptions
        result = docker_service.is_available()
        self.assertIsInstance(result, bool)

    @patch("services.docker_service.subprocess.run")
    def test_docker_service_fallback_to_subprocess(self, mock_run):
        """Test Docker service fallback to subprocess"""
        from services.docker_service import docker_service

        # Mock subprocess call
        mock_result = Mock()
        mock_result.returncode = 0
        mock_result.stdout = '[{"Id": "test-id", "Name": "/test-container", "State": {"Status": "running"}, "Config": {"Image": "test-image"}, "Created": "2023-01-01T00:00:00Z", "NetworkSettings": {"Ports": {}}, "RestartCount": 0}]'
        mock_run.return_value = mock_result

        # Test that subprocess fallback works
        result = docker_service.get_container_info("test-container")
        self.assertIsNotNone(result)
        self.assertEqual(result["status"], "running")


class WebSocketConsumerTest(TestCase):
    """Test WebSocket consumer functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_service_consumer_initialization(self):
        """Test ServiceConsumer can be imported and initialized"""
        from monitoring.consumers import ServiceConsumer

        consumer = ServiceConsumer()
        self.assertIsNotNone(consumer)

    def test_event_consumer_initialization(self):
        """Test EventConsumer can be imported and initialized"""
        from monitoring.consumers import EventConsumer

        consumer = EventConsumer()
        self.assertIsNotNone(consumer)

    def test_alert_consumer_initialization(self):
        """Test AlertConsumer can be imported and initialized"""
        from monitoring.consumers import AlertConsumer

        consumer = AlertConsumer()
        self.assertIsNotNone(consumer)

    def test_service_detail_consumer_initialization(self):
        """Test ServiceDetailConsumer can be imported and initialized"""
        from monitoring.consumers import ServiceDetailConsumer

        consumer = ServiceDetailConsumer()
        self.assertIsNotNone(consumer)


class EventBroadcasterTest(TestCase):
    """Test the event broadcaster functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_event_broadcaster_initialization(self):
        """Test event broadcaster can be imported and initialized"""
        from monitoring.broadcast import event_broadcaster

        self.assertIsNotNone(event_broadcaster)

    def test_broadcast_with_no_channel_layer(self):
        """Test broadcasting when no channel layer is available"""
        from monitoring.broadcast import event_broadcaster

        with patch("monitoring.broadcast.get_channel_layer", return_value=None):
            # Should not raise an exception
            event_broadcaster.broadcast_service_update(self.service)
            event_broadcaster.broadcast_service_status_change(
                self.service, "healthy", "unhealthy"
            )

    def test_broadcast_methods_exist(self):
        """Test that all broadcast methods exist and are callable"""
        from monitoring.broadcast import event_broadcaster

        # Test that methods exist
        self.assertTrue(hasattr(event_broadcaster, "broadcast_service_update"))
        self.assertTrue(hasattr(event_broadcaster, "broadcast_service_status_change"))
        self.assertTrue(hasattr(event_broadcaster, "broadcast_new_event"))
        self.assertTrue(hasattr(event_broadcaster, "broadcast_health_check_result"))
        self.assertTrue(hasattr(event_broadcaster, "broadcast_new_alert"))
        self.assertTrue(hasattr(event_broadcaster, "broadcast_alert_resolved"))

        # Test that methods are callable
        self.assertTrue(callable(event_broadcaster.broadcast_service_update))
        self.assertTrue(callable(event_broadcaster.broadcast_service_status_change))
        self.assertTrue(callable(event_broadcaster.broadcast_new_event))
        self.assertTrue(callable(event_broadcaster.broadcast_health_check_result))
        self.assertTrue(callable(event_broadcaster.broadcast_new_alert))
        self.assertTrue(callable(event_broadcaster.broadcast_alert_resolved))


class HealthCheckModelTest(TestCase):
    """Test the HealthCheck model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_health_check_creation(self):
        """Test creating a health check"""
        from healthchecks.models import HealthCheck

        health_check = HealthCheck.objects.create(
            service=self.service,
            name="test-check",
            check_type="http",
            config={"url": "http://example.com", "timeout": 30},
        )

        self.assertEqual(health_check.service, self.service)
        self.assertEqual(health_check.name, "test-check")
        self.assertEqual(health_check.check_type, "http")
        self.assertTrue(health_check.enabled)

    def test_health_check_get_config_value(self):
        """Test getting config values from health check"""
        from healthchecks.models import HealthCheck

        health_check = HealthCheck.objects.create(
            service=self.service,
            name="test-check",
            check_type="http",
            config={"url": "http://example.com", "timeout": 30},
        )

        self.assertEqual(health_check.get_config_value("url"), "http://example.com")
        self.assertEqual(health_check.get_config_value("timeout"), 30)
        self.assertEqual(health_check.get_config_value("missing", "default"), "default")


class EventModelTest(TestCase):
    """Test the Event model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_event_creation(self):
        """Test creating an event"""
        from events.models import Event

        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            severity="info",
            title="Service Started",
            message="Test service has started",
        )

        self.assertEqual(event.service, self.service)
        self.assertEqual(event.event_type, "service_started")
        self.assertEqual(event.severity, "info")
        self.assertEqual(event.title, "Service Started")

    def test_event_with_user(self):
        """Test creating an event with a user"""
        from events.models import Event

        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            severity="info",
            title="Service Started",
            message="Test service has started",
            user=self.user,
        )

        self.assertEqual(event.user, self.user)

    def test_event_acknowledgment(self):
        """Test event acknowledgment"""
        from events.models import Event

        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            severity="info",
            title="Service Started",
            message="Test service has started",
        )

        self.assertFalse(event.acknowledged)

        event.acknowledged = True
        event.acknowledged_by = self.user
        event.save()

        self.assertTrue(event.acknowledged)
        self.assertEqual(event.acknowledged_by, self.user)


class EventMonitorTest(TestCase):
    """Test the event monitor functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_event_monitor_initialization(self):
        """Test event monitor initialization"""
        from monitoring.event_monitor import event_monitor

        self.assertIsNotNone(event_monitor)

    @patch("monitoring.event_monitor.docker_service")
    def test_event_monitor_with_mock(self, mock_docker_service):
        """Test event monitor with mocked Docker service"""
        from monitoring.event_monitor import event_monitor

        mock_docker_service.is_available.return_value = True

        # Test that the monitor can be initialized without errors
        self.assertIsNotNone(event_monitor)


class MonitoringIntegrationTest(TestCase):
    """Integration tests for monitoring functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Integration Test Service",
            service_type="http",
            config={"url": "http://example.com"},
            created_by=self.user,
        )

    def test_full_health_check_flow(self):
        """Test the complete health check flow"""
        from healthchecks.models import HealthCheck
        from monitoring.health_checker import health_checker

        # Create a health check
        health_check = HealthCheck.objects.create(
            service=self.service,
            name="integration-check",
            check_type="http",
            config={"url": "http://example.com"},
        )

        # Run health check
        with patch("monitoring.health_checker.requests.request") as mock_request:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.elapsed.total_seconds.return_value = 0.5
            mock_request.return_value = mock_response

            result = health_checker.run_check(self.service)

            self.assertTrue(result["success"])
            self.assertEqual(result["status_code"], 200)

    def test_event_creation_and_broadcast(self):
        """Test event creation and broadcasting"""
        from events.models import Event
        from monitoring.broadcast import event_broadcaster

        # Create an event
        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            severity="info",
            title="Service Started",
            message="Test service has started",
        )

        # Test broadcasting (should not raise exceptions)
        with patch("monitoring.broadcast.get_channel_layer", return_value=None):
            event_broadcaster.broadcast_new_event(event)

        self.assertEqual(event.service, self.service)
        self.assertEqual(event.event_type, "service_started")
