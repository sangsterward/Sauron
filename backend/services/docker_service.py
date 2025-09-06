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

    def _format_ports(self, ports: List[Dict]) -> List[str]:
        """Format Docker ports for frontend display"""
        formatted_ports = []
        for port in ports:
            # Handle different port formats from Docker API
            if isinstance(port, dict):
                # Format: {"IP": "0.0.0.0", "PrivatePort": 80, "PublicPort": 8080, "Type": "tcp"}
                if port.get("PublicPort") and port.get("PrivatePort"):
                    formatted_ports.append(f"{port['PublicPort']}:{port['PrivatePort']}")
                # Format: {"PrivatePort": 80, "Type": "tcp"} (no public port)
                elif port.get("PrivatePort"):
                    formatted_ports.append(f"{port['PrivatePort']}:{port['PrivatePort']}")
            elif isinstance(port, str):
                # Format: "80/tcp" or "0.0.0.0:8080->80/tcp"
                if "->" in port:
                    # Extract from "0.0.0.0:8080->80/tcp" format
                    parts = port.split("->")
                    if len(parts) == 2:
                        public_part = parts[0].split(":")[-1]  # Get port from "0.0.0.0:8080"
                        private_part = parts[1].split("/")[0]  # Get port from "80/tcp"
                        formatted_ports.append(f"{public_part}:{private_part}")
                else:
                    # Format: "80/tcp" (no public port)
                    port_num = port.split("/")[0]
                    formatted_ports.append(f"{port_num}:{port_num}")
        return formatted_ports

    def list_containers(self, all_containers: bool = False) -> List[Dict]:
        """List all containers"""
        if not self.is_available():
            return []

        try:
            if self.client:
                # Use Docker SDK
                containers = self.client.containers(all=all_containers)
                result_containers = []
                for container in containers:
                    container_id = container["Id"]
                    # Get detailed port information
                    ports = self.get_container_ports(container_id)
                    
                    result_containers.append({
                        "id": container_id,
                        "name": (
                            container["Names"][0][1:]
                            if container["Names"]
                            else container_id[:12]
                        ),
                        "image": container["Image"],
                        "status": container["State"],
                        "state": container,
                        "labels": container.get("Labels", {}),
                        "ports": ports,
                        "created": container["Created"],
                    })
                return result_containers
            elif self.use_subprocess:
                # Use subprocess with better port information
                cmd = ["docker", "ps", "--format", "table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"]
                if all_containers:
                    cmd.append("-a")

                result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)
                if result.returncode != 0:
                    logger.error(f"Subprocess failed: {result.stderr}")
                    return []

                containers = []
                lines = result.stdout.strip().split("\n")
                if len(lines) <= 1:  # Only header or empty
                    return containers
                
                # Skip header line
                for line in lines[1:]:
                    if line.strip():
                        # Split by multiple spaces/tabs and clean up
                        parts = [part.strip() for part in line.split() if part.strip()]
                        if len(parts) >= 4:
                            container_id = parts[0]
                            name = parts[1]
                            image = parts[2]
                            
                            # Status might be multiple words, find where ports start
                            status_parts = []
                            ports_str = ""
                            
                            # Look for port patterns to separate status from ports
                            for i, part in enumerate(parts[3:], 3):
                                if "/tcp" in part or "/udp" in part or "->" in part or ":" in part:
                                    # Found ports, everything before this is status
                                    status_parts = parts[3:i]
                                    ports_str = " ".join(parts[i:])
                                    break
                                else:
                                    status_parts.append(part)
                            
                            status = " ".join(status_parts).lower()
                            
                            # Parse ports from string format
                            ports = []
                            if ports_str and ports_str != "<none>":
                                # Handle multiple ports separated by commas or spaces
                                port_parts = []
                                if "," in ports_str:
                                    port_parts = [p.strip() for p in ports_str.split(",")]
                                else:
                                    port_parts = [ports_str.strip()]
                                
                                for port_part in port_parts:
                                    if "->" in port_part:
                                        # Format: "0.0.0.0:8080->80/tcp"
                                        parts = port_part.split("->")
                                        if len(parts) == 2:
                                            public_part = parts[0].split(":")[-1]
                                            private_part = parts[1].split("/")[0]
                                            ports.append(f"{public_part}:{private_part}")
                                    elif "/" in port_part:
                                        # Format: "80/tcp" (no public port)
                                        port_num = port_part.split("/")[0]
                                        ports.append(f"{port_num}:{port_num}")
                            
                            # Get detailed port information using docker inspect
                            detailed_ports = self.get_container_ports(container_id)
                            
                            containers.append(
                                {
                                    "id": container_id,
                                    "name": name,
                                    "image": image,
                                    "status": status,
                                    "state": {"Status": status},
                                    "labels": {},
                                    "ports": detailed_ports if detailed_ports else ports,
                                    "created": "",
                                }
                            )
                return containers
        except Exception as e:
            logger.error(f"Error listing containers: {e}")
            return []

    def get_container_ports(self, container_id: str) -> List[str]:
        """Get detailed port information for a specific container"""
        if not self.is_available():
            return []
        
        try:
            if self.client:
                # Use Docker SDK
                container_info = self.client.inspect_container(container_id)
                network_settings = container_info.get("NetworkSettings", {})
                ports = network_settings.get("Ports", {})
                
                formatted_ports = []
                for container_port, host_bindings in ports.items():
                    if host_bindings:
                        for binding in host_bindings:
                            host_port = binding.get("HostPort")
                            if host_port:
                                container_port_num = container_port.split("/")[0]
                                formatted_ports.append(f"{host_port}:{container_port_num}")
                    else:
                        # No host binding, just container port
                        container_port_num = container_port.split("/")[0]
                        formatted_ports.append(f"{container_port_num}:{container_port_num}")
                
                return formatted_ports
            elif self.use_subprocess:
                # Use subprocess with docker inspect
                cmd = ["docker", "inspect", container_id, "--format", "{{json .NetworkSettings.Ports}}"]
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
                
                if result.returncode == 0:
                    try:
                        ports_data = json.loads(result.stdout.strip())
                        formatted_ports = []
                        
                        for container_port, host_bindings in ports_data.items():
                            if host_bindings:
                                for binding in host_bindings:
                                    host_port = binding.get("HostPort")
                                    if host_port:
                                        container_port_num = container_port.split("/")[0]
                                        formatted_ports.append(f"{host_port}:{container_port_num}")
                            else:
                                # No host binding
                                container_port_num = container_port.split("/")[0]
                                formatted_ports.append(f"{container_port_num}:{container_port_num}")
                        
                        return formatted_ports
                    except json.JSONDecodeError:
                        pass
                
                return []
        except Exception as e:
            logger.error(f"Error getting container ports for {container_id}: {e}")
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
