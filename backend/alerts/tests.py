from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase
from services.models import Service

from .models import Alert
from .models import AlertHistory
from .models import NotificationChannel


class NotificationChannelModelTest(TestCase):
    """Test the NotificationChannel model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_notification_channel_creation(self):
        """Test creating a notification channel with all fields"""
        channel = NotificationChannel.objects.create(
            name="Email Channel",
            channel_type="email",
            config={"email": "admin@example.com", "smtp_server": "localhost"},
            enabled=True,
            created_by=self.user,
        )

        self.assertEqual(channel.name, "Email Channel")
        self.assertEqual(channel.channel_type, "email")
        self.assertEqual(
            channel.config, {"email": "admin@example.com", "smtp_server": "localhost"}
        )
        self.assertTrue(channel.enabled)
        self.assertEqual(channel.created_by, self.user)
        self.assertIsNotNone(channel.created_at)
        self.assertIsNotNone(channel.updated_at)

    def test_notification_channel_default_values(self):
        """Test default values for notification channel fields"""
        channel = NotificationChannel.objects.create(
            name="Default Channel", channel_type="slack", created_by=self.user
        )

        self.assertEqual(channel.config, {})  # Default value
        self.assertTrue(channel.enabled)  # Default value

    def test_notification_channel_type_choices(self):
        """Test all notification channel type choices"""
        channel_types = ["email", "slack", "webhook", "sms", "discord", "teams"]

        for channel_type in channel_types:
            channel = NotificationChannel.objects.create(
                name=f"Test {channel_type} Channel",
                channel_type=channel_type,
                created_by=self.user,
            )
            self.assertEqual(channel.channel_type, channel_type)

    def test_notification_channel_string_representation(self):
        """Test notification channel string representation"""
        channel = NotificationChannel.objects.create(
            name="Test Channel", channel_type="email", created_by=self.user
        )
        expected_str = "Test Channel (email)"
        self.assertEqual(str(channel), expected_str)

    def test_notification_channel_ordering(self):
        """Test notification channel ordering by name"""
        channel1 = NotificationChannel.objects.create(
            name="Z Channel", channel_type="email", created_by=self.user
        )
        channel2 = NotificationChannel.objects.create(
            name="A Channel", channel_type="slack", created_by=self.user
        )

        channels = NotificationChannel.objects.all()
        self.assertEqual(channels[0], channel2)  # A Channel should come first
        self.assertEqual(channels[1], channel1)  # Z Channel should come second


class AlertModelTest(TestCase):
    """Test the Alert model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.service = Service.objects.create(
            name="Test Service", service_type="http", created_by=self.user
        )

    def test_alert_creation(self):
        """Test creating an alert with all enhanced fields"""
        alert = Alert.objects.create(
            name="Service Down Alert",
            description="Alert when service is down",
            alert_type="service_down",
            service=self.service,
            condition={"threshold": 3, "time_window": 300},
            status="active",
            severity="high",
            enabled=True,
            cooldown_period=600,
            escalation_enabled=True,
            escalation_delay=1800,
            notification_channels=[1, 2],
            tags=["critical", "production"],
            created_by=self.user,
        )

        self.assertEqual(alert.name, "Service Down Alert")
        self.assertEqual(alert.description, "Alert when service is down")
        self.assertEqual(alert.alert_type, "service_down")
        self.assertEqual(alert.service, self.service)
        self.assertEqual(alert.condition, {"threshold": 3, "time_window": 300})
        self.assertEqual(alert.status, "active")
        self.assertEqual(alert.severity, "high")
        self.assertTrue(alert.enabled)
        self.assertEqual(alert.cooldown_period, 600)
        self.assertTrue(alert.escalation_enabled)
        self.assertEqual(alert.escalation_delay, 1800)
        self.assertEqual(alert.notification_channels, [1, 2])
        self.assertEqual(alert.tags, ["critical", "production"])
        self.assertEqual(alert.trigger_count, 0)
        self.assertEqual(alert.created_by, self.user)

    def test_alert_default_values(self):
        """Test default values for alert fields"""
        alert = Alert.objects.create(
            name="Default Alert",
            alert_type="health_check_failure",
            service=self.service,
            created_by=self.user,
        )

        self.assertEqual(alert.condition, {})  # Default value
        self.assertEqual(alert.status, "active")  # Default value
        self.assertEqual(alert.severity, "medium")  # Default value
        self.assertTrue(alert.enabled)  # Default value
        self.assertEqual(alert.cooldown_period, 300)  # Default value
        self.assertFalse(alert.escalation_enabled)  # Default value
        self.assertEqual(alert.escalation_delay, 1800)  # Default value
        self.assertEqual(alert.notification_channels, [])  # Default value
        self.assertEqual(alert.tags, [])  # Default value
        self.assertEqual(alert.trigger_count, 0)  # Default value

    def test_alert_string_representation(self):
        """Test alert string representation"""
        alert = Alert.objects.create(
            name="Test Alert",
            alert_type="health_check_failure",
            service=self.service,
            created_by=self.user,
        )
        expected_str = "Test Alert - Test Service"
        self.assertEqual(str(alert), expected_str)


