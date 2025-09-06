import json
import logging
import os
import subprocess
from typing import Dict
from typing import List
from typing import Optional

import docker
from django.conf import settings

logger = logging.getLogger(__name__)


class DockerService:
    def __init__(self):
        self.client = None
        self.use_subprocess = False
        self._connect()

    def _connect(self):
        """Connect to Docker daemon"""
        try:
            # Try Docker SDK first
            self.client = docker.APIClient(base_url="unix:///var/run/docker.sock")
            # Test connection
            self.client.version()
            logger.info("Connected to Docker daemon via SDK")
        except Exception as e:
            logger.warning(f"Docker SDK failed: {e}, falling back to subprocess")
            self.client = None
            self.use_subprocess = True
            # Test subprocess approach
            try:
                result = subprocess.run(
                    ["docker", "version", "--format", "json"],
                    capture_output=True,
                    text=True,
                    timeout=5,
                )
                if result.returncode == 0:
                    logger.info("Connected to Docker daemon via subprocess")
                else:
                    logger.error(f"Subprocess Docker test failed: {result.stderr}")
                    self.use_subprocess = False
            except Exception as subprocess_error:
                logger.error(f"Subprocess Docker test failed: {subprocess_error}")
                self.use_subprocess = False

    def is_available(self) -> bool:
        """Check if Docker is available"""
        return self.client is not None or self.use_subprocess

    def list_containers(self, all_containers: bool = False) -> List[Dict]:
        """List all containers"""
        if not self.is_available():
            return []

        try:
            if self.client:
                # Use Docker SDK
                containers = self.client.containers(all=all_containers)
                return [
                    {
                        "id": container["Id"],
                        "name": (
                            container["Names"][0][1:]
                            if container["Names"]
                            else container["Id"][:12]
                        ),
                        "image": container["Image"],
                        "status": container["State"],
                        "state": container,
                        "labels": container.get("Labels", {}),
                        "ports": container.get("Ports", []),
                        "created": container["Created"],
                    }
                    for container in containers
                ]
            elif self.use_subprocess:
                # Use subprocess
                cmd = ["docker", "ps", "--format", "json"]
                if all_containers:
                    cmd.append("-a")

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    logger.error(f"Subprocess failed: {result.stderr}")
                    return []

                containers = []
                for line in result.stdout.strip().split("\n"):
                    if line:
                        try:
                            container = json.loads(line)
                            containers.append(
                                {
                                    "id": container["ID"],
                                    "name": container["Names"],
                                    "image": container["Image"],
                                    "status": container["State"],
                                    "state": container,
                                    "labels": {},
                                    "ports": [],
                                    "created": container.get("CreatedAt", ""),
                                }
                            )
                        except json.JSONDecodeError:
                            continue
                return containers
        except Exception as e:
            logger.error(f"Error listing containers: {e}")
            return []

    def get_container_info(self, container_name: str) -> Optional[Dict]:
        """Get detailed information about a specific container"""
        if not self.is_available():
            return None

        try:
            if self.client:
                # Use Docker SDK
                container = self.client.inspect_container(container_name)
                return {
                    "id": container["Id"],
                    "name": (
                        container["Name"][1:]
                        if container["Name"]
                        else container["Id"][:12]
                    ),
                    "image": container["Config"]["Image"],
                    "status": container["State"]["Status"],
                    "state": container["State"],
                    "health": container["State"].get("Health", {}),
                    "labels": container.get("Config", {}).get("Labels", {}),
                    "ports": container.get("NetworkSettings", {}).get("Ports", {}),
                    "created": container["Created"],
                    "restart_count": container["RestartCount"],
                }
            elif self.use_subprocess:
                # Use subprocess
                result = subprocess.run(
                    ["docker", "inspect", container_name],
                    capture_output=True,
                    text=True,
                    timeout=10,
                )
                if result.returncode != 0:
                    logger.error(f"Subprocess inspect failed: {result.stderr}")
                    return None

                containers = json.loads(result.stdout)
                if not containers:
                    return None

                container = containers[0]
                return {
                    "id": container["Id"],
                    "name": (
                        container["Name"][1:]
                        if container["Name"]
                        else container["Id"][:12]
                    ),
                    "image": container["Config"]["Image"],
                    "status": container["State"]["Status"],
                    "state": container["State"],
                    "health": container["State"].get("Health", {}),
                    "labels": container.get("Config", {}).get("Labels", {}),
                    "ports": container.get("NetworkSettings", {}).get("Ports", {}),
                    "created": container["Created"],
                    "restart_count": container["RestartCount"],
                }
        except Exception as e:
            logger.error(f"Error getting container info for {container_name}: {e}")
            return None

    def get_container_logs(self, container_name: str, tail: int = 100) -> str:
        """Get container logs"""
        if not self.client:
            return ""

        try:
            logs = self.client.logs(container_name, tail=tail)
            return logs.decode("utf-8")
        except Exception as e:
            logger.error(f"Error getting logs for {container_name}: {e}")
            return ""

    def start_container(self, container_name: str) -> bool:
        """Start a container"""
        if not self.client:
            return False

        try:
            self.client.start(container_name)
            return True
        except Exception as e:
            logger.error(f"Error starting container {container_name}: {e}")
            return False

    def stop_container(self, container_name: str) -> bool:
        """Stop a container"""
        if not self.client:
            return False

        try:
            self.client.stop(container_name)
            return True
        except Exception as e:
            logger.error(f"Error stopping container {container_name}: {e}")
            return False

    def restart_container(self, container_name: str) -> bool:
        """Restart a container"""
        if not self.client:
            return False

        try:
            self.client.restart(container_name)
            return True
        except Exception as e:
            logger.error(f"Error restarting container {container_name}: {e}")
            return False


# Global instance
docker_service = DockerService()
