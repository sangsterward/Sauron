from django.db.models import Count
from django.db.models import Q
from rest_framework import permissions
from rest_framework import status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .docker_service import docker_service
from .models import Service
from .serializers import ServiceSerializer
from .service_discovery import service_discovery


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Service.objects.filter(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def check_health(self, request, pk=None):
        """Manually trigger a health check for a service"""
        service = self.get_object()
        # TODO: Implement health check logic
        return Response({"message": f"Health check triggered for {service.name}"})

    @action(detail=True, methods=["post"])
    def start(self, request, pk=None):
        """Start a service"""
        service = self.get_object()
        # TODO: Implement service start logic
        return Response({"message": f"Service {service.name} started"})

    @action(detail=True, methods=["post"])
    def stop(self, request, pk=None):
        """Stop a service"""
        service = self.get_object()
        # TODO: Implement service stop logic
        return Response({"message": f"Service {service.name} stopped"})

    @action(detail=True, methods=["post"])
    def restart(self, request, pk=None):
        """Restart a service"""
        service = self.get_object()
        # TODO: Implement service restart logic
        return Response({"message": f"Service {service.name} restarted"})

    @action(detail=False, methods=["get"])
    def health(self, request):
        """API health check"""
        return Response(
            {"status": "healthy", "message": "Home Hub Monitor API is running"}
        )

    @action(detail=False, methods=["get"])
    def stats(self, request):
        """Get service statistics"""
        total_services = Service.objects.count()
        healthy_services = Service.objects.filter(status="healthy").count()

        return Response(
            {
                "total_services": total_services,
                "healthy_services": healthy_services,
                "unhealthy_services": total_services - healthy_services,
                "service_types": dict(
                    Service.objects.values_list("service_type").annotate(
                        count=Count("id")
                    )
                ),
            }
        )

    @action(detail=False, methods=["get"])
    def docker_containers(self, request):
        """List Docker containers"""
        containers = docker_service.list_containers()
        return Response(
            {
                "containers": containers,
                "docker_available": docker_service.is_available(),
            }
        )

    @action(detail=False, methods=["post"])
    def discover_services(self, request):
        """Discover services from Docker containers"""
        try:
            synced_services = service_discovery.sync_discovered_services(request.user)
            return Response(
                {
                    "discovered_count": len(synced_services),
                    "services": ServiceSerializer(synced_services, many=True).data,
                }
            )
        except Exception as e:
            return Response(
                {"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=["post"])
    def start_container(self, request, pk=None):
        """Start Docker container"""
        service = self.get_object()
        if service.service_type != "docker":
            return Response(
                {"error": "Service is not a Docker container"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        container_name = service.config.get("container_name")
        if not container_name:
            return Response(
                {"error": "Container name not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success = docker_service.start_container(container_name)
        if success:
            service.status = "healthy"
            service.save()
            return Response({"status": "started"})
        else:
            return Response(
                {"error": "Failed to start container"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"])
    def stop_container(self, request, pk=None):
        """Stop Docker container"""
        service = self.get_object()
        if service.service_type != "docker":
            return Response(
                {"error": "Service is not a Docker container"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        container_name = service.config.get("container_name")
        if not container_name:
            return Response(
                {"error": "Container name not configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success = docker_service.stop_container(container_name)
        if success:
            service.status = "unhealthy"
            service.save()
            return Response({"status": "stopped"})
        else:
            return Response(
                {"error": "Failed to stop container"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
