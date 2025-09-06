from rest_framework import permissions
from rest_framework import viewsets

from .models import Alert
from .models import AlertHistory
from .models import NotificationChannel
from .serializers import AlertHistorySerializer
from .serializers import AlertSerializer
from .serializers import NotificationChannelSerializer


class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.all()
    serializer_class = AlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Alert.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AlertHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AlertHistory.objects.all()
    serializer_class = AlertHistorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AlertHistory.objects.filter(
            alert__created_by=self.request.user
        ).select_related("alert")


class NotificationChannelViewSet(viewsets.ModelViewSet):
    queryset = NotificationChannel.objects.all()
    serializer_class = NotificationChannelSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationChannel.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
