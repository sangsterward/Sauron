# Deployment Guide

## Production Deployment

### Prerequisites
- Docker and Docker Compose
- Domain name with SSL certificate
- PostgreSQL database
- Redis instance

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd home-hub-monitor
   ```

2. **Configure environment**
   ```bash
   cp env.prod.example .env
   # Edit .env with your production values
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run migrations**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
   ```

6. **Setup SSL (with Traefik)**
   ```bash
   # Configure Traefik for SSL termination
   # Update docker-compose.prod.yml with Traefik labels
   ```

### Monitoring
- Health check endpoint: `/api/v1/services/health/`
- Metrics endpoint: `/metrics/`
- Logs: `docker-compose logs -f`

### Backup
```bash
# Database backup
docker-compose exec db pg_dump -U monitor monitor > backup.sql

# Restore
docker-compose exec -T db psql -U monitor monitor < backup.sql
```

## Development Setup

1. **Clone and setup**
   ```bash
   git clone <repository-url>
   cd home-hub-monitor
   cp env.example .env
   ```

2. **Start services**
   ```bash
   docker-compose up -d
   ```

3. **Run migrations**
   ```bash
   docker-compose exec backend python manage.py migrate
   ```

4. **Create superuser**
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - Admin: http://localhost:8000/admin

## Testing

### Backend Tests
```bash
docker-compose exec backend python manage.py test
```

### Frontend Tests
```bash
cd frontend
pnpm run test:ci
```

### E2E Tests
```bash
cd frontend
pnpm run cypress:run
```

## Troubleshooting

### Common Issues

1. **Docker connection issues**
   - Ensure Docker socket is mounted correctly
   - Check Docker daemon is running

2. **Database connection issues**
   - Verify PostgreSQL is running
   - Check connection string in environment variables

3. **Redis connection issues**
   - Verify Redis is running
   - Check Redis URL in environment variables

4. **WebSocket connection issues**
   - Ensure Redis is running for channel layers
   - Check WebSocket URL configuration

### Logs
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```
