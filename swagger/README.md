# Swagger API Sections

This folder documents all existing Spring Boot APIs currently available in the backend.

## Run and open Swagger UI

1. Start backend:
   - `cd backend && ./mvnw spring-boot:run`
2. Open Swagger UI:
   - `http://localhost:8080/swagger-ui.html`
3. Open OpenAPI JSON:
   - `http://localhost:8080/v3/api-docs`

## Existing API code location

- Controllers folder:
  - `backend/src/main/java/com/example/hy_backend/controller`
- OpenAPI config:
  - `backend/src/main/java/com/example/hy_backend/config/OpenApiConfig.java`

## API Sections and Endpoints

### Authentication

Source:
- `backend/src/main/java/com/example/hy_backend/controller/AuthController.java`

Endpoints:
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/current-user

### Facility

Source:
- `backend/src/main/java/com/example/hy_backend/controller/FacilityController.java`

Endpoints:
- POST /api/facilities
- GET /api/facilities
- GET /api/facilities/{facilityId}
- PUT /api/facilities/{facilityId}
- DELETE /api/facilities/{facilityId}
- POST /api/facilities/{facilityId}/publish
- GET /api/facilities/{facilityId}/specification

### Field Builder (Template Builder)

Source:
- `backend/src/main/java/com/example/hy_backend/controller/FieldController.java`

Endpoints:
- POST /api/facilities/{facilityId}/fields
- POST /api/fields/{fieldId}/options
- GET /api/facilities/{facilityId}/fields
- PUT /api/fields/{fieldId}
- DELETE /api/fields/{fieldId}

### Rules

Source:
- `backend/src/main/java/com/example/hy_backend/controller/RuleController.java`

Endpoints:
- POST /api/facilities/{facilityId}/rules
- GET /api/facilities/{facilityId}/rules
- PUT /api/facilities/{facilityId}/rules

### Booking

Source:
- `backend/src/main/java/com/example/hy_backend/controller/BookingController.java`

Endpoints:
- POST /api/bookings
- GET /api/bookings/history/{employeeId}
- GET /api/bookings/{bookingId}
- DELETE /api/bookings/{bookingId}

### Employee

Source:
- `backend/src/main/java/com/example/hy_backend/controller/EmployeeController.java`

Endpoints:
- GET /api/dashboard

### Reports

Source:
- `backend/src/main/java/com/example/hy_backend/controller/ReportController.java`

Endpoints:
- GET /api/reports/daily
- GET /api/reports/facility/{facilityId}
- GET /api/reports/analytics

### Specification

Source:
- `backend/src/main/java/com/example/hy_backend/controller/SpecificationController.java`

Endpoints:
- POST /api/specifications/upload
- GET /api/specifications/template
