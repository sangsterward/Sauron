import json
import logging
import subprocess
from datetime import datetime
from datetime import timedelta
from typing import Dict
from typing import List
from typing import Optional

import psutil

from .models import DockerMetrics
from .models import ServerMetrics

logger = logging.getLogger(__name__)


class MetricsCollector:
    """Collects server and Docker metrics"""

    def __init__(self):
        self.last_network_stats = None
        self.last_disk_stats = None

    def collect_server_metrics(self) -> Dict:
        """Collect current server metrics"""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_used_mb = memory.used / (1024 * 1024)
            memory_total_mb = memory.total / (1024 * 1024)

            # Disk metrics
            disk = psutil.disk_usage("/")
            disk_percent = (disk.used / disk.total) * 100
            disk_used_gb = disk.used / (1024 * 1024 * 1024)
            disk_total_gb = disk.total / (1024 * 1024 * 1024)

            # Network metrics
            network_stats = self._get_network_stats()

            # Load average
            load_avg = psutil.getloadavg()

            metrics = {
                "cpu_percent": round(cpu_percent, 2),
                "memory_percent": round(memory_percent, 2),
                "memory_used_mb": round(memory_used_mb, 2),
                "memory_total_mb": round(memory_total_mb, 2),
                "disk_percent": round(disk_percent, 2),
                "disk_used_gb": round(disk_used_gb, 2),
                "disk_total_gb": round(disk_total_gb, 2),
                "network_rx_mb": network_stats["rx_mb"],
                "network_tx_mb": network_stats["tx_mb"],
                "load_average_1m": round(load_avg[0], 2),
                "load_average_5m": round(load_avg[1], 2),
                "load_average_15m": round(load_avg[2], 2),
            }

            return metrics

        except Exception as e:
            logger.error(f"Error collecting server metrics: {e}")
            return {}

    def collect_docker_metrics(self) -> List[Dict]:
        """Collect Docker container metrics"""
        try:
            # Get container stats using docker stats command
            result = subprocess.run(
                ["docker", "stats", "--no-stream", "--format", "json"],
                capture_output=True,
                text=True,
                timeout=10,
            )

            if result.returncode != 0:
                logger.warning("Docker stats command failed")
                return []

            containers = []
            for line in result.stdout.strip().split("\n"):
                if line:
                    try:
                        stats = json.loads(line)
                        container_metrics = self._parse_docker_stats(stats)
                        if container_metrics:
                            containers.append(container_metrics)
                    except json.JSONDecodeError:
                        continue

            return containers

        except Exception as e:
            logger.error(f"Error collecting Docker metrics: {e}")
            return []

    def _get_network_stats(self) -> Dict:
        """Get network statistics"""
        try:
            net_io = psutil.net_io_counters()

            if self.last_network_stats:
                # Calculate difference
                rx_diff = net_io.bytes_recv - self.last_network_stats["bytes_recv"]
                tx_diff = net_io.bytes_sent - self.last_network_stats["bytes_sent"]

                rx_mb = rx_diff / (1024 * 1024)
                tx_mb = tx_diff / (1024 * 1024)
            else:
                rx_mb = 0
                tx_mb = 0

            # Update last stats
            self.last_network_stats = {
                "bytes_recv": net_io.bytes_recv,
                "bytes_sent": net_io.bytes_sent,
            }

            return {
                "rx_mb": round(rx_mb, 2),
                "tx_mb": round(tx_mb, 2),
            }

        except Exception as e:
            logger.error(f"Error getting network stats: {e}")
            return {"rx_mb": 0, "tx_mb": 0}

    def _parse_docker_stats(self, stats: Dict) -> Optional[Dict]:
        """Parse Docker stats JSON"""
        try:
            # Extract container info
            container_id = stats.get("ID", "")[:12]  # Short ID
            container_name = stats.get("Name", "")

            # Parse CPU percentage
            cpu_percent = 0
            cpu_str = stats.get("CPUPerc", "0%")
            if cpu_str.endswith("%"):
                cpu_percent = float(cpu_str[:-1])

            # Parse memory
            memory_usage_mb = 0
            memory_limit_mb = 0
            memory_str = stats.get("MemUsage", "0B / 0B")
            if " / " in memory_str:
                usage_str, limit_str = memory_str.split(" / ")
                memory_usage_mb = self._parse_size_to_mb(usage_str)
                memory_limit_mb = self._parse_size_to_mb(limit_str)

            # Parse network
            network_rx_mb = 0
            network_tx_mb = 0
            network_str = stats.get("NetIO", "0B / 0B")
            if " / " in network_str:
                rx_str, tx_str = network_str.split(" / ")
                network_rx_mb = self._parse_size_to_mb(rx_str)
                network_tx_mb = self._parse_size_to_mb(tx_str)

            # Parse block I/O
            block_read_mb = 0
            block_write_mb = 0
            block_str = stats.get("BlockIO", "0B / 0B")
            if " / " in block_str:
                read_str, write_str = block_str.split(" / ")
                block_read_mb = self._parse_size_to_mb(read_str)
                block_write_mb = self._parse_size_to_mb(write_str)

            return {
                "container_id": container_id,
                "container_name": container_name,
                "cpu_percent": cpu_percent,
                "memory_usage_mb": memory_usage_mb,
                "memory_limit_mb": memory_limit_mb,
                "network_rx_mb": network_rx_mb,
                "network_tx_mb": network_tx_mb,
                "block_read_mb": block_read_mb,
                "block_write_mb": block_write_mb,
            }

        except Exception as e:
            logger.error(f"Error parsing Docker stats: {e}")
            return None

    def _parse_size_to_mb(self, size_str: str) -> float:
        """Parse size string to MB"""
        size_str = size_str.strip().upper()

        if size_str.endswith("KB"):
            return float(size_str[:-2]) / 1024
        elif size_str.endswith("MB"):
            return float(size_str[:-2])
        elif size_str.endswith("MIB"):  # Handle "MiB" suffix (mebibytes)
            return float(size_str[:-3])
        elif size_str.endswith("MI"):  # Handle "MI" suffix (megabytes)
            return float(size_str[:-2])
        elif size_str.endswith("GB"):
            return float(size_str[:-2]) * 1024
        elif size_str.endswith("GIB"):  # Handle "GiB" suffix (gibibytes)
            return float(size_str[:-3]) * 1024
        elif size_str.endswith("GI"):  # Handle "GI" suffix (gigabytes)
            return float(size_str[:-2]) * 1024
        elif size_str.endswith("TB"):
            return float(size_str[:-2]) * 1024 * 1024
        elif size_str.endswith("B"):
            return float(size_str[:-1]) / (1024 * 1024)
        else:
            # Assume bytes if no unit
            try:
                return float(size_str) / (1024 * 1024)
            except ValueError:
                logger.warning(f"Could not parse size string: {size_str}")
                return 0.0

    def save_server_metrics(self, metrics: Dict) -> ServerMetrics:
        """Save server metrics to database"""
        return ServerMetrics.objects.create(**metrics)

    def save_docker_metrics(self, metrics_list: List[Dict]) -> List[DockerMetrics]:
        """Save Docker metrics to database"""
        saved_metrics = []
        for metrics in metrics_list:
            saved_metrics.append(DockerMetrics.objects.create(**metrics))
        return saved_metrics

    def get_recent_server_metrics(self, hours: int = 1) -> List[ServerMetrics]:
        """Get recent server metrics"""
        since = datetime.now() - timedelta(hours=hours)
        return ServerMetrics.objects.filter(timestamp__gte=since)

    def get_recent_docker_metrics(
        self, container_id: str = None, hours: int = 1
    ) -> List[DockerMetrics]:
        """Get recent Docker metrics"""
        since = datetime.now() - timedelta(hours=hours)
        queryset = DockerMetrics.objects.filter(timestamp__gte=since)

        if container_id:
            queryset = queryset.filter(container_id=container_id)

        return queryset


# Global instance
metrics_collector = MetricsCollector()
