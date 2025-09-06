.PHONY: bootstrap up down migrate seed test clean

bootstrap:
	@echo "Setting up development environment..."
	cp env.example .env
	@echo "Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install
	@echo "Installing Python dependencies..."
	cd backend && poetry install
	@echo "Installing Node dependencies..."
	cd frontend && pnpm install
	@echo "Bootstrap complete!"

up:
	docker-compose up --build

down:
	docker-compose down

migrate:
	docker-compose exec backend python manage.py migrate

seed:
	docker-compose exec backend python manage.py loaddata fixtures/initial_data.json

test:
	docker-compose exec backend pytest
	cd frontend && pnpm test

test-coverage:
	docker-compose exec backend poetry run coverage run --source='.' manage.py test
	docker-compose exec backend poetry run coverage report
	docker-compose exec backend poetry run coverage html
	docker-compose exec backend poetry run coverage xml
	@echo "Coverage reports generated:"
	@echo "  - HTML: backend/htmlcov/index.html"
	@echo "  - XML: backend/coverage.xml"

test-coverage-report:
	docker-compose exec backend poetry run coverage report

clean:
	docker-compose down -v
	docker system prune -f
