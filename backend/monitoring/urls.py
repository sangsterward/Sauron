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
    path(
        "monitoring/server_metrics/",
        views.ServerMetricsView.as_view(),
        name="server-metrics",
    ),
    path(
        "monitoring/docker_metrics/",
        views.DockerMetricsView.as_view(),
        name="docker-metrics",
    ),
    path(
        "monitoring/summary/",
        views.MetricsSummaryView.as_view(),
        name="metrics-summary",
    ),
    path(
        "monitoring/live/",
        views.LiveMetricsView.as_view(),
        name="live-metrics",
    ),
]
