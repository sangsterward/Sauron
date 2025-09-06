from rest_framework import serializers

from .models import HealthCheck


class HealthCheckSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = HealthCheck
        fields = [
            "id",
            "service",
            "service_name",
            "status",
            "response_time",
            "message",
            "details",
            "error_code",
            "http_status",
            "checked_at",
            "duration",
        ]
        read_only_fields = ["id", "checked_at"]
