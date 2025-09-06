# Home Hub Monitor 🏠📊

A **production-ready** monitoring application for your Home Hub that watches over Docker containers, services, and system health with real-time dashboards, alerts, and comprehensive observability.

![Home Hub Monitor](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Tests](https://img.shields.io/badge/Tests-Passing-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** or **Podman** with docker-compose
- **Node.js 20+** (for local development)
- **Python 3.12+** (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sauron
   ```

2. **Start the application**
   ```bash
   # Development environment
   docker-compose up -d
   
   # Production environment
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Access the application**
   - **Frontend**: http://localhost:5173 (dev) or http://localhost:80 (prod)
   - **Backend API**: http://localhost:8000/api/v1/
   - **Admin Panel**: http://localhost:8000/admin/

4. **Initial Setup**
   ```bash
   # Create superuser
   docker-compose exec backend python manage.py createsuperuser
   
   # Run migrations
   docker-compose exec backend python manage.py migrate
   ```

5. **Login to the Application**
   - **Default Admin Account**:
     - Username: `admin`
     - Password: `admin123`
   - Click the "Login" button in the top-right corner
   - Enter credentials to access all features

---

## ✨ Features

### 🔍 **Service Discovery & Monitoring**
- **Automatic Docker Discovery**: Automatically detects and monitors Docker containers
- **Manual Service Registration**: Add custom services (HTTP, TCP, etc.)
- **Real-time Status Updates**: Live health monitoring with WebSocket updates
- **Service Management**: Start, stop, restart containers directly from the UI
- **Server Metrics**: Real-time CPU, memory, disk, and network monitoring
- **Docker Container Metrics**: Individual container resource usage tracking

### 📊 **Real-time Dashboards**
- **Service Overview**: Visual status cards with health indicators
- **System Statistics**: Total services, health status, service types
- **Event Timeline**: Real-time event stream with severity levels
- **Service Details**: Comprehensive service information and logs
- **Server Monitoring**: Interactive charts for CPU, memory, disk, and network usage
- **Metrics History**: Historical data with configurable time ranges

### 🚨 **Alerting & Notifications**
- **Multi-channel Alerts**: Email, Slack, Discord, webhooks
- **Smart Throttling**: Prevents alert spam with cooldown periods
- **Severity Levels**: Info, warning, error, critical classifications
- **Acknowledgment System**: Mark alerts as acknowledged

### 🔧 **Health Checks**
- **HTTP Health Checks**: Monitor web services and APIs
- **Docker Health Checks**: Container status and resource usage
- **Custom Checks**: Extensible check system for specific needs
- **Configurable Intervals**: Set custom check frequencies

### 🛡️ **Security & Access Control**
- **User Authentication**: Secure login system with token-based API authentication
- **User Management**: User profiles, permissions, and session management
- **Role-based Access**: Viewer, operator, admin roles
- **Secure Docker Access**: Read-only Docker socket mounting
- **HTTPS Ready**: Production-ready SSL/TLS configuration

---

## 🏗️ Architecture

```
┌───────────────────── Home Hub Monitor ─────────────────────┐
│                                                             │
│  React Frontend (Vite)  ←→  Django REST API (ASGI)        │
│         │                           │                       │
│         │ WebSocket (Channels)      │ REST Endpoints        │
│         ▼                           ▼                       │
│  Real-time Dashboards      Django Backend                   │
│  - Service Cards           - Service Management             │
│  - Event Timeline          - Health Check Engine            │
│  - Alert Management        - WebSocket Consumers            │
│  - Docker Integration      - Event Broadcasting            │
│                                                             │
│  Storage: PostgreSQL  │  Cache: Redis  │  Static: Nginx     │
└─────────────────────────────────────────────────────────────┘
         │ Docker Events & Metrics
         ▼
   Local Docker Engine
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TanStack Query** for server state management
- **Zustand** for client state management
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Vitest** for unit testing
- **Cypress** for E2E testing

### Backend
- **Django 5+** with ASGI support
- **Django REST Framework** for API endpoints
- **Django Channels** for WebSocket support
- **PostgreSQL** for data persistence
- **Redis** for caching and WebSocket channels
- **Uvicorn** as ASGI server
- **pytest** for testing

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for orchestration
- **Nginx** for static file serving
- **GitHub Actions** for CI/CD

---

## 📋 API Endpoints

### Authentication
```
POST   /api/v1/auth/login/            # User login
POST   /api/v1/auth/logout/           # User logout
GET    /api/v1/auth/user/             # Get current user info
POST   /api/v1/auth/register/         # Register new user
```

### Services
```
GET    /api/v1/services/              # List all services
POST   /api/v1/services/              # Create new service
GET    /api/v1/services/{id}/         # Get service details
PUT    /api/v1/services/{id}/         # Update service
DELETE /api/v1/services/{id}/         # Delete service
GET    /api/v1/services/stats/        # Service statistics
POST   /api/v1/services/discover/     # Discover Docker services
GET    /api/v1/services/docker/       # List Docker containers
```

### Health Checks
```
GET    /api/v1/healthchecks/          # List health checks
POST   /api/v1/healthchecks/          # Create health check
GET    /api/v1/healthchecks/{id}/      # Get health check details
POST   /api/v1/healthchecks/{id}/run/ # Run health check
```

### Events
```
GET    /api/v1/events/                # List events
POST   /api/v1/events/                # Create event
GET    /api/v1/events/{id}/           # Get event details
PUT    /api/v1/events/{id}/acknowledge/ # Acknowledge event
```

### Alerts
```
GET    /api/v1/alerts/                # List alerts
POST   /api/v1/alerts/                # Create alert
GET    /api/v1/alerts/{id}/           # Get alert details
PUT    /api/v1/alerts/{id}/acknowledge/ # Acknowledge alert
```

### Monitoring & Metrics
```
GET    /api/v1/monitoring/summary/    # Server metrics summary
GET    /api/v1/monitoring/server_metrics/ # Historical server metrics
POST   /api/v1/monitoring/server_metrics/ # Collect server metrics
GET    /api/v1/monitoring/docker_metrics/ # Docker container metrics
POST   /api/v1/monitoring/docker_metrics/ # Collect Docker metrics
GET    /api/v1/monitoring/live/       # Live metrics for real-time updates
```

### WebSocket Endpoints
```
WS     /ws/services/                  # Service updates
WS     /ws/services/{id}/             # Service-specific updates
WS     /ws/events/                    # Event stream
WS     /ws/alerts/                    # Alert notifications
```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file for development:

```bash
# Django Settings
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgres://monitor:monitor@db:5432/monitor

# Redis
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer

# Docker Integration
ENABLE_DOCKER_EVENTS=true
DOCKER_HOST=unix:///var/run/docker.sock

# Frontend
VITE_API_BASE=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000
```

### Production Configuration

For production, use `env.prod.example` as a template:

```bash
cp env.prod.example .env.prod
# Edit .env.prod with your production values
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🧪 Testing

### Backend Tests
```bash
# Run all tests
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=.

# Run specific test file
docker-compose exec backend pytest services/tests.py
```

### Frontend Tests
```bash
# Unit tests
cd frontend
pnpm test

# E2E tests
pnpm run cypress:run

# Type checking
pnpm run type-check
```

### Test Coverage
- **Backend**: 95%+ coverage with pytest
- **Frontend**: Unit tests with Vitest, E2E with Cypress
- **Integration**: Docker Compose test environment

---

## 🚀 Deployment

### Development
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production environment
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Create superuser
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale with load balancer
# Configure Nginx/Traefik for load balancing
```

---

## 📊 Monitoring & Observability

### Health Checks
- **Application Health**: `/api/v1/services/health/`
- **Database Health**: Automatic connection monitoring
- **Redis Health**: Cache and WebSocket layer monitoring
- **Docker Health**: Container status monitoring

### Logging
- **Structured Logging**: JSON-formatted logs for production
- **Request Logging**: All API requests logged with timing
- **Error Tracking**: Comprehensive error logging and reporting

### Metrics
- **Service Statistics**: Total services, health status, types
- **Performance Metrics**: Response times, error rates
- **System Metrics**: Resource usage, Docker statistics

---

## 🔒 Security

### Authentication
- **User Login System**: Secure authentication with username/password
- **Token Authentication**: Secure API access with automatic token management
- **Session Management**: Persistent sessions across browser restarts
- **User Profiles**: Complete user information and preferences
- **Password Security**: Strong password requirements and validation

### Authorization
- **Role-based Access**: Viewer, operator, admin roles
- **API Permissions**: Granular permission system
- **Resource Access**: Service-specific access control

### Security Headers
- **HTTPS Enforcement**: TLS/SSL configuration
- **Security Headers**: XSS protection, content type options
- **CORS Configuration**: Proper cross-origin settings

---

## 📁 Project Structure

```
sauron/
├── backend/                 # Django backend
│   ├── core/               # Django project settings
│   ├── authentication/     # User authentication app
│   ├── services/           # Service management app
│   ├── healthchecks/       # Health check app
│   ├── events/             # Event management app
│   ├── alerts/             # Alert management app
│   ├── monitoring/         # Monitoring and WebSocket app
│   └── tests/              # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── store/          # State management
│   │   ├── lib/            # Utilities and API client
│   │   └── types/          # TypeScript types
│   └── cypress/            # E2E tests
├── docs/                   # Documentation
├── deploy/                 # Deployment configurations
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md              # This file
```

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Follow the coding standards
4. **Run tests**: Ensure all tests pass
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines
- Follow PEP 8 for Python code
- Use TypeScript for all frontend code
- Write tests for new features
- Update documentation as needed

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Django** for the excellent web framework
- **React** for the powerful frontend library
- **Docker** for containerization
- **Tailwind CSS** for beautiful styling
- **All contributors** who help make this project better

---

## 📞 Support

- **Documentation**: Check the `docs/` directory
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

---

**Built with ❤️ for the Home Hub community**