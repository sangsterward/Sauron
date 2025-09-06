import json
import logging

from alerts.models import Alert
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from events.models import Event
from services.models import Service

logger = logging.getLogger(__name__)


class ServiceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "services"

        # Check authentication
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

        # Send initial data
        services = await self.get_services()
        await self.send(
            text_data=json.dumps({"type": "initial_data", "services": services})
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "ping":
                await self.send(
                    text_data=json.dumps(
                        {"type": "pong", "timestamp": data.get("timestamp")}
                    )
                )
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Invalid JSON"})
            )

    async def service_update(self, event):
        """Handle service update messages"""
        await self.send(
            text_data=json.dumps(
                {"type": "service_update", "service": event["service"]}
            )
        )

    async def service_status_change(self, event):
        """Handle service status change messages"""
        await self.send(
            text_data=json.dumps(
                {
                    "type": "status_change",
                    "service_id": event["service_id"],
                    "old_status": event["old_status"],
                    "new_status": event["new_status"],
                    "timestamp": event["timestamp"],
                }
            )
        )

    @database_sync_to_async
    def get_services(self):
        """Get all services"""
        services = Service.objects.all()
        return [
            {
                "id": service.id,
                "name": service.name,
                "service_type": service.service_type,
                "status": service.status,
                "last_checked": (
                    service.last_check.isoformat() if service.last_check else None
                ),
                "is_healthy": service.status == "healthy",
            }
            for service in services
        ]


class ServiceDetailConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.service_id = self.scope["url_route"]["kwargs"]["service_id"]
        self.group_name = f"service_{self.service_id}"

        # Check authentication
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return

        # Verify service exists
        service = await self.get_service()
        if not service:
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

        # Send initial service data
        service_data = await self.get_service_data()
        await self.send(
            text_data=json.dumps({"type": "initial_data", "service": service_data})
        )

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "get_logs":
                logs = await self.get_service_logs()
                await self.send(text_data=json.dumps({"type": "logs", "logs": logs}))
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Invalid JSON"})
            )

    async def service_update(self, event):
        """Handle service update messages"""
        await self.send(
            text_data=json.dumps(
                {"type": "service_update", "service": event["service"]}
            )
        )

    async def health_check_result(self, event):
        """Handle health check result messages"""
        await self.send(
            text_data=json.dumps(
                {"type": "health_check_result", "result": event["result"]}
            )
        )

    @database_sync_to_async
    def get_service(self):
        """Get service by ID"""
        try:
            return Service.objects.get(id=self.service_id)
        except Service.DoesNotExist:
            return None

    @database_sync_to_async
    def get_service_data(self):
        """Get detailed service data"""
        try:
            service = Service.objects.get(id=self.service_id)
            return {
                "id": service.id,
                "name": service.name,
                "description": service.description,
                "service_type": service.service_type,
                "status": service.status,
                "container_name": service.container_name,
                "image_name": service.image_name,
                "endpoint_url": service.endpoint_url,
                "port": service.port,
                "check_interval": service.check_interval,
                "tags": service.tags,
                "metadata": service.metadata,
                "created_at": service.created_at.isoformat(),
                "updated_at": service.updated_at.isoformat(),
                "last_checked": (
                    service.last_check.isoformat() if service.last_check else None
                ),
                "is_healthy": service.status == "healthy",
            }
        except Service.DoesNotExist:
            return None

    @database_sync_to_async
    def get_service_logs(self):
        """Get service logs"""
        try:
            service = Service.objects.get(id=self.service_id)
            if service.service_type == "docker" and service.container_name:
                from services.docker_service import docker_service

                return docker_service.get_container_logs(
                    service.container_name, tail=100
                )
            return "Logs not available for this service type"
        except Service.DoesNotExist:
            return "Service not found"


class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "events"

        # Check authentication
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "subscribe_service":
                service_id = data.get("service_id")
                if service_id:
                    await self.channel_layer.group_add(
                        f"events_service_{service_id}", self.channel_name
                    )
        except json.JSONDecodeError:
            await self.send(
                text_data=json.dumps({"type": "error", "message": "Invalid JSON"})
            )

    async def new_event(self, event):
        """Handle new event messages"""
        await self.send(
            text_data=json.dumps({"type": "new_event", "event": event["event"]})
        )


class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "alerts"

        # Check authentication
        if self.scope["user"] == AnonymousUser():
            await self.close()
            return

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def new_alert(self, event):
        """Handle new alert messages"""
        await self.send(
            text_data=json.dumps({"type": "new_alert", "alert": event["alert"]})
        )

    async def alert_resolved(self, event):
        """Handle alert resolved messages"""
        await self.send(
            text_data=json.dumps(
                {"type": "alert_resolved", "alert_id": event["alert_id"]}
            )
        )
