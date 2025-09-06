from unittest.mock import MagicMock
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .docker_service import DockerService
from .models import Service
from .service_discovery import ServiceDiscovery


class ServiceModelTest(TestCase):
    """Test the Service model functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )

    def test_service_creation(self):
        """Test creating a service with all enhanced fields"""
        service = Service.objects.create(
            name="Test Service",
            description="A test service",
            service_type="http",
            config={"url": "https://example.com", "method": "GET"},
            check_interval=30,
            timeout=10,
            retry_count=2,
            enabled=True,
            tags=["web", "test"],
            metadata={"environment": "development"},
            created_by=self.user,
        )

        self.assertEqual(service.name, "Test Service")
        self.assertEqual(service.service_type, "http")
        self.assertEqual(service.check_interval, 30)
        self.assertEqual(service.timeout, 10)
        self.assertEqual(service.retry_count, 2)
        self.assertTrue(service.enabled)
        self.assertEqual(service.tags, ["web", "test"])
        self.assertEqual(service.metadata, {"environment": "development"})
        self.assertEqual(service.status, "unknown")
        self.assertEqual(service.created_by, self.user)

    def test_service_default_values(self):
        """Test default values for service fields"""
        service = Service.objects.create(
            name="Default Service", service_type="docker", created_by=self.user
        )

        self.assertEqual(service.check_interval, 60)  # Default value
        self.assertEqual(service.timeout, 30)  # Default value
        self.assertEqual(service.retry_count, 3)  # Default value
        self.assertTrue(service.enabled)  # Default value
        self.assertEqual(service.tags, [])  # Default value
        self.assertEqual(service.metadata, {})  # Default value
        self.assertEqual(service.status, "unknown")  # Default value

    def test_service_status_choices(self):
        """Test all service status choices"""
        service = Service.objects.create(
            name="Status Test Service", service_type="http", created_by=self.user
        )

        # Test all status choices
        status_choices = [
            "healthy",
            "unhealthy",
            "unknown",
            "starting",
            "stopping",
            "restarting",
        ]

        for status_choice in status_choices:
            service.status = status_choice
            service.save()
            service.refresh_from_db()
            self.assertEqual(service.status, status_choice)

    def test_service_string_representation(self):
        """Test service string representation"""
        service = Service.objects.create(
            name="String Test Service", service_type="http", created_by=self.user
        )
        self.assertEqual(str(service), "String Test Service")

    def test_service_ordering(self):
        """Test service ordering by name"""
        service1 = Service.objects.create(
            name="Z Service", service_type="http", created_by=self.user
        )
        service2 = Service.objects.create(
            name="A Service", service_type="http", created_by=self.user
        )

        services = Service.objects.all()
        self.assertEqual(services[0], service2)  # A Service should come first
        self.assertEqual(services[1], service1)  # Z Service should come second


class ServiceAPITest(APITestCase):
    """Test the Service API endpoints"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_create_service(self):
        """Test creating a service via API"""
        data = {
            "name": "API Test Service",
            "description": "A service created via API",
            "service_type": "http",
            "config": {"url": "https://api.example.com", "method": "GET"},
            "check_interval": 45,
            "timeout": 15,
            "retry_count": 3,
            "enabled": True,
            "tags": ["api", "test"],
            "metadata": {"version": "1.0"},
        }

        response = self.client.post("/api/v1/services/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        service = Service.objects.get(name="API Test Service")
        self.assertEqual(service.check_interval, 45)
        self.assertEqual(service.timeout, 15)
        self.assertEqual(service.tags, ["api", "test"])
        self.assertEqual(service.metadata, {"version": "1.0"})
        self.assertEqual(service.created_by, self.user)

    def test_list_services(self):
        """Test listing services via API"""
        # Create test services
        Service.objects.create(
            name="Service 1", service_type="http", created_by=self.user
        )
        Service.objects.create(
            name="Service 2", service_type="docker", created_by=self.user
        )

        response = self.client.get("/api/v1/services/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_retrieve_service(self):
        """Test retrieving a specific service via API"""
        service = Service.objects.create(
            name="Retrieve Test Service",
            service_type="http",
            check_interval=60,
            tags=["test"],
            created_by=self.user,
        )

        response = self.client.get(f"/api/v1/services/{service.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Retrieve Test Service")
        self.assertEqual(response.data["check_interval"], 60)
        self.assertEqual(response.data["tags"], ["test"])

    def test_update_service(self):
        """Test updating a service via API"""
        service = Service.objects.create(
            name="Update Test Service",
            service_type="http",
            check_interval=30,
            created_by=self.user,
        )

        data = {
            "name": "Updated Service",
            "check_interval": 120,
            "tags": ["updated", "test"],
        }

        response = self.client.patch(
            f"/api/v1/services/{service.id}/", data, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        service.refresh_from_db()
        self.assertEqual(service.name, "Updated Service")
        self.assertEqual(service.check_interval, 120)
        self.assertEqual(service.tags, ["updated", "test"])

    def test_service_action_endpoints(self):
        """Test service action endpoints"""
        service = Service.objects.create(
            name="Action Test Service", service_type="http", created_by=self.user
        )

        # Test check_health action
        response = self.client.post(f"/api/v1/services/{service.id}/check_health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Health check triggered", response.data["message"])

        # Test start action
        response = self.client.post(f"/api/v1/services/{service.id}/start/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("started", response.data["message"])

        # Test stop action
        response = self.client.post(f"/api/v1/services/{service.id}/stop/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("stopped", response.data["message"])

        # Test restart action
        response = self.client.post(f"/api/v1/services/{service.id}/restart/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("restarted", response.data["message"])

    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access services"""
        self.client.credentials()  # Remove authentication

        response = self.client.get("/api/v1/services/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_isolation(self):
        """Test that users only see their own services"""
        other_user = User.objects.create_user(
            username="otheruser", email="other@example.com", password="otherpass123"
        )

        # Create service for other user
        Service.objects.create(
            name="Other User Service", service_type="http", created_by=other_user
        )

        # Create service for current user
        Service.objects.create(
            name="My Service", service_type="http", created_by=self.user
        )

        response = self.client.get("/api/v1/services/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["name"], "My Service")

    @patch("services.views.docker_service")
    def test_docker_containers_endpoint(self, mock_docker_service):
        """Test Docker containers endpoint"""
        mock_docker_service.is_available.return_value = True
        mock_docker_service.list_containers.return_value = [
            {
                "id": "test-id",
                "name": "test-container",
                "image": "nginx:latest",
                "status": "running",
            }
        ]

        response = self.client.get("/api/v1/services/docker_containers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["docker_available"])
        self.assertEqual(len(response.data["containers"]), 1)

    @patch("services.views.service_discovery")
    def test_discover_services_endpoint(self, mock_discovery):
        """Test discover services endpoint"""
        mock_discovery.sync_discovered_services.return_value = []

        response = self.client.post("/api/v1/services/discover_services/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["discovered_count"], 0)

    def test_service_stats_endpoint(self):
        """Test service statistics endpoint"""
        # Clear existing services first
        Service.objects.filter(created_by=self.user).delete()

        # Create services with different statuses
        Service.objects.create(
            name="healthy-service",
            service_type="docker",
            status="healthy",
            created_by=self.user,
        )
        Service.objects.create(
            name="unhealthy-service",
            service_type="docker",
            status="unhealthy",
            created_by=self.user,
        )
        Service.objects.create(
            name="unknown-service",
            service_type="http",
            status="unknown",
            created_by=self.user,
        )

        response = self.client.get("/api/v1/services/stats/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_services"], 3)
        self.assertEqual(response.data["healthy_services"], 1)
        self.assertEqual(response.data["unhealthy_services"], 1)
        self.assertEqual(response.data["unknown_services"], 1)


class DockerServiceTest(TestCase):
    """Test Docker service functionality"""

    def setUp(self):
        """Set up test data"""
        self.docker_service = DockerService()

    @patch("subprocess.run")
    def test_is_available_success(self, mock_run):
        """Test Docker availability check success"""
        mock_result = Mock()
        mock_result.returncode = 0
        mock_run.return_value = mock_result
        result = self.docker_service.is_available()
        self.assertTrue(result)

    @patch("subprocess.run")
    def test_is_available_failure(self, mock_run):
        """Test Docker availability check failure"""
        mock_result = Mock()
        mock_result.returncode = 1
        mock_run.return_value = mock_result
        result = self.docker_service.is_available()
        self.assertFalse(result)

    @patch("subprocess.run")
    def test_list_containers(self, mock_run):
        """Test listing Docker containers"""
        mock_result = Mock()
        mock_result.returncode = 0
        mock_result.stdout = '[{"Id": "test-id", "Name": "/test-container", "State": {"Status": "running"}, "Config": {"Image": "nginx:latest"}, "Created": "2023-01-01T00:00:00Z", "NetworkSettings": {"Ports": {}}, "RestartCount": 0}]'
        mock_run.return_value = mock_result

        result = self.docker_service.list_containers()
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]["id"], "test-id")

    @patch("subprocess.run")
    def test_get_container_info(self, mock_run):
        """Test getting container information"""
        mock_result = Mock()
        mock_result.returncode = 0
        mock_result.stdout = '{"Id": "test-id", "State": {"Status": "running"}, "Config": {"Image": "nginx:latest"}, "Created": "2023-01-01T00:00:00Z", "NetworkSettings": {"Ports": {}}, "RestartCount": 0}'
        mock_run.return_value = mock_result

        result = self.docker_service.get_container_info("test-container")
        self.assertEqual(result["status"], "running")

    @patch("subprocess.run")
    def test_start_container(self, mock_run):
        """Test starting a container"""
        mock_result = Mock()
        mock_result.returncode = 0
        mock_run.return_value = mock_result
        result = self.docker_service.start_container("test-container")
        self.assertTrue(result)

    @patch("subprocess.run")
    def test_stop_container(self, mock_run):
        """Test stopping a container"""
        mock_result = Mock()
        mock_result.returncode = 0
        mock_run.return_value = mock_result
        result = self.docker_service.stop_container("test-container")
        self.assertTrue(result)


class ServiceDiscoveryTest(TestCase):
    """Test service discovery functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username="testuser", email="test@example.com", password="testpass123"
        )
        self.discovery = ServiceDiscovery()

    @patch("services.service_discovery.docker_service")
    def test_sync_discovered_services(self, mock_docker_service):
        """Test syncing discovered services"""
        mock_docker_service.is_available.return_value = True
        mock_docker_service.list_containers.return_value = [
            {
                "id": "test-id",
                "name": "test-container",
                "image": "nginx:latest",
                "status": "running",
            }
        ]

        result = self.discovery.sync_discovered_services(self.user)
        self.assertEqual(len(result), 1)

        # Check if service was created
        service = Service.objects.get(config__contains="test-container")
        self.assertEqual(service.name, "test-container")
        self.assertEqual(service.service_type, "docker")

    @patch("services.service_discovery.docker_service")
    def test_sync_discovered_services_docker_unavailable(self, mock_docker_service):
        """Test syncing when Docker is unavailable"""
        mock_docker_service.is_available.return_value = False

        result = self.discovery.sync_discovered_services(self.user)
        self.assertEqual(len(result), 0)

    @patch("services.service_discovery.docker_service")
    def test_sync_discovered_services_existing_service(self, mock_docker_service):
        """Test syncing when service already exists"""
        # Create existing service
        Service.objects.create(
            name="existing-service",
            service_type="docker",
            config={"container_name": "test-container"},
            created_by=self.user,
        )

        mock_docker_service.is_available.return_value = True
        mock_docker_service.list_containers.return_value = [
            {
                "id": "test-id",
                "name": "test-container",
                "image": "nginx:latest",
                "status": "running",
            }
        ]

        result = self.discovery.sync_discovered_services(self.user)
        self.assertEqual(len(result), 0)  # No new services created
        self.assertEqual(Service.objects.count(), 1)  # Still only one service
