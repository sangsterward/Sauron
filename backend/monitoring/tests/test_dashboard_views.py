import json
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from unittest.mock import patch, MagicMock
from monitoring.models import ServerMetrics, DockerMetrics
from monitoring.metrics_collector import MetricsCollector


class DashboardViewsTestCase(APITestCase):
    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Create test server metrics
        self.server_metrics = ServerMetrics.objects.create(
            cpu_percent=25.5,
            memory_percent=60.2,
            memory_used_mb=1024,
            memory_total_mb=2048,
            disk_percent=45.8,
            disk_used_gb=50,
            disk_total_gb=100,
            network_rx_mb=10.5,
            network_tx_mb=8.2,
            load_average_1m=1.2,
            load_average_5m=1.1,
            load_average_15m=1.0
        )

    def test_server_metrics_get(self):
        """Test getting server metrics"""
        url = reverse('server-metrics')
        response = self.client.get(url, {'hours': 1})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['cpu_percent'], 25.5)
        self.assertEqual(response.data[0]['memory_percent'], 60.2)

    @patch('monitoring.views.metrics_collector')
    @patch('monitoring.views.event_broadcaster')
    def test_server_metrics_collect(self, mock_broadcaster, mock_collector):
        """Test collecting new server metrics"""
        mock_collector.collect_server_metrics.return_value = {
            'cpu_percent': 30.0,
            'memory_percent': 65.0,
            'memory_used_mb': 1200,
            'memory_total_mb': 2048,
            'disk_percent': 50.0,
            'disk_used_gb': 55,
            'disk_total_gb': 100,
            'network_rx_mb': 15.0,
            'network_tx_mb': 12.0,
            'load_average_1m': 1.5,
            'load_average_5m': 1.3,
            'load_average_15m': 1.1
        }
        
        mock_collector.save_server_metrics.return_value = self.server_metrics
        
        url = reverse('server-metrics')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['cpu_percent'], 25.5)
        
        # Verify WebSocket broadcast was called
        mock_broadcaster.broadcast_metrics_update.assert_called_once()

    def test_metrics_summary(self):
        """Test getting metrics summary"""
        url = reverse('metrics-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('current_cpu', response.data)
        self.assertIn('current_memory', response.data)
        self.assertIn('current_disk', response.data)
        self.assertIn('current_load', response.data)
        self.assertIn('total_containers', response.data)
        self.assertIn('running_containers', response.data)

    @patch('monitoring.views.metrics_collector')
    @patch('services.docker_service.docker_service')
    def test_live_metrics(self, mock_docker_service, mock_collector):
        """Test getting live metrics"""
        # Mock server metrics
        mock_collector.collect_server_metrics.return_value = {
            'cpu_percent': 30.0,
            'memory_percent': 65.0,
            'memory_used_mb': 1200,
            'memory_total_mb': 2048,
            'disk_percent': 50.0,
            'disk_used_gb': 55,
            'disk_total_gb': 100,
            'network_rx_mb': 15.0,
            'network_tx_mb': 12.0,
            'load_average_1m': 1.5,
            'load_average_5m': 1.3,
            'load_average_15m': 1.1
        }
        
        # Mock docker metrics
        mock_collector.collect_docker_metrics.return_value = []
        
        # Mock docker service
        mock_docker_service.is_available.return_value = True
        mock_docker_service.list_containers.return_value = [
            {
                'id': 'container1',
                'name': 'web-app',
                'image': 'nginx:latest',
                'status': 'running',
                'ports': ['8080:80', '8443:443']
            },
            {
                'id': 'container2',
                'name': 'database',
                'image': 'postgres:13',
                'status': 'running',
                'ports': ['5432:5432']
            }
        ]
        
        url = reverse('live-metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('server', response.data)
        self.assertIn('docker', response.data)
        self.assertIn('containers', response.data)
        self.assertIn('timestamp', response.data)
        
        # Check containers have port information
        containers = response.data['containers']
        self.assertEqual(len(containers), 2)
        self.assertIn('ports', containers[0])
        self.assertEqual(containers[0]['ports'], ['8080:80', '8443:443'])

    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access metrics"""
        self.client.logout()
        
        url = reverse('server-metrics')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @patch('monitoring.views.metrics_collector')
    def test_server_metrics_collect_error(self, mock_collector):
        """Test error handling in server metrics collection"""
        mock_collector.collect_server_metrics.return_value = None
        
        url = reverse('server-metrics')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

    @patch('monitoring.views.metrics_collector')
    def test_server_metrics_collect_exception(self, mock_collector):
        """Test exception handling in server metrics collection"""
        mock_collector.collect_server_metrics.side_effect = Exception("Test error")
        
        url = reverse('server-metrics')
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        self.assertEqual(response.data['error'], 'Test error')


class DockerServiceTestCase(TestCase):
    """Test Docker service functionality"""
    
    @patch('services.docker_service.docker.APIClient')
    def test_format_ports(self, mock_docker_client):
        """Test port formatting functionality"""
        from services.docker_service import DockerService
        
        # Mock Docker client
        mock_client = MagicMock()
        mock_docker_client.return_value = mock_client
        mock_client.version.return_value = {'Version': '20.10.0'}
        
        docker_service = DockerService()
        
        # Test port formatting
        ports = [
            {'PublicPort': 8080, 'PrivatePort': 80, 'Type': 'tcp'},
            {'PublicPort': 8443, 'PrivatePort': 443, 'Type': 'tcp'},
            {'PublicPort': 5432, 'PrivatePort': 5432, 'Type': 'tcp'}
        ]
        
        formatted_ports = docker_service._format_ports(ports)
        
        self.assertEqual(formatted_ports, ['8080:80', '8443:443', '5432:5432'])

    @patch('services.docker_service.docker.APIClient')
    def test_format_ports_empty(self, mock_docker_client):
        """Test port formatting with empty ports"""
        from services.docker_service import DockerService
        
        # Mock Docker client
        mock_client = MagicMock()
        mock_docker_client.return_value = mock_client
        mock_client.version.return_value = {'Version': '20.10.0'}
        
        docker_service = DockerService()
        
        # Test empty ports
        formatted_ports = docker_service._format_ports([])
        
        self.assertEqual(formatted_ports, [])

    @patch('services.docker_service.docker.APIClient')
    def test_format_ports_missing_public_port(self, mock_docker_client):
        """Test port formatting with missing public port"""
        from services.docker_service import DockerService
        
        # Mock Docker client
        mock_client = MagicMock()
        mock_docker_client.return_value = mock_client
        mock_client.version.return_value = {'Version': '20.10.0'}
        
        docker_service = DockerService()
        
        # Test ports with missing public port
        ports = [
            {'PrivatePort': 80, 'Type': 'tcp'},  # Missing PublicPort
            {'PublicPort': 443, 'PrivatePort': 443, 'Type': 'tcp'}
        ]
        
        formatted_ports = docker_service._format_ports(ports)
        
        self.assertEqual(formatted_ports, ['80:80', '443:443'])

    @patch('services.docker_service.docker.APIClient')
    def test_format_ports_string_format(self, mock_docker_client):
        """Test port formatting with string format"""
        from services.docker_service import DockerService
        
        # Mock Docker client
        mock_client = MagicMock()
        mock_docker_client.return_value = mock_client
        mock_client.version.return_value = {'Version': '20.10.0'}
        
        docker_service = DockerService()
        
        # Test ports with string format
        ports = [
            "0.0.0.0:8080->80/tcp",
            "0.0.0.0:8443->443/tcp",
            "80/tcp"
        ]
        
        formatted_ports = docker_service._format_ports(ports)
        
        self.assertEqual(formatted_ports, ['8080:80', '8443:443', '80:80'])

    @patch('services.docker_service.docker.APIClient')
    def test_get_container_ports(self, mock_docker_client):
        """Test getting detailed container ports"""
        from services.docker_service import DockerService
        
        # Mock Docker client
        mock_client = MagicMock()
        mock_docker_client.return_value = mock_client
        mock_client.version.return_value = {'Version': '20.10.0'}
        
        # Mock inspect_container response
        mock_client.inspect_container.return_value = {
            "NetworkSettings": {
                "Ports": {
                    "80/tcp": [{"HostPort": "8080"}],
                    "443/tcp": [{"HostPort": "8443"}],
                    "5432/tcp": None
                }
            }
        }
        
        docker_service = DockerService()
        
        ports = docker_service.get_container_ports("test-container")
        
        self.assertEqual(ports, ['8080:80', '8443:443', '5432:5432'])
