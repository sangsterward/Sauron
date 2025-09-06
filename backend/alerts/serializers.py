from rest_framework import serializers

from .models import Alert
from .models import AlertHistory
from .models import NotificationChannel


class NotificationChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationChannel
        fields = [
            "id",
            "name",
            "channel_type",
            "config",
            "enabled",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class AlertSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)

    class Meta:
        model = Alert
        fields = [
            "id",
            "name",
            "description",
            "alert_type",
            "service",
            "service_name",
            "condition",
            "status",
            "severity",
            "enabled",
            "cooldown_period",
            "escalation_enabled",
            "escalation_delay",
            "notification_channels",
            "tags",
            "last_triggered",
            "trigger_count",
            "created_at",
            "updated_at",
            "created_by",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "created_by"]

    def create(self, validated_data):
        validated_data["created_by"] = self.context["request"].user
        return super().create(validated_data)


class AlertHistorySerializer(serializers.ModelSerializer):
    alert_name = serializers.CharField(source="alert.name", read_only=True)
    acknowledged_by_name = serializers.CharField(
        source="acknowledged_by.username", read_only=True
    )

    class Meta:
        model = AlertHistory
        fields = [
            "id",
            "alert",
            "alert_name",
            "status",
            "triggered_at",
            "resolved_at",
            "acknowledged_at",
            "acknowledged_by",
            "acknowledged_by_name",
            "message",
            "metadata",
            "notification_sent",
            "notification_channels",
            "escalation_level",
        ]
        read_only_fields = ["id", "triggered_at"]
