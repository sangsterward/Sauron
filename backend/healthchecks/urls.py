from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import HealthCheckViewSet

router = DefaultRouter()
router.register(r"healthchecks", HealthCheckViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
