from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/services/$", consumers.ServiceConsumer.as_asgi()),
    re_path(
        r"ws/services/(?P<service_id>\w+)/$", consumers.ServiceDetailConsumer.as_asgi()
    ),
    re_path(r"ws/events/$", consumers.EventConsumer.as_asgi()),
    re_path(r"ws/alerts/$", consumers.AlertConsumer.as_asgi()),
]
