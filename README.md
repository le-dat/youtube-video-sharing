# YouTube Sharing Application

## Introduction

The YouTube Sharing Application is a full-stack web platform that allows users to share YouTube videos and receive real-time notifications when new content is posted. Built with a modern, scalable tech stack, it provides a seamless and responsive user experience for discovering and sharing video content.

**Tech Stack:**

- **Frontend:** React + Vite + TailwindCSS + Zustand + Socket.io Client
- **Backend:** NestJS + TypeORM + PostgreSQL + Redis + Socket.io
- **Infrastructure:** Docker + Docker Compose + Nginx + GitHub Actions + GHCR

**Key Features:**

- User Authentication (Registration & Login securely managed via HTTP-only JWT cookies)
- Share YouTube videos with automatic metadata extraction
- Real-time WebSocket notifications for newly shared videos across all connected clients
- Responsive, modern UI built with React and Vite
- Robust, modular backend built with NestJS and TypeORM
- **Fully containerized CI/CD workflow via GitHub Actions & GHCR**

---

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

| Software | Version | Notes |
|----------|---------|-------|
| **Docker** | v24.0+ | Required for containerized development |
| **Docker Compose** | v2.20+ | Required for orchestrating multi-container setup |
| **Make** | any | For running Makefile commands |
| **YouTube Data API v3 Key** | — | Required to fetch video metadata. Get one at [Google Cloud Console](https://console.cloud.google.com/) |
| **Git** | v2.40+ | For cloning the repository |

**Optional (for native development without Docker):**

| Software | Version | Notes |
|----------|---------|-------|
| **Node.js** | v20 LTS | For running backend natively |
| **pnpm** | v8+ | Package manager (or use `npm`/`yarn`) |
| **PostgreSQL** | v15+ | Required if not using Docker |
| **Redis** | v7+ | Required if not using Docker |

---

## Installation & Configuration

### 1. Clone the repository

```bash
git clone <repository-url>
cd youtube-sharing/nestjs
```

### 2. Environment Variables

For local development, copy the example environment file:

```bash
cp .env.example .env.dev
```

Open `.env.dev` and configure the following required variables:

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | **Required.** Your YouTube Data API v3 key |
| `DATABASE_HOST` | PostgreSQL host (default: localhost via Docker) |
| `DATABASE_PORT` | PostgreSQL port (default: 5432) |
| `DATABASE_USER` | PostgreSQL username |
| `DATABASE_PASSWORD` | PostgreSQL password |
| `DATABASE_NAME` | PostgreSQL database name |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens |
| `REDIS_HOST` | Redis host (default: localhost via Docker) |

---

## Database Setup

The application uses **PostgreSQL** as the primary database and **Redis** for session/token storage.

### With Docker (Recommended)

When using `make dev-up`, the database and Redis containers are automatically started with volumes persisted to your host machine.

### Without Docker

1. **Create the PostgreSQL database:**
   ```bash
   createdb -U postgres youtube_sharing
   ```

2. **Run database migrations:**
   ```bash
   cd src/backend
   pnpm migration:run
   ```

3. **Seed data (optional):**
   ```bash
   pnpm seed
   ```

### Migrations

| Command | Description |
|---------|-------------|
| `pnpm migration:run` | Run all pending migrations |
| `pnpm migration:revert` | Revert the last migration |
| `pnpm migration:generate <name>` | Generate a new migration from entity changes |

---

## Running the Application Locally

### With Docker (Recommended)

The project includes a fully automated Docker Compose setup for local development.

**Start the Development Environment:**

```bash
make dev-up
```

This command will:
- Build local Docker images for the Backend and Frontend
- Start PostgreSQL, Redis, Backend API, Frontend static server, and Nginx
- Automatically run TypeORM database migrations on backend startup

**Access the Application:**
- Application: 👉 **http://localhost**
- API Documentation: **http://localhost/api/docs**

**Useful Local Commands:**

```bash
make dev-logs    # View system logs
make dev-down    # Stop the local environment
```

### Without Docker (Native Development)

```bash
cd src/backend

# Install dependencies
pnpm install

# Start PostgreSQL and Redis on host machine, then:
pnpm start:dev
```

### Running Tests

```bash
cd src/backend

# Unit tests
pnpm test

# E2E tests (requires Docker services running)
docker compose -f docker-compose.e2e.yml up -d
pnpm test:e2e
docker compose -f docker-compose.e2e.yml down
```

---

## Docker Deployment

### Building Images Locally

```bash
# Build backend image
docker build -t youtube-sharing-backend:latest -f src/backend/Dockerfile .

# Build frontend image
docker build -t youtube-sharing-frontend:latest -f src/frontend/Dockerfile .

# Or build both with docker compose
docker compose -f docker-compose.prod.yml build
```

### Running Containers

```bash
# Start all services
docker compose -f docker-compose.prod.yml up -d

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Production Deployment (VPS & GHCR)

This project uses a modern CI/CD pipeline. Instead of building images directly on the production server, images are built on GitHub Actions, stored in GitHub Container Registry (GHCR), and automatically deployed to your VPS.

**1. VPS Preparation:**

- Ensure Docker 24.0+ and Docker Compose v2.20+ are installed on your VPS
- Clone the repository to your VPS:
  ```bash
  git clone <repository-url>
  cd youtube-sharing/nestjs
  ```
- Create a `.env` file on your VPS (using `.env.prod` as template):
  ```bash
  cp .env.prod.example .env
  ```
- Update the following variables for production:
  - `CORS_ORIGIN` → your production domain (e.g., `https://yourdomain.com`)
  - `VITE_API_URL` → your backend API URL
  - `VITE_WS_URL` → your WebSocket server URL

**2. GitHub Secrets:**

Configure these secrets in your GitHub repository Settings → Secrets → Actions:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | IP address of your VPS |
| `VPS_USER` | SSH username (e.g., `root`, `ubuntu`) |
| `VPS_SSH_KEY` | Private SSH key for authentication |

**3. Automated Deployment:**

Every time you push code to the `main` branch, GitHub Actions will:
1. Build new Docker images for frontend and backend
2. Push them to `ghcr.io/<your-github-username>/youtube-sharing`
3. SSH into your VPS
4. Pull the latest images and recreate containers using `docker-compose.prod.yml`

---

## Usage

### 1. Register/Login

Open the frontend application at http://localhost and create a new account or log in with an existing one.

### 2. Share a Video

Once logged in:

1. Click on "Share a movie" button
2. Paste a valid YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
3. The backend validates the URL and fetches the video's title and description via YouTube API
4. The video appears in the shared videos list

### 3. Real-time Notifications

Open a second browser window (or an incognito tab). When a video is shared in the first window, a real-time notification popup will instantly appear in the second window via WebSockets.

### 4. Voting

Authenticated users can upvote or downvote videos. Vote counts are updated in real-time across all connected clients.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Database Errors on Startup** | Use `make dev-up` which passes `--env-file .env.dev`. If using `docker compose up` directly, it will fail to load environment variables. |
| **WebSocket Connection Fails** | Ensure your Nginx configuration properly forwards the `Upgrade` and `Connection` headers required for WebSocket protocol. |
| **YouTube API Error / Videos Not Loading** | The `YOUTUBE_API_KEY` has daily quotas (10,000 units/day for free tier). If fetching fails, verify your API key in the [Google Cloud Console](https://console.cloud.google.com/) and check quota usage. |
| **Container Port Conflicts** | Ensure ports 80, 443, 5432, and 6379 are not in use by other services on your machine. |
| **Migration Failures** | Check that the database container is fully started before the backend attempts migrations. Use `make dev-logs` to inspect startup order. |
| **Redis Connection Refused** | Ensure Redis container is healthy. Check with `docker compose ps` and restart with `docker compose restart redis`. |

---

## Additional Resources

- **API Documentation:** http://localhost/api/docs (Swagger UI)
- **CLAUDE.md:** See `CLAUDE.md` for detailed architecture and codebase documentation
- **Environment Reference:** See `.env.example` for all available configuration options
