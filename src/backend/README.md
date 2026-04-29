# YouTube Video Sharing - Backend

NestJS backend for YouTube video sharing application with real-time notifications.

## Tech Stack

- **Framework:** NestJS (Node.js)
- **Database:** PostgreSQL 15 (TypeORM)
- **Cache/Session:** Redis 7 (ioredis)
- **Real-time:** Socket.io
- **Auth:** JWT (access + refresh tokens)

## Commands

```bash
pnpm install          # Install dependencies
pnpm build            # Build (dist/)
pnpm start            # Start (production)
pnpm start:dev        # Watch mode
pnpm lint             # ESLint + fix
pnpm test             # Unit tests
pnpm test:cov         # + coverage report
pnpm test:e2e         # E2E tests (requires Docker)
pnpm migration:run    # Apply migrations
pnpm migration:revert # Revert last migration
pnpm seed             # Seed sample data
```

## Architecture

### Modules

| Module | Description |
| ------ | ----------- |
| `AuthModule` | JWT authentication with access/refresh tokens. Refresh tokens stored in Redis. |
| `UsersModule` | User CRUD with bcrypt password hashing. |
| `VideosModule` | Video sharing with denormalized vote counts (`upvoteCount`, `downvoteCount`). |
| `YoutubeModule` | YouTube Data API v3 integration. |
| `WebsocketModule` | Socket.io gateway on `/events` namespace. Emits `newVideo` and `videoUpdate`. |
| `HealthModule` | `/health` endpoint for readiness checks. |
| `RedisModule` | ioredis client, shared service. |

### Auth Flow

1. `POST /auth/login` or `POST /auth/register` → returns JWTs set as HTTP-only cookies
2. `JwtStrategy` validates JWTs on protected routes
3. `JwtAuthGuard` protects routes; `@Public()` decorator bypasses throttling + auth
4. `POST /auth/refresh` validates refresh token against Redis and issues new access token
5. `POST /auth/logout` revokes refresh token in Redis and clears cookies

### Database

- TypeORM with `autoLoadEntities: true`
- `synchronize: true` only in development
- Entities: `User` (uuid PK, email/username unique), `Video` (uuid PK, denormalized counts), `Vote` (composite unique on userId+videoId)

## Environment Variables

See `.env.example`. Required in production:

- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `REDIS_HOST`, `REDIS_PORT`
- `YOUTUBE_API_KEY`

## Project Structure

```
src/
├── auth/           # JWT authentication
├── users/          # User CRUD
├── videos/         # Video sharing + voting
├── websocket/      # Real-time events
└── health/         # Readiness checks
```