class AlertAPITest(APITestCase):
    """Test the Alert API endpoints"""

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

    def test_create_alert(self):
        """Test creating an alert via API"""
        data = {
            "name": "API Test Alert",
            "description": "An alert created via API",
            "alert_type": "health_check_failure",
            "service": self.service.id,
            "condition": {"threshold": 3, "time_window": 300},
            "severity": "high",
            "enabled": True,
            "cooldown_period": 600,
            "escalation_enabled": True,
            "escalation_delay": 1800,
            "notification_channels": [1, 2],
            "tags": ["api", "test"],
        }

        response = self.client.post("/api/v1/alerts/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        alert = Alert.objects.get(name="API Test Alert")
        self.assertEqual(alert.severity, "high")
        self.assertEqual(alert.cooldown_period, 600)
        self.assertTrue(alert.escalation_enabled)
        self.assertEqual(alert.tags, ["api", "test"])
        self.assertEqual(alert.created_by, self.user)

    def test_list_alerts(self):
        """Test listing alerts via API"""
        # Create test alerts
        Alert.objects.create(
            name="Alert 1",
            alert_type="health_check_failure",
            service=self.service,
            created_by=self.user,
        )
        Alert.objects.create(
            name="Alert 2",
            alert_type="service_down",
            service=self.service,
            created_by=self.user,
        )

        response = self.client.get("/api/v1/alerts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_retrieve_alert(self):
        """Test retrieving a specific alert via API"""
        alert = Alert.objects.create(
            name="Retrieve Test Alert",
            alert_type="health_check_failure",
            service=self.service,
            severity="critical",
            tags=["test"],
            created_by=self.user,
        )

        response = self.client.get(f"/api/v1/alerts/{alert.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Retrieve Test Alert")
        self.assertEqual(response.data["severity"], "critical")
        self.assertEqual(response.data["tags"], ["test"])
        self.assertEqual(response.data["service_name"], self.service.name)

    def test_update_alert(self):
        """Test updating an alert via API"""
        alert = Alert.objects.create(
            name="Update Test Alert",
            alert_type="health_check_failure",
            service=self.service,
            severity="medium",
            created_by=self.user,
        )

        data = {
            "name": "Updated Alert",
            "severity": "high",
            "tags": ["updated", "test"],
        }

        response = self.client.patch(f"/api/v1/alerts/{alert.id}/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        alert.refresh_from_db()
        self.assertEqual(alert.name, "Updated Alert")
        self.assertEqual(alert.severity, "high")
        self.assertEqual(alert.tags, ["updated", "test"])

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access alerts"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/alerts/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_isolation(self):
        """Test that users only see their own alerts"""
        other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="otherpass123"
        )

        # Create alert for other user
        Alert.objects.create(
            name="Other User Alert",
            alert_type="health_check_failure",
            service=self.service,
            created_by=other_user,
        )

        # Create alert for current user
        Alert.objects.create(
            name="My Alert",
            alert_type="service_down",
            service=self.service,
            created_by=self.user,
        )

        response = self.client.get("/api/v1/alerts/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "My Alert")


class NotificationChannelAPITest(APITestCase):
    """Test the NotificationChannel API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_create_notification_channel(self):
        """Test creating a notification channel via API"""
        data = {
            "name": "Email Notifications",
            "channel_type": "email",
            "config": {"email": "admin@example.com", "smtp_server": "localhost"},
            "enabled": True,
        }

        response = self.client.post(
            "/api/v1/notification-channels/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        channel = NotificationChannel.objects.get(name="Email Notifications")
        self.assertEqual(channel.channel_type, "email")
        self.assertEqual(
            channel.config, {"email": "admin@example.com", "smtp_server": "localhost"}
        )
        self.assertTrue(channel.enabled)
        self.assertEqual(channel.created_by, self.user)

    def test_list_notification_channels(self):
        """Test listing notification channels via API"""
        # Create test channels
        NotificationChannel.objects.create(
            name="Email Channel", channel_type="email", created_by=self.user
        )
        NotificationChannel.objects.create(
            name="Slack Channel", channel_type="slack", created_by=self.user
        )

        response = self.client.get("/api/v1/notification-channels/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_retrieve_notification_channel(self):
        """Test retrieving a specific notification channel via API"""
        channel = NotificationChannel.objects.create(
            name="Retrieve Test Channel",
            channel_type="webhook",
            config={"url": "https://hooks.slack.com/test"},
            created_by=self.user,
        )

        response = self.client.get(f"/api/v1/notification-channels/{channel.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Retrieve Test Channel")
        self.assertEqual(response.data["channel_type"], "webhook")
        self.assertEqual(
            response.data["config"], {"url": "https://hooks.slack.com/test"}
        )

    def test_update_notification_channel(self):
        """Test updating a notification channel via API"""
        channel = NotificationChannel.objects.create(
            name="Update Test Channel", channel_type="email", created_by=self.user
        )

        data = {"name": "Updated Channel", "config": {"email": "new@example.com"}}

        response = self.client.patch(
            f"/api/v1/notification-channels/{channel.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        channel.refresh_from_db()
        self.assertEqual(channel.name, "Updated Channel")
        self.assertEqual(channel.config, {"email": "new@example.com"})

    def test_delete_notification_channel(self):
        """Test deleting a notification channel via API"""
        channel = NotificationChannel.objects.create(
            name="Delete Test Channel", channel_type="email", created_by=self.user
        )

        response = self.client.delete(f"/api/v1/notification-channels/{channel.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(NotificationChannel.objects.filter(id=channel.id).exists())

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access notification channels"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/notification-channels/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_isolation(self):
        """Test that users only see their own notification channels"""
        other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="otherpass123"
        )

        # Create channel for other user
        NotificationChannel.objects.create(
            name="Other User Channel", channel_type="email", created_by=other_user
        )

        # Create channel for current user
        NotificationChannel.objects.create(
            name="My Channel", channel_type="slack", created_by=self.user
        )

        response = self.client.get("/api/v1/notification-channels/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "My Channel")
