from django.contrib.auth.models import User
from django.db import models


class ServerMetrics(models.Model):
    """Server usage metrics"""

    timestamp = models.DateTimeField(auto_now_add=True)
    cpu_percent = models.FloatField(help_text="CPU usage percentage")
    memory_percent = models.FloatField(help_text="Memory usage percentage")
    memory_used_mb = models.FloatField(help_text="Memory used in MB")
    memory_total_mb = models.FloatField(help_text="Total memory in MB")
    disk_percent = models.FloatField(help_text="Disk usage percentage")
    disk_used_gb = models.FloatField(help_text="Disk used in GB")
    disk_total_gb = models.FloatField(help_text="Total disk space in GB")
    network_rx_mb = models.FloatField(help_text="Network received in MB")
    network_tx_mb = models.FloatField(help_text="Network transmitted in MB")
    load_average_1m = models.FloatField(help_text="1-minute load average")
    load_average_5m = models.FloatField(help_text="5-minute load average")
    load_average_15m = models.FloatField(help_text="15-minute load average")

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Server Metrics"
        verbose_name_plural = "Server Metrics"

    def __str__(self):
        return f"Server Metrics - {self.timestamp}"


class DockerMetrics(models.Model):
    """Docker container metrics"""

    container_id = models.CharField(max_length=64)
    container_name = models.CharField(max_length=255)
    timestamp = models.DateTimeField(auto_now_add=True)
    cpu_percent = models.FloatField(help_text="CPU usage percentage")
    memory_usage_mb = models.FloatField(help_text="Memory usage in MB")
    memory_limit_mb = models.FloatField(help_text="Memory limit in MB")
    network_rx_mb = models.FloatField(help_text="Network received in MB")
    network_tx_mb = models.FloatField(help_text="Network transmitted in MB")
    block_read_mb = models.FloatField(help_text="Block read in MB")
    block_write_mb = models.FloatField(help_text="Block write in MB")

    class Meta:
        ordering = ["-timestamp"]
        verbose_name = "Docker Metrics"
        verbose_name_plural = "Docker Metrics"
        indexes = [
            models.Index(fields=["container_id", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"{self.container_name} - {self.timestamp}"
