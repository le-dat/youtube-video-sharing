# 🎬 YouTube Video Sharing Application

> A full-stack web platform for sharing YouTube videos with real-time notifications, built with NestJS, React, PostgreSQL, Redis, and WebSockets.


https://github.com/user-attachments/assets/f93479ea-bde2-41b2-8e2b-58258f6e6547

[![CI/CD](https://github.com/le-dat/youtube-video-sharing/actions/workflows/deploy.yml/badge.svg)](https://youtube-sharing.duckdns.org)

---

## 📑 Table of Contents

- [Introduction](#-introduction)
- [Prerequisites](#-prerequisites)
- [Installation & Configuration](#-installation--configuration)
- [Database Setup](#-database-setup)
- [Running the Application](#-running-the-application)
- [Docker Deployment](#-docker-deployment)
- [Usage](#-usage)
- [Troubleshooting](#-troubleshooting)

---

## 📖 Introduction

The **YouTube Video Sharing Application** is a full-stack platform that allows authenticated users to share YouTube videos and receive instant real-time notifications when new content is posted. The system is designed for scalability and developer experience using a modern, containerized tech stack.

### Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   React +   │────▶│    Nginx    │────▶│  NestJS Backend │
│    Vite     │     │ (Reverse    │     │  (REST + WS)    │
│  Frontend   │◀────│  Proxy)     │◀────│                 │
└─────────────┘     └─────────────┘     └────────┬────────┘
                                                  │
                                       ┌──────────┴──────────┐
                                       │                     │
                                ┌──────▼──────┐   ┌─────────▼──────┐
                                │ PostgreSQL  │   │     Redis       │
                                │  Database  │   │  (Session/Cache)│
                                └────────────┘   └────────────────┘
```

### Tech Stack

| Layer               | Technology                                             |
| ------------------- | ------------------------------------------------------ |
| **Frontend**        | React 18, Vite, TailwindCSS, Zustand, Socket.io Client |
| **Backend**         | NestJS, TypeORM, Socket.io                             |
| **Database**        | PostgreSQL 15                                          |
| **Cache / Session** | Redis 7                                                |
| **Infrastructure**  | Docker, Docker Compose, Nginx, GitHub Actions, GHCR    |

### Key Features

- 🔐 **Secure Authentication** — Registration & login with HTTP-only JWT cookies (access + refresh token rotation)
- 📹 **YouTube Video Sharing** — Paste a YouTube URL; title and description are auto-fetched via YouTube Data API v3
- 🔔 **Real-time Notifications** — WebSocket (Socket.io) broadcasts new video shares to all connected clients instantly
- 👍 **Voting System** — Authenticated users can upvote/downvote videos; counts sync in real-time
- 📱 **Responsive UI** — Mobile-first design built with TailwindCSS
- 🚀 **CI/CD Pipeline** — Automated Docker build, push to GHCR, and SSH deploy on every push to `main`
- 📚 **API Documentation** — Interactive Swagger UI available at `/api/docs`

---

## ✅ Prerequisites

### Required (for Docker-based setup — recommended)

| Software                    | Minimum Version | Notes                                                                                             |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| **Docker**                  | 24.0+           | Container runtime                                                                                 |
| **Docker Compose**          | 2.20+           | Multi-container orchestration                                                                     |
| **Make**                    | any             | To run `Makefile` shortcuts                                                                       |
| **Git**                     | 2.40+           | To clone the repository                                                                           |
| **YouTube Data API v3 Key** | —               | Required for video metadata. Get one at [Google Cloud Console](https://console.cloud.google.com/) |

### Optional (for native / non-Docker development)

| Software       | Minimum Version | Notes                                 |
| -------------- | --------------- | ------------------------------------- |
| **Node.js**    | 22 LTS          | JavaScript runtime                    |
| **pnpm**       | 8+              | Package manager (or use `npm`/`yarn`) |
| **PostgreSQL** | 15+             | Relational database                   |
| **Redis**      | 7+              | In-memory cache/session store         |

---

## ⚙️ Installation & Configuration

### 1. Clone the repository

```bash
git clone https://github.com/le-dat/youtube-video-sharing.git
cd youtube-video-sharing
```

### 2. Set up environment variables

```bash
cp .env.example .env.dev
```

Open `.env.dev` and fill in your values:

```env
# ── Database ──────────────────────────────────────────────
DATABASE_NAME=youtube_share
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password_here

# ── JWT Secrets (minimum 32 characters each) ──────────────
JWT_ACCESS_SECRET=your_access_token_secret_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars_here
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ── YouTube API ───────────────────────────────────────────
YOUTUBE_API_KEY=your_youtube_api_key_here

# ── CORS & URLs ───────────────────────────────────────────
CORS_ORIGIN=http://localhost:5173

# ── Frontend (Vite) ───────────────────────────────────────
VITE_API_URL=http://localhost/api/v1
VITE_WS_URL=ws://localhost/events
```

> **⚠️ Important:** `YOUTUBE_API_KEY` is required. Without it, video metadata fetching will fail. Obtain a key from [Google Cloud Console](https://console.cloud.google.com/), enable the **YouTube Data API v3**, and create credentials.

### 3. Verify your environment

```bash
docker --version        # Docker version 24.x.x
docker compose version  # Docker Compose version v2.x.x
```

---

## 🗄️ Database Setup

The application uses **PostgreSQL** as its primary database and **Redis** for session/token storage. TypeORM handles all schema migrations automatically.

### With Docker (Recommended)

No manual setup is needed. When you run `make dev-up`, the following happens automatically:

1. A PostgreSQL container starts with a named volume for data persistence.
2. A Redis container starts for session storage.
3. The NestJS backend waits for PostgreSQL to be healthy, then runs all pending migrations on startup.

### Without Docker (Native)

**Step 1 — Create the PostgreSQL database:**

```bash
psql -U postgres -c "CREATE DATABASE youtube_share;"
```

**Step 2 — Run migrations:**

```bash
cd src/backend
pnpm install
pnpm migration:run
```

**Step 3 — (Optional) Seed sample data:**

```bash
pnpm seed
```

### Migration Commands Reference

| Command                          | Description                                  |
| -------------------------------- | -------------------------------------------- |
| `pnpm migration:run`             | Apply all pending migrations                 |
| `pnpm migration:revert`          | Revert the last applied migration            |
| `pnpm migration:generate <Name>` | Generate a new migration from entity changes |

---

## 🚀 Running the Application

### Option A — Docker Compose (Recommended)

**Start all services:**

```bash
make dev-up
```

This single command will:

- Build Docker images for the backend and frontend
- Start PostgreSQL, Redis, backend API, frontend, and Nginx
- Run database migrations automatically

**Access the application:**

| URL                         | Description               |
| --------------------------- | ------------------------- |
| `http://localhost`          | Main application          |
| `http://localhost/api/docs` | Swagger API documentation |

**Useful commands:**

```bash
make dev-logs    # Stream logs from all containers
make dev-down    # Stop and remove all containers
```

### Option B — Native Development

```bash
# Terminal 1 — Backend
cd src/backend
pnpm install
pnpm start:dev

# Terminal 2 — Frontend
cd src/frontend
pnpm install
pnpm dev
```

> Make sure PostgreSQL and Redis are running locally and `.env.dev` has `DATABASE_HOST=localhost` and `REDIS_HOST=localhost`.

### Running the Test Suite

```bash
cd src/backend

# Unit tests
pnpm test

# Unit tests with coverage report
pnpm test:cov

# End-to-end tests (requires Docker services running)
docker compose -f docker-compose.e2e.yml up -d
pnpm test:e2e
docker compose -f docker-compose.e2e.yml down
```

**Expected output:**

```
PASS  src/auth/auth.service.spec.ts
PASS  src/videos/videos.service.spec.ts
PASS  src/users/users.service.spec.ts

Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
```

---

## 🐳 Docker Deployment

### Local Build & Run

```bash
# Build all images
docker compose -f docker-compose.prod.yml build

# Start all services in detached mode
docker compose -f docker-compose.prod.yml up -d

# View running containers
docker compose -f docker-compose.prod.yml ps

# Stop all services
docker compose -f docker-compose.prod.yml down
```

### Production Deployment (VPS + GHCR CI/CD)

This project uses a CI/CD pipeline where GitHub Actions builds Docker images, pushes them to GitHub Container Registry (GHCR), then deploys them to your VPS via SSH.

#### Step 1 — Prepare your VPS

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Clone the repository
git clone https://github.com/le-dat/youtube-video-sharing.git
cd youtube-video-sharing

# Create the production environment file
cp .env.example .env
# Edit .env with production values (domain, secrets, API keys)
```

Edit `.env` on the VPS for production:

```env
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api/v1
VITE_WS_URL=wss://yourdomain.com/events
# ... all other variables
```

#### Step 2 — Configure GitHub Secrets

In your GitHub repository, go to **Settings → Secrets and variables → Actions** and add:

| Secret        | Value                                              |
| ------------- | -------------------------------------------------- |
| `VPS_HOST`    | Your VPS IP address                                |
| `VPS_USER`    | SSH username (e.g., `ubuntu`, `root`)              |
| `VPS_SSH_KEY` | Contents of your private SSH key (`~/.ssh/id_rsa`) |

#### Step 3 — Automated Deployment Flow

On every push to `main`, GitHub Actions will:

1. ✅ Run the test suite
2. 🐳 Build Docker images for frontend and backend
3. 📦 Push images to `ghcr.io/le-dat/youtube-video-sharing`
4. 🔗 SSH into the VPS
5. ⬇️ Pull the latest images
6. 🔄 Recreate containers using `docker-compose.prod.yml`

#### Docker Compose Services Overview

| Service    | Description                          | Port             |
| ---------- | ------------------------------------ | ---------------- |
| `postgres` | PostgreSQL 15 with persistent volume | 5432 (internal)  |
| `redis`    | Redis 7 for sessions & caching       | 6379 (internal)  |
| `backend`  | NestJS REST API + WebSocket server   | 3000 (internal)  |
| `frontend` | React/Vite static build              | 80 (internal)    |
| `nginx`    | Reverse proxy & TLS termination      | 80, 443 (public) |

---

## 📱 Usage

### 1. Register or Log In

Navigate to `http://localhost` and create a new account, or log in with existing credentials. Authentication uses HTTP-only cookies — no tokens are exposed to JavaScript.

### 2. Share a YouTube Video

Once logged in:

1. Click the **"Share a movie"** button in the top navigation bar.
2. Paste a valid YouTube URL into the input field.  
   Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. Click **Share**. The backend validates the URL and fetches the video title and description via YouTube Data API v3.
4. Your video appears in the shared videos feed immediately.

### 3. Receive Real-time Notifications

Open a second browser window (or incognito tab) and log in with a different account. When a video is shared in the first window, a toast notification pops up in the second window in real time — no page refresh needed.

### 4. Vote on Videos

Any authenticated user can upvote or downvote a shared video using the thumbs-up/down buttons on each video card. Vote counts update live across all connected clients.

### 5. API Documentation

The full REST API is documented with Swagger UI:

```
http://localhost/api/docs
```

---

## 🔧 Troubleshooting

| Problem                                       | Likely Cause                                                | Solution                                                                                                                             |
| --------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **`make dev-up` fails with env errors**       | `docker compose up` doesn't auto-load `.env.dev`            | Always use `make dev-up` — the Makefile passes `--env-file .env.dev` automatically                                                   |
| **Backend exits on startup**                  | Missing or invalid `YOUTUBE_API_KEY`                        | Ensure `YOUTUBE_API_KEY` is set in `.env.dev` with a valid key from Google Cloud Console                                             |
| **WebSocket / notifications not working**     | Nginx not forwarding upgrade headers                        | Verify `nginx.conf` includes `proxy_set_header Upgrade $http_upgrade;` and `proxy_set_header Connection "upgrade";`                  |
| **YouTube API returns 403 or quota exceeded** | Daily quota (10,000 units/day) exhausted or API not enabled | Check quota at [Google Cloud Console](https://console.cloud.google.com/) and confirm YouTube Data API v3 is enabled for your project |
| **Port 80 already in use**                    | Apache or another process bound to port 80                  | Run `sudo lsof -i :80`, stop the conflicting process, or change the Nginx port in `docker-compose.yml`                               |
| **Database migration failure**                | PostgreSQL not ready before backend starts                  | Run `make dev-down && make dev-up` to restart cleanly; health checks should resolve timing                                           |
| **`pnpm: command not found`**                 | pnpm not installed                                          | Install with `npm install -g pnpm`                                                                                                   |
| **Redis connection refused (native dev)**     | Redis not running locally                                   | Start with `redis-server` or use Docker: `docker run -d -p 6379:6379 redis:7`                                                        |
| **Frontend shows blank page / API 404**       | `VITE_API_URL` pointing to wrong address                    | Confirm `VITE_API_URL=http://localhost/api/v1` in `.env.dev`                                                                         |
| **CI/CD SSH into VPS fails**                  | `VPS_SSH_KEY` incorrect or public key missing on VPS        | Verify `~/.ssh/authorized_keys` on the VPS contains your public key; update the GitHub secret if needed                              |

---

## 📚 Additional Resources

- 🌐 **Live Demo:** [https://youtube-sharing.duckdns.org](https://youtube-sharing.duckdns.org)
- 📖 **Swagger API Docs:** `http://localhost/api/docs` (when running locally)
- 🏗️ **Architecture Details:** See `CLAUDE.md` in the repository root
- 🔑 **Environment Reference:** See `.env.example` for all available configuration variables
