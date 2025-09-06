from django.contrib.auth.models import User
from django.db import models
from services.models import Service


class NotificationChannel(models.Model):
    """Represents a notification channel for alerts"""

    CHANNEL_TYPES = [
        ("email", "Email"),
        ("slack", "Slack"),
        ("webhook", "Webhook"),
        ("sms", "SMS"),
        ("discord", "Discord"),
        ("teams", "Microsoft Teams"),
    ]

    name = models.CharField(max_length=100)
    channel_type = models.CharField(max_length=20, choices=CHANNEL_TYPES)
    config = models.JSONField(default=dict, help_text="Channel configuration")
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.channel_type})"


class Alert(models.Model):
    """Represents an alert rule"""

    ALERT_TYPES = [
        ("health_check_failure", "Health Check Failure"),
        ("response_time", "Response Time"),
        ("service_down", "Service Down"),
        ("service_up", "Service Up"),
        ("custom", "Custom"),
    ]

    STATUS_CHOICES = [
        ("active", "Active"),
        ("triggered", "Triggered"),
        ("resolved", "Resolved"),
        ("disabled", "Disabled"),
        ("paused", "Paused"),
    ]

    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    alert_type = models.CharField(max_length=50, choices=ALERT_TYPES)
    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="alerts"
    )
    condition = models.JSONField(
        default=dict, help_text="Alert condition configuration"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="active")
    severity = models.CharField(
        max_length=20, choices=SEVERITY_CHOICES, default="medium"
    )
    enabled = models.BooleanField(default=True)
    cooldown_period = models.IntegerField(
        default=300, help_text="Cooldown period in seconds"
    )
    escalation_enabled = models.BooleanField(default=False)
    escalation_delay = models.IntegerField(
        default=1800, help_text="Escalation delay in seconds"
    )
    notification_channels = models.JSONField(
        default=list, help_text="Notification channels"
    )
    tags = models.JSONField(default=list, help_text="Tags for categorization")
    last_triggered = models.DateTimeField(null=True, blank=True)
    trigger_count = models.IntegerField(
        default=0, help_text="Number of times this alert has been triggered"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} - {self.service.name}"


class AlertHistory(models.Model):
    """Represents the history of alert triggers"""

    STATUS_CHOICES = [
        ("triggered", "Triggered"),
        ("resolved", "Resolved"),
        ("escalated", "Escalated"),
        ("acknowledged", "Acknowledged"),
    ]

    alert = models.ForeignKey(Alert, on_delete=models.CASCADE, related_name="history")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="triggered"
    )
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    acknowledged_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="User who acknowledged the alert",
    )
    message = models.TextField()
    metadata = models.JSONField(default=dict)
    notification_sent = models.BooleanField(default=False)
    notification_channels = models.JSONField(default=list)
    escalation_level = models.IntegerField(
        default=0, help_text="Current escalation level"
    )

    class Meta:
        ordering = ["-triggered_at"]

    def __str__(self):
        return f"{self.alert.name} - {self.triggered_at}"
