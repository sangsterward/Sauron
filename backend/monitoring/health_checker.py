import logging
import socket
import subprocess
import time
from typing import Any
from typing import Dict
from typing import Optional

import requests
from django.utils import timezone
from events.models import Event
from healthchecks.models import HealthCheck
from services.docker_service import docker_service
from services.models import Service

from .broadcast import event_broadcaster

logger = logging.getLogger(__name__)


class HealthChecker:
    def __init__(self):
        self.check_methods = {
            "http": self._check_http,
            "tcp": self._check_tcp,
            "docker": self._check_docker,
            "custom": self._check_custom,
        }

    def run_check(self, service: Service) -> Dict[str, Any]:
        """Run a health check for a service and return results"""
        try:
            check_method = self.check_methods.get(service.service_type)
            if not check_method:
                return {
                    "success": False,
                    "error": f"Unknown service type: {service.service_type}",
                    "timestamp": time.time(),
                }

            result = check_method(service)

            # Store old status for broadcasting
            old_status = service.status

            # Create health check record
            health_check = HealthCheck.objects.create(
                service=service,
                status="success" if result["success"] else "failure",
                response_time=result.get("response_time"),
                message=result.get("error")
                or ("OK" if result["success"] else "Health check failed"),
                details=result,
                error_code=result.get("error_code", ""),
                http_status=result.get("status_code"),
                duration=result.get("response_time"),
            )

            # Update service status
            if result["success"]:
                service.status = "healthy"
            else:
                service.status = "unhealthy"
            service.last_check = timezone.now()
            service.save()

            # Create event
            event = self._create_event(service, result)

            # Broadcast updates
            event_broadcaster.broadcast_service_update(service)
            event_broadcaster.broadcast_health_check_result(service, result)

            if old_status != service.status:
                event_broadcaster.broadcast_service_status_change(
                    service, old_status, service.status
                )

            return result

        except Exception as e:
            logger.error(f"Error running health check for service {service.id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "timestamp": time.time(),
            }

    def _check_http(self, service: Service) -> Dict[str, Any]:
        """HTTP health check"""
        config = service.config
        url = config.get("url")
        method = config.get("method", "GET")
        timeout = service.timeout
        expected_status = config.get("expected_status", 200)

        if not url:
            return {
                "success": False,
                "error": "URL not specified in service config",
                "timestamp": time.time(),
            }

        try:
            response = requests.request(
                method=method, url=url, timeout=timeout, allow_redirects=True
            )

            success = response.status_code == expected_status

            return {
                "success": success,
                "status_code": response.status_code,
                "response_time": response.elapsed.total_seconds()
                * 1000,  # Convert to milliseconds
                "timestamp": time.time(),
                "error": (
                    None
                    if success
                    else f"Expected status {expected_status}, got {response.status_code}"
                ),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": time.time(),
            }

    def _check_tcp(self, service: Service) -> Dict[str, Any]:
        """TCP port check"""
        config = service.config
        host = config.get("host")
        port = config.get("port")
        timeout = service.timeout

        if not host or not port:
            return {
                "success": False,
                "error": "Host and port not specified in service config",
                "timestamp": time.time(),
            }

        try:
            start_time = time.time()
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()

            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            success = result == 0

            return {
                "success": success,
                "response_time": response_time,
                "timestamp": time.time(),
                "error": None if success else f"Connection failed with code {result}",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": time.time(),
            }

    def _check_docker(self, service: Service) -> Dict[str, Any]:
        """Docker container health check"""
        config = service.config
        container_name = config.get("container_name")

        if not container_name:
            return {
                "success": False,
                "error": "Container name not specified in service config",
                "timestamp": time.time(),
            }

        container_info = docker_service.get_container_info(container_name)

        if not container_info:
            return {
                "success": False,
                "error": f"Container {container_name} not found",
                "timestamp": time.time(),
            }

        status = container_info["status"]
        health_status = container_info.get("health", {}).get("Status", "unknown")

        # Consider healthy if running and health status is healthy
        success = status == "running" and health_status in ["healthy", "unknown"]

        return {
            "success": success,
            "status": status,
            "health_status": health_status,
            "timestamp": time.time(),
            "error": (
                None
                if success
                else f"Container status: {status}, health: {health_status}"
            ),
        }

    def _check_custom(self, service: Service) -> Dict[str, Any]:
        """Custom script health check"""
        config = service.config
        script_path = config.get("script_path")

        if not script_path:
            return {
                "success": False,
                "error": "Script path not specified in service config",
                "timestamp": time.time(),
            }

        try:
            start_time = time.time()
            result = subprocess.run(
                [script_path], capture_output=True, text=True, timeout=service.timeout
            )
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds

            success = result.returncode == 0

            return {
                "success": success,
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "response_time": response_time,
                "timestamp": time.time(),
                "error": (
                    None
                    if success
                    else f"Script failed with return code {result.returncode}"
                ),
            }
        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": "Script execution timed out",
                "timestamp": time.time(),
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "timestamp": time.time(),
            }

    def _create_event(self, service: Service, result: Dict[str, Any]) -> Event:
        """Create an event for the health check result"""

        event_type = (
            "health_check_success" if result["success"] else "health_check_failed"
        )
        severity = "info" if result["success"] else "warning"

        event = Event.objects.create(
            service=service,
            event_type=event_type,
            severity=severity,
            title=f"Health Check: {service.name}",
            message=f"Health check {'passed' if result['success'] else 'failed'}: {result.get('error', 'OK')}",
            metadata=result,
        )

        # Broadcast the event
        event_broadcaster.broadcast_new_event(event)

        return event


# Global instance
health_checker = HealthChecker()
