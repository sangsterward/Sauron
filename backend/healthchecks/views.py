from rest_framework import permissions
from rest_framework import viewsets

from .models import HealthCheck
from .serializers import HealthCheckSerializer


class HealthCheckViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HealthCheck.objects.all()
    serializer_class = HealthCheckSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return HealthCheck.objects.filter(
            service__created_by=self.request.user
        ).select_related("service")
