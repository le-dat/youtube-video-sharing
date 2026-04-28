# YouTube Sharing Application

## Introduction
The YouTube Sharing Application is a full-stack web platform that allows users to share YouTube videos and receive real-time notifications when new content is posted. Built with a modern, scalable tech stack, it provides a seamless and responsive user experience for discovering and sharing video content.

Key Features:
- User Authentication (Registration & Login securely managed via HTTP-only JWT cookies)
- Share YouTube videos with automatic metadata extraction
- Real-time WebSocket notifications for newly shared videos across all connected clients
- Responsive, modern UI built with React and Vite
- Robust, modular backend built with NestJS and TypeORM

## Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v20 or higher recommended)
- **pnpm** (v9+ recommended, or npm/yarn)
- **Docker and Docker Compose** (for database, Redis, and full-stack deployment)
- **YouTube Data API v3 Key** (Required to fetch video details)

## Installation & Configuration

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd youtube-sharing/nestjs
   ```

2. **Backend Configuration:**
   Navigate to the backend directory and set up your environment variables:
   ```bash
   cd src/backend
   cp .env.example .env
   ```
   Open `src/backend/.env` and configure your credentials. **You must provide a valid `YOUTUBE_API_KEY`** for the sharing feature to work.

3. **Frontend Configuration:**
   Navigate to the frontend directory and set up your environment variables:
   ```bash
   cd ../frontend
   cp .env.example .env
   ```
   Update `VITE_API_URL` and `VITE_WS_URL` to point to your local backend (typically `http://localhost:5000/api` and `http://localhost:5000`).

4. **Install Dependencies:**
   Install dependencies for both projects using `pnpm`:
   ```bash
   # From the nestjs root directory
   cd src/backend && pnpm install
   cd ../frontend && pnpm install
   cd ../..
   ```

## Database Setup

For local development, the easiest way to run PostgreSQL and Redis is via Docker:

1. **Start the database containers:**
   From the root `nestjs` directory:
   ```bash
   docker compose up -d postgres redis
   ```

2. **Run Database Migrations:**
   The backend uses TypeORM to manage the schema. Run the initial migration to set up your tables:
   ```bash
   cd src/backend
   pnpm run migration:run
   ```

## Running the Application

To run the application locally for development:

1. **Start the Backend:**
   ```bash
   cd src/backend
   pnpm run start:dev
   ```
   The backend will start at `http://localhost:5000`. 
   *Note: You can view the interactive Swagger API documentation at `http://localhost:5000/api/docs`.*

2. **Start the Frontend:**
   Open a new terminal window:
   ```bash
   cd src/frontend
   pnpm run dev
   ```
   The frontend will be accessible at `http://localhost:5173` (or the port specified by Vite).

## Docker Deployment (Production)

The project includes a fully automated Docker Compose setup tailored for production VPS deployment.

1. **Set up the root environment file:**
   Create a `.env` file in the root `nestjs` directory based on `.env.example`.
   ```bash
   cp .env.example .env
   ```
   Fill in the required database credentials, JWT secrets, and your YouTube API key.

2. **Deploy the application:**
   A `Makefile` is provided to simplify full-stack deployment. Run:
   ```bash
   make prod-up
   ```
   This command will:
   - Build optimized production Docker images for the Backend and Frontend.
   - Start PostgreSQL, Redis, the Backend API, Frontend static server, and an Nginx reverse proxy.
   - Automatically run TypeORM database migrations on backend startup.

The unified application will be accessible at `http://localhost/` via the Nginx gateway.

## Usage
1. **Register/Login:** Open the frontend application and create a new account or log in with an existing one.
2. **Share a Video:** Once logged in, click on "Share a movie" and paste a valid YouTube URL. The backend will validate the URL and fetch the video's title and description using the YouTube API.
3. **Real-time Notifications:** Open a second browser window (or an incognito tab). When a video is shared in the first window, a real-time notification popup will instantly appear in the second window via WebSockets.

## Troubleshooting

- **WebSocket Connection Fails:** Ensure that `VITE_WS_URL` does not contain the `/api` suffix. If deploying via Nginx, ensure the reverse proxy supports Protocol Upgrade headers for WebSockets.
- **YouTube API Error / Videos Not Loading:** The `YOUTUBE_API_KEY` has daily limits and requires proper configuration. If fetching fails, verify your API key in the Google Cloud Console.
- **Database Connection Refused:** Verify that the `postgres` Docker container is running (`docker ps`) and that the credentials in your `.env` exactly match the Docker configuration.
- **Swagger Returns 404 Error:** Ensure you access Swagger at `/api/docs` rather than `/docs`. The global `/api` prefix is enforced across the application.
