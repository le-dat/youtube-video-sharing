.PHONY: dev-up dev-down dev-logs

dev-up:
	@echo "Starting local development environment..."
	docker compose --env-file .env.dev up -d --build

dev-down:
	@echo "Stopping local development environment..."
	docker compose --env-file .env.dev down

dev-logs:
	docker compose --env-file .env.dev logs -f
