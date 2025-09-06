from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .broadcast import event_broadcaster


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
