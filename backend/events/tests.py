from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from services.models import Service

from .models import Event


class EventModelTest(TestCase):
    """Test the Event model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service", service_type="http", created_by=self.user
        )

    def test_event_creation(self):
        """Test creating an event with all enhanced fields"""
        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            severity="info",
            title="Service Started",
            message="The service has been started successfully",
            metadata={"pid": 1234, "port": 8080},
            source="system",
            user=self.user,
            acknowledged=False,
        )

        self.assertEqual(event.service, self.service)
        self.assertEqual(event.event_type, "service_started")
        self.assertEqual(event.severity, "info")
        self.assertEqual(event.title, "Service Started")
        self.assertEqual(event.message, "The service has been started successfully")
        self.assertEqual(event.metadata, {"pid": 1234, "port": 8080})
        self.assertEqual(event.source, "system")
        self.assertEqual(event.user, self.user)
        self.assertFalse(event.acknowledged)
        self.assertIsNone(event.acknowledged_by)
        self.assertIsNone(event.acknowledged_at)
        self.assertIsNotNone(event.timestamp)

    def test_event_default_values(self):
        """Test default values for event fields"""
        event = Event.objects.create(
            service=self.service,
            event_type="health_check_failed",
            title="Health Check Failed",
            message="Service is not responding",
        )

        self.assertEqual(event.severity, "info")  # Default value
        self.assertEqual(event.metadata, {})  # Default value
        self.assertEqual(event.source, "system")  # Default value
        self.assertIsNone(event.user)  # Default value
        self.assertFalse(event.acknowledged)  # Default value
        self.assertIsNone(event.acknowledged_by)  # Default value
        self.assertIsNone(event.acknowledged_at)  # Default value

    def test_event_type_choices(self):
        """Test all event type choices"""
        event_types = [
            "service_started",
            "service_stopped",
            "service_restarted",
            "service_created",
            "service_updated",
            "service_deleted",
            "health_check_failed",
            "health_check_recovered",
            "health_check_success",
            "alert_triggered",
            "alert_resolved",
            "alert_created",
            "alert_updated",
            "alert_deleted",
            "system_startup",
            "system_shutdown",
            "user_login",
            "user_logout",
        ]

        for event_type in event_types:
            event = Event.objects.create(
                service=self.service,
                event_type=event_type,
                title=f"Test {event_type}",
                message=f"Test message for {event_type}",
            )
            self.assertEqual(event.event_type, event_type)

    def test_event_severity_choices(self):
        """Test all event severity choices"""
        severities = ["info", "warning", "error", "critical"]

        for severity in severities:
            event = Event.objects.create(
                service=self.service,
                event_type="test_event",
                severity=severity,
                title=f"Test {severity} event",
                message=f"Test message for {severity}",
            )
            self.assertEqual(event.severity, severity)

    def test_event_acknowledgment(self):
        """Test event acknowledgment functionality"""
        event = Event.objects.create(
            service=self.service,
            event_type="alert_triggered",
            severity="warning",
            title="Alert Triggered",
            message="An alert has been triggered",
        )

        # Initially not acknowledged
        self.assertFalse(event.acknowledged)
        self.assertIsNone(event.acknowledged_by)
        self.assertIsNone(event.acknowledged_at)

        # Acknowledge the event
        event.acknowledged = True
        event.acknowledged_by = self.user
        event.acknowledged_at = timezone.now()
        event.save()

        event.refresh_from_db()
        self.assertTrue(event.acknowledged)
        self.assertEqual(event.acknowledged_by, self.user)
        self.assertIsNotNone(event.acknowledged_at)

    def test_event_string_representation(self):
        """Test event string representation"""
        event = Event.objects.create(
            service=self.service, event_type="service_started", title="Service Started"
        )
        expected_str = "service_started - Service Started"
        self.assertEqual(str(event), expected_str)

    def test_event_ordering(self):
        """Test event ordering by timestamp (most recent first)"""
        # Create events with different timestamps
        event1 = Event.objects.create(
            service=self.service,
            event_type="service_started",
            title="First Event",
            message="First event message",
        )

        # Wait a moment to ensure different timestamps
        import time

        time.sleep(0.01)

        event2 = Event.objects.create(
            service=self.service,
            event_type="service_stopped",
            title="Second Event",
            message="Second event message",
        )

        events = Event.objects.all()
        self.assertEqual(events[0], event2)  # Most recent first
        self.assertEqual(events[1], event1)

    def test_event_without_service(self):
        """Test creating an event without a service (system events)"""
        event = Event.objects.create(
            service=None,
            event_type="system_startup",
            severity="info",
            title="System Startup",
            message="The system has started up",
        )

        self.assertIsNone(event.service)
        self.assertEqual(event.event_type, "system_startup")
        self.assertEqual(event.title, "System Startup")

    def test_event_service_relationship(self):
        """Test event service relationship"""
        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            title="Service Started",
            message="Service started",
        )

        # Test forward relationship
        self.assertEqual(event.service, self.service)

        # Test reverse relationship
        self.assertIn(event, self.service.events.all())


class EventAPITest(APITestCase):
    """Test the Event API endpoints"""

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

    def test_list_events(self):
        """Test listing events via API"""
        # Create test events
        Event.objects.create(
            service=self.service,
            event_type="service_started",
            title="Service Started",
            message="Service has started",
        )
        Event.objects.create(
            service=self.service,
            event_type="health_check_failed",
            severity="error",
            title="Health Check Failed",
            message="Service is not responding",
        )

        response = self.client.get("/api/v1/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_retrieve_event(self):
        """Test retrieving a specific event via API"""
        event = Event.objects.create(
            service=self.service,
            event_type="alert_triggered",
            severity="warning",
            title="Alert Triggered",
            message="An alert has been triggered",
            metadata={"alert_id": 123},
            source="monitoring",
            user=self.user,
            acknowledged=True,
            acknowledged_by=self.user,
            acknowledged_at=timezone.now(),
        )

        response = self.client.get(f"/api/v1/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["event_type"], "alert_triggered")
        self.assertEqual(response.data["severity"], "warning")
        self.assertEqual(response.data["title"], "Alert Triggered")
        self.assertEqual(response.data["metadata"], {"alert_id": 123})
        self.assertEqual(response.data["source"], "monitoring")
        self.assertEqual(response.data["user_name"], self.user.username)
        self.assertTrue(response.data["acknowledged"])
        self.assertEqual(response.data["acknowledged_by_name"], self.user.username)

    def test_event_filtering_by_service(self):
        """Test filtering events by service"""
        other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="otherpass123"
        )
        other_service = Service.objects.create(
            name="Other Service", service_type="http", created_by=other_user
        )

        # Create event for other service
        Event.objects.create(
            service=other_service,
            event_type="service_started",
            title="Other Service Started",
            message="Other service started",
        )

        # Create event for current user's service
        Event.objects.create(
            service=self.service,
            event_type="service_stopped",
            title="My Service Stopped",
            message="My service stopped",
        )

        response = self.client.get("/api/v1/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "My Service Stopped")

    def test_event_read_only(self):
        """Test that events are read-only via API"""
        event = Event.objects.create(
            service=self.service,
            event_type="service_started",
            title="Service Started",
            message="Service started",
        )

        data = {"title": "Updated Title", "message": "Updated message"}

        # Test PATCH (should not be allowed)
        response = self.client.patch(f"/api/v1/events/{event.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Test PUT (should not be allowed)
        response = self.client.put(f"/api/v1/events/{event.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

        # Test DELETE (should not be allowed)
        response = self.client.delete(f"/api/v1/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access events"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/events/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_event_with_system_source(self):
        """Test event with system source"""
        # Create a system event (no service required)
        event = Event.objects.create(
            service=None,
            event_type="system_startup",
            title="System Startup",
            message="System has started up",
            source="system",
        )

        # Since the event has no service, it won't be visible to the user
        # This is expected behavior - users only see events for their services
        response = self.client.get("/api/v1/events/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 0)  # No events visible

    def test_event_with_user_action(self):
        """Test event triggered by user action"""
        event = Event.objects.create(
            service=self.service,
            event_type="service_restarted",
            title="Service Restarted",
            message="Service was restarted by user",
            source="user_action",
            user=self.user,
        )

        response = self.client.get(f"/api/v1/events/{event.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["source"], "user_action")
        self.assertEqual(response.data["user_name"], self.user.username)
