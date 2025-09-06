from django.contrib import admin

from .models import HealthCheck


@admin.register(HealthCheck)
class HealthCheckAdmin(admin.ModelAdmin):
    list_display = ["service", "status", "response_time", "checked_at"]
    list_filter = ["status", "checked_at"]
    search_fields = ["service__name", "message"]
    readonly_fields = ["checked_at"]
