from rest_framework import serializers

from .models import Event


class EventSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    user_name = serializers.CharField(source="user.username", read_only=True)
    acknowledged_by_name = serializers.CharField(
        source="acknowledged_by.username", read_only=True
    )

    class Meta:
        model = Event
        fields = [
            "id",
            "service",
            "service_name",
            "event_type",
            "severity",
            "title",
            "message",
            "metadata",
            "source",
            "user",
            "user_name",
            "timestamp",
            "acknowledged",
            "acknowledged_by",
            "acknowledged_by_name",
            "acknowledged_at",
        ]
        read_only_fields = ["id", "timestamp"]
