.PHONY: db-connect db-stop db-start db-restart migrate-up migrate-down migrate-create

# Database connection variables
DB_USER = postgres
DB_PASSWORD = postgres
DB_NAME = marketx
CONTAINER_NAME = postgres_db
MIGRATIONS_DIR = migrations

# Force migration version
migrate-force:
	@read -p "Enter version to force: " version; \
	migrate -path $(MIGRATIONS_DIR) -database "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(DB_NAME)?sslmode=disable" force $$version
# Connect to PostgreSQL database
db-connect:
	docker exec -it $(CONTAINER_NAME) psql -U $(DB_USER) -d $(DB_NAME)

# Start the database container
docker-start:
	docker compose up -d

# Stop the database container
docker-stop:
	docker compose down

# Restart the database container
docker-restart:
	docker-compose down
	docker-compose up -d

# Create a new migration file
migrate-create:
	@read -p "Enter migration name: " name; \
	migrate create -ext sql -dir $(MIGRATIONS_DIR) -seq $${name}

# Apply all up migrations
migrate-up:
	migrate -path $(MIGRATIONS_DIR) -database "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(DB_NAME)?sslmode=disable" up

# Rollback the last migration
migrate-down:
	migrate -path $(MIGRATIONS_DIR) -database "postgresql://$(DB_USER):$(DB_PASSWORD)@localhost:5432/$(DB_NAME)?sslmode=disable" down 1