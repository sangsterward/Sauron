from rest_framework import serializers

from .models import DockerMetrics
from .models import ServerMetrics


class ServerMetricsSerializer(serializers.ModelSerializer):
    """Serializer for server metrics"""

    class Meta:
        model = ServerMetrics
        fields = [
            "id",
            "timestamp",
            "cpu_percent",
            "memory_percent",
            "memory_used_mb",
            "memory_total_mb",
            "disk_percent",
            "disk_used_gb",
            "disk_total_gb",
            "network_rx_mb",
            "network_tx_mb",
            "load_average_1m",
            "load_average_5m",
            "load_average_15m",
        ]
        read_only_fields = ["id", "timestamp"]


class DockerMetricsSerializer(serializers.ModelSerializer):
    """Serializer for Docker metrics"""

    class Meta:
        model = DockerMetrics
        fields = [
            "id",
            "container_id",
            "container_name",
            "timestamp",
            "cpu_percent",
            "memory_usage_mb",
            "memory_limit_mb",
            "network_rx_mb",
            "network_tx_mb",
            "block_read_mb",
            "block_write_mb",
        ]
        read_only_fields = ["id", "timestamp"]


class MetricsSummarySerializer(serializers.Serializer):
    """Serializer for metrics summary"""

    current_cpu = serializers.FloatField()
    current_memory = serializers.FloatField()
    current_disk = serializers.FloatField()
    current_load = serializers.FloatField()
    total_containers = serializers.IntegerField()
    running_containers = serializers.IntegerField()
    total_memory_usage = serializers.FloatField()
    total_cpu_usage = serializers.FloatField()
