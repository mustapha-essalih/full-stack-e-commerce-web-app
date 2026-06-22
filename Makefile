.PHONY: up down build migrate seed test lint shell logs

UID := $(shell id -u)
GID := $(shell id -g)

export UID
export GID

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

migrate:
	docker compose exec app php artisan migrate

seed:
	docker compose exec app php artisan db:seed

test:
	docker compose exec app php artisan test

lint:
	@echo "=== PHPStan ==="
	docker compose exec app vendor/bin/phpstan analyse --no-progress || true
	@echo ""
	@echo "=== PHP-CS-Fixer (dry-run) ==="
	docker compose exec app vendor/bin/php-cs-fixer fix --dry-run --diff --allow-risky=yes || true
	@echo ""
	@echo "=== ESLint ==="
	docker compose exec vite npx eslint src/ || true
	@echo ""
	@echo "=== Prettier (check) ==="
	docker compose exec vite npx prettier --check "src/**/*.{ts,tsx,js,jsx,css,json}"

lint-fix:
	@echo "=== PHP-CS-Fixer ==="
	docker compose exec app vendor/bin/php-cs-fixer fix --allow-risky=yes
	@echo ""
	@echo "=== ESLint ==="
	docker compose exec vite npx eslint --fix src/
	@echo ""
	@echo "=== Prettier ==="
	docker compose exec vite npx prettier --write "src/**/*.{ts,tsx,js,jsx,css,json}"

shell:
	docker compose exec app bash

logs:
	docker compose logs -f

telescope-migrate:
	docker compose exec app php artisan telescope:install
	docker compose exec app php artisan migrate

restart:
	docker compose restart

destroy:
	docker compose down -v
