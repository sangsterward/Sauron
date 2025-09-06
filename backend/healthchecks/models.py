from django.db import models
from services.models import Service


class HealthCheck(models.Model):
    """Represents a health check result for a service"""

    STATUS_CHOICES = [
        ("success", "Success"),
        ("failure", "Failure"),
        ("timeout", "Timeout"),
        ("error", "Error"),
        ("skipped", "Skipped"),
    ]

    service = models.ForeignKey(
        Service, on_delete=models.CASCADE, related_name="health_checks"
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    response_time = models.FloatField(
        null=True, blank=True, help_text="Response time in milliseconds"
    )
    message = models.TextField(blank=True)
    details = models.JSONField(default=dict)
    error_code = models.CharField(
        max_length=50, blank=True, help_text="Error code if applicable"
    )
    http_status = models.IntegerField(
        null=True, blank=True, help_text="HTTP status code for HTTP checks"
    )
    checked_at = models.DateTimeField(auto_now_add=True)
    duration = models.FloatField(
        null=True, blank=True, help_text="Total check duration in seconds"
    )

    class Meta:
        ordering = ["-checked_at"]

    def __str__(self):
        return f"{self.service.name} - {self.status} ({self.checked_at})"
