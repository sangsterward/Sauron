from django.contrib.auth.models import User
from django.core.management.base import BaseCommand
from services.service_discovery import service_discovery


class Command(BaseCommand):
    help = "Discover services from Docker containers"

    def handle(self, *args, **options):
        try:
            # Use first superuser or create one
            user = User.objects.filter(is_superuser=True).first()
            if not user:
                user = User.objects.create_superuser(
                    username="admin", email="admin@example.com", password="admin"
                )

            synced_services = service_discovery.sync_discovered_services(user)

            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully discovered {len(synced_services)} services"
                )
            )

            for service in synced_services:
                self.stdout.write(f"  - {service.name} ({service.service_type})")

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error discovering services: {e}"))
