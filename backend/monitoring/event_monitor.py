import logging
import threading
import time
from typing import Any
from typing import Callable
from typing import Dict

import docker
from django.conf import settings
from events.models import Event
from services.docker_service import docker_service
from services.models import Service

from .broadcast import event_broadcaster

logger = logging.getLogger(__name__)


class DockerEventMonitor:
    def __init__(self):
        self.client = None
        self.monitoring = False
        self.event_handlers = []
        self.monitor_thread = None

    def add_event_handler(self, handler: Callable[[Dict[str, Any]], None]):
        """Add an event handler function"""
        self.event_handlers.append(handler)

    def start_monitoring(self):
        """Start monitoring Docker events"""
        if self.monitoring:
            return

        if not docker_service.is_available():
            logger.error("Docker service not available")
            return

        # For now, we'll skip event monitoring since it requires Docker SDK
        # In a production environment, you might want to implement this differently
        logger.warning("Docker event monitoring requires Docker SDK - skipping for now")
        return

        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_events, daemon=True)
        self.monitor_thread.start()
        logger.info("Started Docker event monitoring")

    def stop_monitoring(self):
        """Stop monitoring Docker events"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join(timeout=5)
        logger.info("Stopped Docker event monitoring")

    def _monitor_events(self):
        """Monitor Docker events in a separate thread"""
        try:
            for event in self.client.events(decode=True):
                if not self.monitoring:
                    break

                self._process_event(event)
        except Exception as e:
            logger.error(f"Error monitoring Docker events: {e}")

    def _process_event(self, event: Dict[str, Any]):
        """Process a Docker event"""
        try:
            # Filter relevant events
            if event.get("Type") == "container":
                event_type = event.get("Action")
                container_name = (
                    event.get("Actor", {}).get("Attributes", {}).get("name")
                )

                if container_name and event_type in ["start", "stop", "die", "restart"]:
                    processed_event = {
                        "type": event_type,
                        "container_name": container_name,
                        "container_id": event.get("Actor", {}).get("ID"),
                        "timestamp": event.get("time"),
                        "raw_event": event,
                    }

                    # Update service status
                    self._update_service_status(container_name, event_type)

                    # Notify all handlers
                    for handler in self.event_handlers:
                        try:
                            handler(processed_event)
                        except Exception as e:
                            logger.error(f"Error in event handler: {e}")
        except Exception as e:
            logger.error(f"Error processing Docker event: {e}")

    def _update_service_status(self, container_name: str, event_type: str):
        """Update service status based on Docker event"""
        try:
            service = Service.objects.get(
                container_name=container_name, service_type="docker"
            )

            old_status = service.status

            # Map Docker events to service status
            status_mapping = {
                "start": "healthy",
                "stop": "unhealthy",
                "die": "unhealthy",
                "restart": "healthy",
            }

            new_status = status_mapping.get(event_type, service.status)
            service.status = new_status
            service.save()

            # Create event
            event = Event.objects.create(
                service=service,
                event_type=f"service_{event_type}",
                severity="info",
                title=f"Container {event_type.title()}",
                message=f"Docker container {container_name} {event_type}",
                metadata={"docker_event": event_type},
            )

            # Broadcast updates
            event_broadcaster.broadcast_service_update(service)
            event_broadcaster.broadcast_new_event(event)

            if old_status != new_status:
                event_broadcaster.broadcast_service_status_change(
                    service, old_status, new_status
                )

        except Service.DoesNotExist:
            logger.warning(f"Service not found for container: {container_name}")
        except Exception as e:
            logger.error(f"Error updating service status: {e}")


# Global instance
event_monitor = DockerEventMonitor()
