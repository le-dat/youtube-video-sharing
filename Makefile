.PHONY: prod-up

prod-up:
	@echo "Deploying Production..."
	docker compose up -d --build
