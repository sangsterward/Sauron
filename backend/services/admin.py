from django.contrib import admin

from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "service_type",
        "status",
        "enabled",
        "last_check",
        "created_by",
    ]
    list_filter = ["service_type", "status", "enabled", "created_at"]
    search_fields = ["name", "description", "tags"]
    readonly_fields = ["created_at", "updated_at"]
    fieldsets = (
        (
            "Basic Information",
            {"fields": ("name", "description", "service_type", "enabled")},
        ),
        (
            "Configuration",
            {"fields": ("config", "check_interval", "timeout", "retry_count")},
        ),
        ("Metadata", {"fields": ("tags", "metadata")}),
        ("Status", {"fields": ("status", "last_check")}),
        ("System", {"fields": ("created_by", "created_at", "updated_at")}),
    )
