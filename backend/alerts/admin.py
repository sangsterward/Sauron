from django.contrib import admin

from .models import Alert
from .models import AlertHistory
from .models import NotificationChannel


@admin.register(NotificationChannel)
class NotificationChannelAdmin(admin.ModelAdmin):
    list_display = ["name", "channel_type", "enabled", "created_by"]
    list_filter = ["channel_type", "enabled", "created_at"]
    search_fields = ["name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "alert_type",
        "service",
        "status",
        "severity",
        "enabled",
        "last_triggered",
        "created_by",
    ]
    list_filter = ["alert_type", "status", "severity", "enabled", "created_at"]
    search_fields = ["name", "description", "service__name", "tags"]
    readonly_fields = ["created_at", "updated_at", "trigger_count"]
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "description", "alert_type", "service")},
        ),
        (
            "Configuration",
            {"fields": ("condition", "severity", "enabled", "cooldown_period")},
        ),
        ("Escalation", {"fields": ("escalation_enabled", "escalation_delay")}),
        ("Notifications", {"fields": ("notification_channels",)}),
        ("Metadata", {"fields": ("tags",)}),
        ("Status", {"fields": ("status", "last_triggered", "trigger_count")}),
        ("System", {"fields": ("created_by", "created_at", "updated_at")}),
    )


@admin.register(AlertHistory)
class AlertHistoryAdmin(admin.ModelAdmin):
    list_display = ["alert", "status", "triggered_at", "resolved_at", "acknowledged_by"]
    list_filter = ["status", "triggered_at", "resolved_at", "notification_sent"]
    search_fields = ["alert__name", "message"]
    readonly_fields = ["triggered_at"]
