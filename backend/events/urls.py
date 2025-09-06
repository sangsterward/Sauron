from django.urls import include
from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import EventViewSet

router = DefaultRouter()
router.register(r"events", EventViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
