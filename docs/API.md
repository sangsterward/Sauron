# Home Hub Monitor API Documentation

## Authentication
All API endpoints require authentication. Use either:
- Session authentication for browser requests
- Token authentication for API requests

## Endpoints

### Services
- `GET /api/v1/services/` - List all services
- `POST /api/v1/services/` - Create a new service
- `GET /api/v1/services/{id}/` - Get service details
- `PUT /api/v1/services/{id}/` - Update service
- `DELETE /api/v1/services/{id}/` - Delete service
- `GET /api/v1/services/stats/` - Get service statistics
- `POST /api/v1/services/discover_services/` - Discover Docker services
- `GET /api/v1/services/docker_containers/` - List Docker containers
- `POST /api/v1/services/{id}/start_container/` - Start container
- `POST /api/v1/services/{id}/stop_container/` - Stop container

### Health Checks
- `GET /api/v1/healthchecks/` - List health checks
- `GET /api/v1/healthchecks/{id}/` - Get health check details

### Events
- `GET /api/v1/events/` - List recent events
- `GET /api/v1/events/{id}/` - Get event details

### Alerts
- `GET /api/v1/alerts/` - List alerts
- `POST /api/v1/alerts/` - Create alert
- `GET /api/v1/alerts/{id}/` - Get alert details
- `PUT /api/v1/alerts/{id}/` - Update alert
- `DELETE /api/v1/alerts/{id}/` - Delete alert
- `GET /api/v1/alerts/history/` - Get alert history
- `GET /api/v1/alerts/notification-channels/` - List notification channels
- `POST /api/v1/alerts/notification-channels/` - Create notification channel

### Monitoring
- `GET /api/v1/monitoring/docker_status/` - Get Docker daemon status
- `POST /api/v1/monitoring/trigger_check/` - Trigger manual health check
- `POST /api/v1/monitoring/test_broadcast/` - Test WebSocket broadcasting

## WebSocket Endpoints
- `ws://host/ws/services/` - Service updates
- `ws://host/ws/services/{id}/` - Service-specific updates
- `ws://host/ws/events/` - Event stream
- `ws://host/ws/alerts/` - Alert notifications

## Response Format
All API responses follow this format:
```json
{
  "results": [...],
  "count": 10,
  "next": "http://api.example.com/api/v1/services/?page=2",
  "previous": null
}
```

## Error Format
```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
