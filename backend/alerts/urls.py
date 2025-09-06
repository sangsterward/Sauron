from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AlertHistoryViewSet
from .views import AlertViewSet
from .views import NotificationChannelViewSet

router = DefaultRouter()
router.register(r"alerts", AlertViewSet)
router.register(r"alert-history", AlertHistoryViewSet)
router.register(r"notification-channels", NotificationChannelViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
