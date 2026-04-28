# 🎬 YouTube Video Sharing

> Share YouTube videos with real-time notifications. 

https://github.com/user-attachments/assets/f93479ea-bde2-41b2-8e2b-58258f6e6547


### Key Features

- User registration and login
- Sharing YouTube videos
- Viewing a list of shared videos 
- Real-time notifications when a user share video



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






---

## ⚡ Get Running in 2 Minutes 

**Prerequisites:** Docker 24.0+ · Docker Compose 2.20+ · Make (run `Makefile` shortcuts ) · Git 2.40+ · [YouTube Data API v3 Key](https://console.cloud.google.com/)

```bash
# 1. Clone & configure
git clone https://github.com/le-dat/youtube-video-sharing.git
cd youtube-video-sharing
cp .env.example .env.dev
# → Fill YOUTUBE_API_KEY in .env.dev (required)

# 2. Start everything
make dev-up

# 3. Open
http://localhost          # App
http://localhost/api/docs # API docs
```

Stop: `make dev-down` | Logs: `make dev-logs`

**Services:** postgres :5432 · redis :6379 · backend :3000 · frontend :80 · nginx :80/:443

---

## 💻 Native Development

Requires: Node 22 LTS · pnpm 8+ · PostgreSQL 15+ · Redis 7+

```bash
# Terminal 1 — Backend
cd src/backend && pnpm install && pnpm dev

# Terminal 2 — Frontend
cd src/frontend && pnpm install && pnpm dev
```

Set `DATABASE_HOST=localhost` and `REDIS_HOST=localhost` in `.env.dev`.

---



## 🗄️ Database Setup


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


## 🔧 Troubleshooting

| Symptom | Fix |
| ------- | --- |
| `make dev-up` fails | Use `make dev-up` (not `docker compose up`) — Makefile passes `.env.dev` |
| Backend exits on startup | Missing/invalid `YOUTUBE_API_KEY` — get one from [Google Cloud Console](https://console.cloud.google.com/) |
| WebSocket not working | Check `nginx.conf` has `Upgrade` and `Connection` headers |
| YouTube API 403/quota | Verify YouTube Data API v3 enabled + quota at [Google Cloud Console](https://console.cloud.google.com/) |
| Port 80 in use | `sudo lsof -i :80` → stop conflicting process |
| Migration fails | `make dev-down && make dev-up` — health check will sort timing |
| `pnpm: command not found` | `npm install -g pnpm` |
| Redis connection refused | `redis-server` or `docker run -d -p 6379:6379 redis:7` |
| Frontend blank / API 404 | Confirm `VITE_API_URL=http://localhost/api/v1` in `.env.dev` |
| CI/CD SSH fails | Check `~/.ssh/authorized_keys` on VPS; update `VPS_SSH_KEY` in GitHub Secrets |

---

## 🧪 Testing

```bash
cd src/backend

pnpm test          # Unit tests
pnpm test:cov      # + coverage report

# E2E (requires Docker)
docker compose -f docker-compose.e2e.yml up -d
pnpm test:e2e
docker compose -f docker-compose.e2e.yml down
```

---

## 🚀 Production Deployment (VPS)

**1. Prepare VPS** — install Docker, clone repo, create `.env`

**2. GitHub Secrets** → Settings → Secrets and variables → Actions:

| Secret | Value |
| ------ | ----- |
| `VPS_HOST` | VPS IP address |
| `VPS_USER` | SSH username (e.g., `ubuntu`) |
| `VPS_SSH_KEY` | Private key contents (`~/.ssh/id_rsa`) |

**3. Push to `main`** — CI/CD automatically:
1. Run tests
2. Build Docker images
3. Push to `ghcr.io/le-dat/youtube-video-sharing`
4. SSH into VPS
5. Pull images + recreate containers

---

## 📂 Project Structure

```
youtube-video-sharing/
├── src/
│   ├── backend/           # NestJS application
│   │   └── src/
│   │       ├── auth/      # JWT authentication
│   │       ├── users/     # User CRUD
│   │       ├── videos/    # Video sharing + voting
│   │       └── websocket/ # Real-time events
│   └── frontend/          # React + Vite + TailwindCSS
├── docker-compose.yml
├── docker-compose.prod.yml
├── docker-compose.e2e.yml
└── Makefile
```


