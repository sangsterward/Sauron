import logging

from alerts.models import Alert
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from events.models import Event
from services.models import Service

logger = logging.getLogger(__name__)


class EventBroadcaster:
    def __init__(self):
        self.channel_layer = get_channel_layer()

    def broadcast_service_update(self, service: Service):
        """Broadcast service update to all connected clients"""
        if not self.channel_layer:
            return

        service_data = {
            "id": service.id,
            "name": service.name,
            "service_type": service.service_type,
            "status": service.status,
            "last_checked": (
                service.last_check.isoformat() if service.last_check else None
            ),
            "is_healthy": service.status == "healthy",
        }

        async_to_sync(self.channel_layer.group_send)(
            "services", {"type": "service_update", "service": service_data}
        )

        # Also send to service-specific group
        async_to_sync(self.channel_layer.group_send)(
            f"service_{service.id}", {"type": "service_update", "service": service_data}
        )

    def broadcast_service_status_change(
        self, service: Service, old_status: str, new_status: str
    ):
        """Broadcast service status change"""
        if not self.channel_layer:
            return

        async_to_sync(self.channel_layer.group_send)(
            "services",
            {
                "type": "service_status_change",
                "service_id": service.id,
                "old_status": old_status,
                "new_status": new_status,
                "timestamp": service.updated_at.isoformat(),
            },
        )

    def broadcast_new_event(self, event: Event):
        """Broadcast new event to all connected clients"""
        if not self.channel_layer:
            return

        event_data = {
            "id": event.id,
            "service_id": event.service.id,
            "service_name": event.service.name,
            "event_type": event.event_type,
            "severity": event.severity,
            "title": event.title,
            "message": event.message,
            "metadata": event.metadata,
            "timestamp": event.timestamp.isoformat(),
        }

        # Broadcast to all events subscribers
        async_to_sync(self.channel_layer.group_send)(
            "events", {"type": "new_event", "event": event_data}
        )

        # Broadcast to service-specific event subscribers
        async_to_sync(self.channel_layer.group_send)(
            f"events_service_{event.service.id}",
            {"type": "new_event", "event": event_data},
        )

    def broadcast_health_check_result(self, service: Service, result: dict):
        """Broadcast health check result"""
        if not self.channel_layer:
            return

        async_to_sync(self.channel_layer.group_send)(
            f"service_{service.id}", {"type": "health_check_result", "result": result}
        )

    def broadcast_new_alert(self, alert: Alert):
        """Broadcast new alert"""
        if not self.channel_layer:
            return

        alert_data = {
            "id": alert.id,
            "alert_rule_id": alert.alert_rule.id,
            "alert_rule_name": alert.alert_rule.name,
            "service_id": alert.service.id,
            "service_name": alert.service.name,
            "status": alert.status,
            "title": alert.title,
            "message": alert.message,
            "severity": alert.alert_rule.severity,
            "metadata": alert.metadata,
            "triggered_at": alert.triggered_at.isoformat(),
        }

        async_to_sync(self.channel_layer.group_send)(
            "alerts", {"type": "new_alert", "alert": alert_data}
        )

    def broadcast_alert_resolved(self, alert: Alert):
        """Broadcast alert resolution"""
        if not self.channel_layer:
            return

        async_to_sync(self.channel_layer.group_send)(
            "alerts", {"type": "alert_resolved", "alert_id": alert.id}
        )


# Global instance
event_broadcaster = EventBroadcaster()
