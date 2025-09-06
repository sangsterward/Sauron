import logging
from typing import Dict
from typing import List

from django.contrib.auth.models import User

from .docker_service import docker_service
from .models import Service

logger = logging.getLogger(__name__)


class ServiceDiscovery:
    def __init__(self):
        self.docker_service = docker_service

    def discover_docker_services(self) -> List[Dict]:
        """Discover services from running Docker containers"""
        if not self.docker_service.is_available():
            return []

        containers = self.docker_service.list_containers()
        discovered_services = []

        for container in containers:
            # Skip system containers
            if self._is_system_container(container):
                continue

            service_info = {
                "name": container["name"],
                "service_type": "docker",
                "container_name": container["name"],
                "image_name": container["image"],
                "status": self._map_docker_status(container["status"]),
                "labels": container["labels"],
                "ports": container["ports"],
            }
            discovered_services.append(service_info)

        return discovered_services

    def _is_system_container(self, container: Dict) -> bool:
        """Check if container is a system container"""
        labels = container.get("labels", {})

        # Skip containers with system labels
        system_labels = [
            "com.docker.compose.project",
            "com.docker.compose.service",
            "com.docker.stack.namespace",
        ]

        for label in system_labels:
            if label in labels:
                return True

        # Skip containers with system names
        system_names = ["docker", "containerd", "k8s"]
        container_name = container["name"].lower()

        for system_name in system_names:
            if system_name in container_name:
                return True

        return False

    def _map_docker_status(self, docker_status: str) -> str:
        """Map Docker status to our service status"""
        status_mapping = {
            "running": "healthy",
            "exited": "unhealthy",
            "paused": "maintenance",
            "restarting": "unknown",
        }
        return status_mapping.get(docker_status, "unknown")

    def sync_discovered_services(self, user: User) -> List[Service]:
        """Sync discovered services with database"""
        discovered_services = self.discover_docker_services()
        synced_services = []

        for service_info in discovered_services:
            service, created = Service.objects.get_or_create(
                name=service_info["name"],
                defaults={
                    "service_type": service_info["service_type"],
                    "config": {
                        "container_name": service_info["container_name"],
                        "image_name": service_info["image_name"],
                    },
                    "status": service_info["status"],
                    "tags": list(service_info["labels"].keys()),
                    "metadata": {
                        "discovered": True,
                        "labels": service_info["labels"],
                        "ports": service_info["ports"],
                    },
                    "created_by": user,
                },
            )

            if not created:
                # Update existing service
                service.status = service_info["status"]
                service.metadata.update(
                    {
                        "labels": service_info["labels"],
                        "ports": service_info["ports"],
                    }
                )
                service.save()

            synced_services.append(service)

        return synced_services


# Global instance
service_discovery = ServiceDiscovery()
