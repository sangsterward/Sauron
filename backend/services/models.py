from django.contrib.auth.models import User
from django.db import models


class Service(models.Model):
    """Represents a service to be monitored"""

    SERVICE_TYPES = [
        ("docker", "Docker Container"),
        ("http", "HTTP Endpoint"),
        ("tcp", "TCP Port"),
        ("custom", "Custom Script"),
    ]

    STATUS_CHOICES = [
        ("healthy", "Healthy"),
        ("unhealthy", "Unhealthy"),
        ("unknown", "Unknown"),
        ("starting", "Starting"),
        ("stopping", "Stopping"),
        ("restarting", "Restarting"),
    ]

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    service_type = models.CharField(max_length=20, choices=SERVICE_TYPES)
    config = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="unknown")
    last_check = models.DateTimeField(null=True, blank=True)
    check_interval = models.IntegerField(
        default=60, help_text="Health check interval in seconds"
    )
    timeout = models.IntegerField(
        default=30, help_text="Health check timeout in seconds"
    )
    retry_count = models.IntegerField(
        default=3, help_text="Number of retries before marking as unhealthy"
    )
    enabled = models.BooleanField(default=True)
    tags = models.JSONField(default=list, help_text="Tags for categorization")
    metadata = models.JSONField(default=dict, help_text="Additional metadata")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name
