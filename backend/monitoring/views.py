from datetime import datetime
from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .broadcast import event_broadcaster
from .metrics_collector import metrics_collector
from .models import DockerMetrics
from .models import ServerMetrics
from .serializers import DockerMetricsSerializer
from .serializers import MetricsSummarySerializer
from .serializers import ServerMetricsSerializer


class DockerStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Docker daemon status"""
        from services.docker_service import docker_service

        return Response(
            {
                "docker_available": docker_service.is_available(),
                "message": "Docker integration ready",
            }
        )


class TriggerCheckView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Trigger manual health check"""
        from .health_checker import health_checker

        service_id = request.data.get("service_id")
        if not service_id:
            return Response({"error": "service_id required"}, status=400)

        try:
            from services.models import Service

            service = Service.objects.get(id=service_id)
            result = health_checker.run_check(service)
            return Response({"status": "success", "result": result})
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=404)


class TestBroadcastView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Test WebSocket broadcasting"""
        from services.models import Service

        service_id = request.data.get("service_id")
        if not service_id:
            return Response({"error": "service_id required"}, status=400)

        try:
            service = Service.objects.get(id=service_id)
            event_broadcaster.broadcast_service_update(service)
            return Response({"status": "success", "message": "Broadcast sent"})
        except Service.DoesNotExist:
            return Response({"error": "Service not found"}, status=404)


class ServerMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get server metrics"""
        hours = int(request.query_params.get("hours", 1))
        metrics = metrics_collector.get_recent_server_metrics(hours)
        serializer = ServerMetricsSerializer(metrics, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Collect and save current server metrics"""
        try:
            metrics = metrics_collector.collect_server_metrics()
            if metrics:
                saved_metrics = metrics_collector.save_server_metrics(metrics)
                serializer = ServerMetricsSerializer(saved_metrics)
                
                # Broadcast metrics update via WebSocket
                event_broadcaster.broadcast_metrics_update({
                    "type": "server_metrics",
                    "data": serializer.data,
                    "timestamp": timezone.now().isoformat()
                })
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "Failed to collect metrics"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class DockerMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get Docker container metrics"""
        container_id = request.query_params.get("container_id")
        hours = int(request.query_params.get("hours", 1))

        metrics = metrics_collector.get_recent_docker_metrics(container_id, hours)
        serializer = DockerMetricsSerializer(metrics, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Collect and save current Docker metrics"""
        try:
            metrics_list = metrics_collector.collect_docker_metrics()
            if metrics_list:
                saved_metrics = metrics_collector.save_docker_metrics(metrics_list)
                serializer = DockerMetricsSerializer(saved_metrics, many=True)
                
                # Broadcast container update via WebSocket
                from services.docker_service import docker_service
                containers = (
                    docker_service.list_containers()
                    if docker_service.is_available()
                    else []
                )
                event_broadcaster.broadcast_container_update(containers)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(
                    {"error": "Failed to collect Docker metrics"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MetricsSummaryView(APIView):
    permission_classes = []  # Allow unauthenticated access for development

    def get(self, request):
        """Get current metrics summary"""
        try:
            # Get current server metrics
            server_metrics = metrics_collector.collect_server_metrics()

            # Get Docker container count
            from services.docker_service import docker_service

            containers = (
                docker_service.list_containers()
                if docker_service.is_available()
                else []
            )

            # Calculate totals
            total_containers = len(containers)
            running_containers = len(
                [c for c in containers if c.get("status") == "running" or c.get("status", "").startswith("up")]
            )

            # Get recent Docker metrics for totals
            recent_docker_metrics = metrics_collector.get_recent_docker_metrics(hours=1)
            total_memory_usage = sum(m.memory_usage_mb for m in recent_docker_metrics)
            total_cpu_usage = sum(m.cpu_percent for m in recent_docker_metrics)

            # Calculate healthy containers (containers with "healthy" in status)
            healthy_containers = len(
                [c for c in containers if "healthy" in c.get("status", "").lower()]
            )

            # Calculate containers with exposed ports
            containers_with_ports = len(
                [c for c in containers if c.get("ports") and len(c.get("ports", [])) > 0]
            )

            summary = {
                "current_cpu": server_metrics.get("cpu_percent", 0),
                "current_memory": server_metrics.get("memory_percent", 0),
                "current_disk": server_metrics.get("disk_percent", 0),
                "current_load": server_metrics.get("load_average_1m", 0),
                "total_containers": total_containers,
                "running_containers": running_containers,
                "healthy_containers": healthy_containers,
                "containers_with_ports": containers_with_ports,
                "total_memory_usage": round(total_memory_usage, 2),
                "total_cpu_usage": round(total_cpu_usage, 2),
            }

            serializer = MetricsSummarySerializer(summary)
            return Response(serializer.data)

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LiveMetricsView(APIView):
    permission_classes = []  # Allow unauthenticated access for development

    def get(self, request):
        """Get live metrics for real-time updates"""
        try:
            # Collect current metrics
            server_metrics = metrics_collector.collect_server_metrics()
            docker_metrics = metrics_collector.collect_docker_metrics()

            # Get container list
            from services.docker_service import docker_service

            containers = (
                docker_service.list_containers()
                if docker_service.is_available()
                else []
            )

            return Response(
                {
                    "server": server_metrics,
                    "docker": docker_metrics,
                    "containers": containers,
                    "timestamp": timezone.now().isoformat(),
                }
            )

        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
