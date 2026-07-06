# PostgreSQL Integration Guide

This project supports PostgreSQL via the `postgres` Spring profile.

## 1. Start PostgreSQL (Docker)

From the `backend` folder:

```powershell
Set-Location backend
docker compose -f docker-compose.postgres.yml up -d
```

## 2. Run Backend with PostgreSQL Profile

```powershell
Set-Location backend
$env:SPRING_PROFILES_ACTIVE = "postgres"
$env:DB_URL = "jdbc:postgresql://localhost:5432/hyhub"
$env:DB_USERNAME = "hyhub_app"
$env:DB_PASSWORD = "hyhub_app"
.\mvnw.cmd spring-boot:run
```

## 3. Verify Schema and Migrations

- Flyway executes migrations from `classpath:db/migration`.
- JPA runs in `validate` mode and fails startup when schema drifts.
- Demo seed data is disabled outside `local` profile.

## 4. Operational Notes

- Connection pool is configured through Hikari parameters in `application-postgres.properties`.
- Use environment variables to tune pool sizes and timeouts.
- Keep migration files immutable once deployed to shared environments.
