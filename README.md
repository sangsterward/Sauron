# Home Hub Monitor

A production‑ready app for your **Home Hub** that monitors other apps and services running on your servers and in Docker. It provides a **React** front end, a **Django (ASGI)** backend for live updates, and a well‑structured API layer. Everything ships in Docker, with local and CI test automation (unit + Cypress E2E).

---

## Table of Contents

* [Features](#features)
* [Architecture](#architecture)
* [Tech Stack](#tech-stack)
* [API Layer: DRF vs GraphQL](#api-layer-drf-vs-graphql)
* [Live Updates](#live-updates)
* [Security Model](#security-model)
* [Local Development](#local-development)
* [Environment Variables](#environment-variables)
* [Docker & Compose](#docker--compose)
* [Production Deployment](#production-deployment)
* [CI/CD](#cicd)
* [Testing](#testing)
* [Directory Structure](#directory-structure)
* [Makefile Commands](#makefile-commands)
* [Observability](#observability)
* [Backups & Migrations](#backups--migrations)
* [Versioning & Releases](#versioning--releases)
* [Contributing](#contributing)
* [License](#license)

---

## Features

* **Service discovery & monitoring**

  * Poll and subscribe to local **Docker** events (start/stop/restart/health).
  * Optional remote server monitoring via lightweight agent or SSH.
* **Status dashboards** in React with real‑time updates via WebSockets.
* **Alerts & notifications** (email, Slack/Discord/webhooks) with throttling.
* **Pluggable checks**: HTTP health, port checks, container health, CPU/RAM/disk thresholds.
* **Role‑based access control** (RBAC) & API tokens for automation.
* **Fully containerized** with Dockerfiles for frontend and backend and a dev/prod `docker-compose.yml`.
* **Test automation**: Python unit tests (pytest) + Cypress E2E for the UI, runnable locally and in CI.

---

## Architecture

```
+------------------------- Home Hub Monitor -------------------------+
|                                                                   |
|  React SPA (Vite)  <----->  API Layer (DRF or Graphene)           |
|        |                               |                          |
|        |  WebSocket (ASGI/Channels)    |  REST/GraphQL            |
|        v                               v                          |
|  Real-time dashboards         Django App (ASGI)                    |
|  (Cypress-tested)             - Monitoring core                    |
|                               - Auth / RBAC                        |
|                               - Alerts & Schedules                 |
|                               - Celery workers (optional)          |
|                               - Docker event listener              |
|                                 (via /var/run/docker.sock RO)      |
|                                                                   |
|  Storage: Postgres  |  Cache: Redis  |  Static: S3/minio (opt.)   |
+-------------------------------------------------------------------+
         | Docker metrics / events           | System metrics
         v                                    v
   Local Docker Engine                   Agent/SSH (optional)
```

---

## Tech Stack

* **Frontend**: React + TypeScript, Vite, React Query (TanStack Query), Zustand/Redux toolkit (state), React Router, Tailwind CSS.
* **Backend**: Django 5+, Django REST Framework (**default**), Django Channels (ASGI) with Redis for WebSocket layer, Celery (optional) for scheduled/long tasks.
* **Runtime**: ASGI server (Uvicorn or Daphne) behind Traefik/Nginx.
* **DB**: PostgreSQL.
* **Cache & WS broker**: Redis.
* **Container**: Docker, docker‑compose.
* **Tests**: pytest + coverage + factory\_boy; Cypress for E2E.
* **Lint/Format**: ruff/flake8, black, isort, mypy; eslint, prettier, type‑check.

---

## API Layer: DRF vs GraphQL

**Default: Django REST Framework (DRF)**

* Pros: simple, excellent browsable API, great tooling, easy caching/CDN, straightforward auth.
* Fits well with streaming or push via **Channels** for realtime.

**Optional: GraphQL (Graphene or Strawberry)**

* Pros: efficient client querying and schema evolution when many dashboard views compose complex data.
* Cons: more complexity, caching is trickier, subscriptions require extra plumbing.

> **Recommendation**: Start with **DRF** for monitor resources (services, checks, events, alerts) and use **WebSockets** for live data. Add GraphQL later if clients need flexible joins/queries.

**Core REST endpoints (illustrative):**

```
GET    /api/v1/services/               # list monitored services
POST   /api/v1/services/               # register/update service
GET    /api/v1/services/:id/           # details + last health
GET    /api/v1/checks/                 # health checks configured
POST   /api/v1/checks/run/             # trigger on-demand check
GET    /api/v1/events/?since=...       # recent events (paginated)
WS     /ws/services/:id/stream/        # live events/metrics for a service
POST   /api/v1/alerts/test/            # test notification channels
```

---

## Live Updates

* **Django Channels** for ASGI (websocket endpoints under `/ws/...`).
* **Redis** as channel layer + pub/sub bus.
* Server pushes:

  * Docker events (container start/stop/health) streamed to relevant subscribers.
  * Health check results and alert state changes.
* Frontend uses React Query + a small WS client to merge streaming updates into cache.

---

## Security Model

* **Auth**: JWT (SimpleJWT) or session auth for browser; Personal Access Tokens for CI/bots.
* **RBAC**: Roles: *viewer*, *operator*, *admin*.
* **Secrets**: Managed via `.env` in dev and secret manager in prod (Docker/Swarm/Compose or Kubernetes secrets).
* **Least privilege**:

  * Mount Docker socket **read‑only**; restrict to needed events (optionally via `tecnativa/docker-socket-proxy`).
  * Isolate Celery workers; resource limits via `deploy.resources.limits`.
* **HTTPS**: Terminate TLS at Traefik/Nginx; HSTS; secure cookies; CSRF for session auth.

---

## Local Development

### Prereqs

* Docker Desktop / Podman + docker‑compose
* Node 20+, PNPM/Yarn/NPM
* Python 3.12+, Poetry or pip

### Quickstart (Dev)

```bash
# 1) Clone and bootstrap
make bootstrap           # installs pre-commit hooks, node deps, python deps

# 2) Start stack (frontend, backend, db, redis)
make up                  # docker compose up with hot-reload

# 3) Run DB migrations & seed demo data
make migrate seed

# 4) Visit the app
open http://localhost:5173   # frontend (Vite)
open http://localhost:8000   # backend browsable API
```

### Running without Docker (optional)

```bash
# Backend
cp .env.example .env
poetry install && poetry run python manage.py migrate
poetry run uvicorn core.asgi:application --reload --port 8000

# Frontend
pnpm install
pnpm dev
```

---

## Environment Variables

Create `.env` (dev) and `.env.prod` (prod). Example:

```
# Backend
DJANGO_SECRET_KEY=change-me
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=*
DATABASE_URL=postgres://monitor:monitor@db:5432/monitor
REDIS_URL=redis://redis:6379/0
CHANNEL_LAYERS_BACKEND=channels_redis.core.RedisChannelLayer
BROKER_URL=redis://redis:6379/1
ENABLE_DOCKER_EVENTS=true
DOCKER_HOST=unix:///var/run/docker.sock
ALERT_WEBHOOK_URL=

# Frontend
VITE_API_BASE=http://localhost:8000
VITE_WS_BASE=ws://localhost:8000
```

---

## Docker & Compose

### Backend Dockerfile (ASGI)

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
COPY backend/pyproject.toml backend/poetry.lock /app/
RUN pip install --no-cache-dir poetry && poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi
COPY backend /app
CMD ["uvicorn", "core.asgi:application", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY frontend/ .
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
```

### docker-compose.yml (dev)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: monitor
      POSTGRES_USER: monitor
      POSTGRES_PASSWORD: monitor
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U monitor"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine

  backend:
    build: { context: ., dockerfile: backend/Dockerfile }
    env_file: .env
    volumes:
      - ./backend:/app
      - /var/run/docker.sock:/var/run/docker.sock:ro
    depends_on: [db, redis]
    ports: ["8000:8000"]

  frontend:
    build: { context: ., dockerfile: frontend/Dockerfile }
    environment:
      - VITE_API_BASE=http://localhost:8000
      - VITE_WS_BASE=ws://localhost:8000
    volumes:
      - ./frontend:/app
    ports: ["5173:80"]

volumes:
  db_data:
```

> **Note:** For stricter Docker socket access, consider using `docker-socket-proxy` and point `DOCKER_HOST` at the proxy container.

---

## Production Deployment

* **Reverse Proxy / TLS**: Traefik (recommended) or Nginx with Let’s Encrypt.
* **Scaling**: Multiple ASGI workers and replicas behind the proxy. Redis scales WS fanout.
* **Static/Media**: Serve via C
