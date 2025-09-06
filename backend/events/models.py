from django.db import models
from services.models import Service


class Event(models.Model):
    """Represents an event in the system"""

    EVENT_TYPES = [
        ("service_started", "Service Started"),
        ("service_stopped", "Service Stopped"),
        ("service_restarted", "Service Restarted"),
        ("service_created", "Service Created"),
        ("service_updated", "Service Updated"),
        ("service_deleted", "Service Deleted"),
        ("health_check_failed", "Health Check Failed"),
        ("health_check_recovered", "Health Check Recovered"),
        ("health_check_success", "Health Check Success"),
        ("alert_triggered", "Alert Triggered"),
        ("alert_resolved", "Alert Resolved"),
        ("alert_created", "Alert Created"),
        ("alert_updated", "Alert Updated"),
        ("alert_deleted", "Alert Deleted"),
        ("system_startup", "System Startup"),
        ("system_shutdown", "System Shutdown"),
        ("user_login", "User Login"),
        ("user_logout", "User Logout"),
    ]

    SEVERITY_CHOICES = [
        ("info", "Info"),
        ("warning", "Warning"),
        ("error", "Error"),
        ("critical", "Critical"),
    ]

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="events", null=True, blank=True
    )
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default="info")
    title = models.CharField(max_length=200)
    message = models.TextField()
    metadata = models.JSONField(default=dict)
    source = models.CharField(
        max_length=100, default="system", help_text="Source of the event"
    )
    user = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who triggered the event",
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    acknowledged = models.BooleanField(default=False)
    acknowledged_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acknowledged_events",
        help_text="User who acknowledged the event",
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.event_type} - {self.title}"
