# Facilities App

> Status: Active Development

A web application for managing Hyland India employee facility bookings. This repository is currently focused on the employee flow only.

## Overview

The app provides a single place for employees to:

- View hybrid workday dashboard status
- Choose a booking date from calendar chips
- Run Book My Workday (Lunch + Cab)
- Submit facility-specific bookings
- Review booking history and booking details
- Cancel bookings where allowed

## Employee Features (Implemented)

- Authentication
   - Login, current-user, logout
- Dashboard
   - Employee home summary
   - Date chip selection for booking day
   - Quick setup entry to workday booking
- Book My Workday
   - Date-aware quick setup flow
   - Confirm Lunch / Confirm Cab
   - Combined confirm workday action
- Facility Booking
   - Dynamic form rendering from backend specification
- Booking Management
   - History, detail, and cancellation
- Profile and Invitations

## Tech Stack

### Frontend

- Angular 19
- Tailwind CSS
- npm

### Backend

- Java 21 + Spring Boot 3.5
- Maven Wrapper
- Spring Data JPA
- H2 (default local runtime)
- OpenAPI / Swagger

## Project Structure

facilities-app/
├── backend/            # Spring Boot application
├── frontend/           # Angular application
├── docs/               # Flow and reference docs
└── swagger/            # API references

## Getting Started

### Prerequisites

- JDK 21+
- Node.js 18+

### 1. Backend Setup

Windows PowerShell:

```powershell
Set-Location backend
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Backend runs at:

- http://localhost:8080

Swagger UI:

- http://localhost:8080/swagger-ui.html

### 1b. Backend with PostgreSQL

Windows PowerShell:

```powershell
Set-Location backend
docker compose -f docker-compose.postgres.yml up -d
$env:SPRING_PROFILES_ACTIVE = "postgres"
$env:DB_URL = "jdbc:postgresql://localhost:5432/hyhub"
$env:DB_USERNAME = "hyhub_app"
$env:DB_PASSWORD = "hyhub_app"
.\mvnw.cmd spring-boot:run
```

Details:

- docs/postgresql-integration.md

### 2. Frontend Setup

Windows PowerShell:

```powershell
Set-Location frontend
npm install
npm start
```

Frontend runs at:

- http://localhost:4200

## Employee Flow Routes

- /login
- /employee/dashboard
- /employee/workday-setup
- /employee/facility/:facilityId/book
- /employee/history
- /employee/bookings/:bookingId
- /employee/invitations
- /employee/profile

Detailed sequence and API mapping:

- docs/employee-flow.md

## API Documentation

Once backend is running:

- Swagger UI: http://localhost:8080/swagger-ui.html
