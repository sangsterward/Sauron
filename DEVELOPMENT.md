# Development Guide

## 🚀 Quick Start with Hot Reloading

The development environment is configured with hot reloading for both frontend and backend, allowing you to see changes immediately without rebuilding containers.

### Starting Development Environment

```bash
# Start development environment with hot reloading
make dev

# Or manually:
docker compose -f docker-compose.dev.yml up -d --build
```

### Access Points

- **Frontend (React + Vite)**: http://localhost:5173
- **Backend API (Django)**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin/
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Available Commands

```bash
# Start development environment
make dev

# Stop development environment
make dev-down

# View logs (with follow)
make dev-logs

# Run database migrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Create superuser
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser

# Access Django shell
docker compose -f docker-compose.dev.yml exec backend python manage.py shell
```

## 🔥 Hot Reloading Features

### Frontend (Vite + React)
- **Instant HMR**: Changes to React components update immediately in the browser
- **Fast Refresh**: Component state is preserved during updates
- **CSS Hot Reload**: Style changes apply without page refresh
- **TypeScript Support**: Type checking runs in watch mode

### Backend (Django)
- **Auto-restart**: Django development server restarts automatically when Python files change
- **Debug Mode**: Full error traces and debug toolbar available
- **Database Changes**: Models changes detected and migrations suggested
- **Static Files**: Served directly without collection

## 📁 Project Structure

```
.
├── docker-compose.dev.yml    # Development compose configuration
├── docker-compose.yml        # Production compose configuration
├── backend/
│   ├── Dockerfile.dev       # Development backend image
│   ├── Dockerfile           # Production backend image
│   └── manage.py           # Django management script
└── frontend/
    ├── Dockerfile.dev       # Development frontend image
    ├── Dockerfile          # Production frontend image
    └── package.json        # Node dependencies and scripts
```

## 🛠️ Making Changes

### Frontend Changes
1. Edit any file in `frontend/src/`
2. Changes appear immediately in browser (HMR)
3. Check browser console for any errors

### Backend Changes
1. Edit any Python file in `backend/`
2. Django server restarts automatically
3. Check terminal logs for any errors: `make dev-logs`

### Adding Dependencies

**Frontend:**
```bash
# Add dependency
docker compose -f docker-compose.dev.yml exec frontend pnpm add <package>

# Rebuild to include in image
docker compose -f docker-compose.dev.yml up -d --build frontend
```

**Backend:**
```bash
# Add dependency
docker compose -f docker-compose.dev.yml exec backend poetry add <package>

# Rebuild to include in image
docker compose -f docker-compose.dev.yml up -d --build backend
```

## 🔍 Debugging

### Frontend Debugging
- Browser DevTools work normally
- React DevTools extension supported
- Source maps enabled for debugging original source

### Backend Debugging
- Django Debug Toolbar available (when DEBUG=True)
- Full stack traces in responses
- Django shell access: `docker compose -f docker-compose.dev.yml exec backend python manage.py shell`

### Viewing Logs
```bash
# All services
make dev-logs

# Specific service
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
docker compose -f docker-compose.dev.yml exec backend pytest

# Frontend tests
docker compose -f docker-compose.dev.yml exec frontend pnpm test
```

### Test Coverage
```bash
# Generate coverage report
make test-coverage

# View coverage in terminal
make test-coverage-report
```

## 📝 Database Management

### Migrations
```bash
# Create migrations
docker compose -f docker-compose.dev.yml exec backend python manage.py makemigrations

# Apply migrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Check migration status
docker compose -f docker-compose.dev.yml exec backend python manage.py showmigrations
```

### Database Access
```bash
# Django shell
docker compose -f docker-compose.dev.yml exec backend python manage.py shell

# PostgreSQL shell
docker compose -f docker-compose.dev.yml exec db psql -U monitor -d monitor
```

## 🐛 Troubleshooting

### Container not updating with code changes?
- Ensure volumes are mounted correctly
- Check that files are saved
- Verify hot reload is enabled in logs

### Port already in use?
```bash
# Stop all containers
make dev-down

# Check for running processes
lsof -i :5173  # Frontend
lsof -i :8000  # Backend
```

### Database connection issues?
```bash
# Restart database
docker compose -f docker-compose.dev.yml restart db

# Check database logs
docker compose -f docker-compose.dev.yml logs db
```

### Permission issues with Docker socket?
- On macOS, Docker Desktop handles this automatically
- On Linux, ensure user is in docker group: `sudo usermod -aG docker $USER`

## 🎯 Best Practices

1. **Keep containers running**: Don't stop/start frequently, use hot reload
2. **Check logs regularly**: `make dev-logs` to catch issues early
3. **Commit working code**: Test changes before committing
4. **Use development database**: Don't connect to production from dev environment
5. **Clean up regularly**: `docker system prune` to free disk space

## 🔄 Switching Environments

### From Development to Production
```bash
# Stop development
make dev-down

# Start production
docker compose up -d
```

### From Production to Development
```bash
# Stop production
docker compose down

# Start development
make dev
```

---

For more information, see the main [README.md](README.md) or [BUILD_GUIDE.md](BUILD_GUIDE.md).
