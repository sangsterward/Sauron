from django.contrib import admin

from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["event_type", "severity", "title", "service", "timestamp"]
    list_filter = ["event_type", "severity", "timestamp"]
    search_fields = ["title", "message", "service__name"]
    readonly_fields = ["timestamp"]
