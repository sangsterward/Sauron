import time

from django.core.cache import cache
from django.db import connection
from django.http import JsonResponse
from services.docker_service import docker_service


def health_check(request):
    """Comprehensive health check endpoint"""
    checks = {
        "database": check_database(),
        "redis": check_redis(),
        "docker": check_docker(),
    }

    overall_status = "healthy" if all(checks.values()) else "unhealthy"

    return JsonResponse(
        {"status": overall_status, "checks": checks, "timestamp": time.time()}
    )


def check_database():
    """Check database connectivity"""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return True
    except Exception:
        return False


def check_redis():
    """Check Redis connectivity"""
    try:
        cache.set("health_check", "ok", 10)
        return cache.get("health_check") == "ok"
    except Exception:
        return False


def check_docker():
    """Check Docker connectivity"""
    try:
        return docker_service.is_available()
    except Exception:
        return False
