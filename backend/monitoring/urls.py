from django.urls import path

from . import views

urlpatterns = [
    path(
        "monitoring/docker_status/",
        views.DockerStatusView.as_view(),
        name="docker-status",
    ),
    path(
        "monitoring/trigger_check/",
        views.TriggerCheckView.as_view(),
        name="trigger-check",
    ),
    path(
        "monitoring/test_broadcast/",
        views.TestBroadcastView.as_view(),
        name="test-broadcast",
    ),
]
