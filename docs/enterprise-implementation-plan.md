# Specification-Driven Employee Facility Management Platform

This document defines the enterprise implementation sequence and the architectural contract.

## Module 1: Project Structure (Completed)

### Objective
Establish a predictable, enterprise-ready delivery baseline with environment-specific configuration and migration-first data management.

### Architecture standards
- Java 21, Spring Boot 3, Maven
- Layered architecture with clear package boundaries:
  - `controller`
  - `service`
  - `serviceimpl`
  - `repository`
  - `model`
  - `dto`
  - `mapper`
  - `exception`
  - `config`
  - `security`
- API-first development with OpenAPI/Swagger
- Configuration by runtime profile (`local`, `postgres`)
- No schema creation from Hibernate auto-update in enterprise environments

### Deliverables implemented
- Added Flyway dependency to backend Maven build.
- Switched JPA mode to validation (`spring.jpa.hibernate.ddl-auto=validate`).
- Enabled Flyway and migration location in base application config.
- Added `application-local.properties` and `application-postgres.properties`.

## Module 2: Database Schema (Completed)

### Objective
Create a normalized schema for specification-driven facilities and dynamic bookings that supports both admin configuration and employee execution flows.

### Design principles
- Full normalization of configuration vs transactional data.
- Strict foreign keys for referential integrity.
- Explicit indexes on high-frequency filter and join paths.
- Auditable operational data (notifications, audit logs).

### Tables implemented
- `employees`
- `facilities`
- `facility_fields`
- `field_options`
- `facility_rules`
- `bookings`
- `booking_responses`
- `notifications`
- `audit_logs`

### Migration
- `backend/src/main/resources/db/migration/V1__init_specification_platform_schema.sql`

### Compatibility notes
- Existing entities remain compatible with generated schema.
- No seed data is created on startup. All employees and facilities must be created through the application interfaces.

## Module 3: Entity Classes (Completed)

### Objective
Harden entity model to align with schema and enterprise conventions.

### Deliverables implemented
- Added entity classes for `Employee`, `Notification`, and `AuditLog` aligned to schema.
- Extended existing entities to match dynamic specification schema:
  - `FieldDefinition`: `validationJson`, `defaultValue`
  - `FacilityRule`: `bookingStartTime`, `maximumCapacity`
  - `Booking`: read-only relation to `Employee` while preserving `employeeId` API contract
- Preserved current API and service behavior to avoid regressions during phased rollout.

## Module 4: Repository Layer (Completed)

### Objective
Provide enterprise repository contracts for all persisted aggregates and operational logs.

### Deliverables implemented
- Added `EmployeeRepository` with identity and activity queries.
- Added `NotificationRepository` with employee and delivery-status query methods.
- Added `AuditLogRepository` with entity-centric and actor-centric audit lookup.

## Module 5: DTO Layer (Completed)

### Objective
Define stable API contracts for dynamic specifications, operational events, and future module expansion.

### Deliverables implemented
- Enhanced dynamic field DTOs with `validationJson` and `defaultValue`.
- Enhanced rule DTOs with `bookingStartTime` and `maximumCapacity`.
- Enhanced employee-facing facility specification DTOs with full field metadata and extended rules.
- Added enterprise DTO groups:
  - `NotificationDtos`
  - `AuditDtos`

## Module 6: Service Layer (Completed)

### Objective
Establish service segregation and orchestration for employee operations, notifications, and auditability.

### Deliverables implemented
- Added dedicated `EmployeeService` and `EmployeeServiceImpl` for dashboard, home summary, profile, and invitations.
- Added `NotificationService` and `NotificationServiceImpl` for operational notification lifecycle.
- Added `AuditService` and `AuditServiceImpl` for centralized audit logging.
- Refactored authentication service to resolve employees from repository and publish auth audit events.
- Refactored booking service to emit notification and audit events for booking create/cancel workflows.
- Refactored `EmployeeController` to depend on `EmployeeService` instead of `FacilityService`.

## Module 7: Controller Layer (Completed)

### Objective
Expose role-oriented APIs for operational modules while preserving compatibility with existing employee and admin flows.

### Deliverables implemented
- Added `NotificationController` with endpoints for create, employee-list, and status update operations.
- Added `AuditController` with endpoints for audit trail by actor/entity and filtered search.
- Strengthened controller-level boundary by routing employee APIs through `EmployeeService` and keeping facility APIs facility-centric.

## Module 8: Swagger Testing (Completed)

### Objective
Provide enterprise-grade API discoverability and testability through OpenAPI grouping, metadata, and representative payload examples.

### Deliverables implemented
- Enriched OpenAPI metadata (title, description, contact, license, servers).
- Added grouped API documentation views:
  - `platform-all`
  - `admin-api`
  - `employee-api`
- Added endpoint-level response metadata and request examples for core facility, booking, and notification flows.

## Module 9: PostgreSQL Integration (Completed)

### Objective
Enable production-grade PostgreSQL runtime behavior with migration safety, pool management, and environment-aware bootstrapping.

### Deliverables implemented
- Hardened `application-postgres.properties` with Hikari pool settings and Flyway safety controls.
- Added migration-safe local profile toggles and restricted demo data bootstrap to `local` profile only.
- Added reproducible PostgreSQL container provisioning via `backend/docker-compose.postgres.yml`.
- Added PostgreSQL runbook documentation for local and team onboarding.

## Module 10: Dynamic Form Builder (Completed)

### Objective
Enable administrators to configure dynamic forms safely with policy-enforced field metadata, option controls, and publication readiness checks.

### Deliverables implemented
- Hardened dynamic field add/update flow with:
  - unique label enforcement per facility
  - unique `displayOrder` enforcement per facility
  - validation JSON structural checks
  - default value type checks for email/number/phone
  - automatic option cleanup for non-option field types
- Extended option management to support `CHECKBOX` fields and normalized option sets.
- Strengthened specification JSON upload parsing with:
  - duplicate label/display-order detection
  - required options for option-based field types
  - support for `validationJson` and `defaultValue` field metadata
  - rule parsing for `bookingStartTime` and `maximumCapacity`
- Added publish-readiness checks to block publishing incomplete dynamic facilities.

## Module 11: Rule Engine (Completed)

### Objective
Centralize business rule evaluation for booking creation and cancellation to ensure consistent policy enforcement across workflows.

### Deliverables implemented
- Added dedicated rule engine contract and implementation:
  - `RuleEngineService`
  - `RuleEngineServiceImpl`
- Enforced booking creation policies in rule engine:
  - duplicate booking prevention
  - booking start/deadline window checks (for same-day booking)
  - facility capacity checks via `maximumCapacity`
  - QR generation control via `qrRequired`
- Enforced booking cancellation policies in rule engine:
  - `allowCancellation` gate
  - no cancellation for past booking dates
  - same-day cancellation blocked after deadline
- Added rule consistency validation in `RuleServiceImpl` for:
  - booking window ordering
  - reminder time validity
  - positive `maximumCapacity`

## Module 12: Specification Generation (Completed)

### Objective
Generate stable, versioned specification JSON directly from persisted facility configuration so employee clients can render dynamic UIs without hardcoded templates.

### Deliverables implemented
- Activated mapper-based specification assembler with a formal JSON document structure (`specVersion`, `generatedAt`, `facility`, `fields`, `rules`).
- Implemented `SpecificationMapperImpl` to produce ordered field and option output from stored entities.
- Extended specification service with generated-spec retrieval by facility ID.
- Added controller endpoint:
  - `GET /api/specifications/facilities/{facilityId}/generated`

## Module 13: Booking Module (Completed)

### Objective
Harden booking operations for enterprise use with idempotency, richer response contracts, and operational admin query capabilities.

### Deliverables implemented
- Added optional `clientRequestId` idempotency support for booking submissions.
- Added booking persistence support for idempotency (`client_request_id`) with unique constraint per employee.
- Enhanced submit-booking response payload with booking date, created timestamp, idempotent replay flag, and message.
- Added admin booking APIs for search and facility/date summary analytics.
- Added repository and index support for booking query performance.

## Module 14: Reports (Completed)

### Objective
Provide enterprise analytics APIs for operational visibility, utilization monitoring, and booking trend analysis.

### Deliverables implemented
- Added report payloads for:
  - operational summary (`OperationalSummaryResponse`)
  - facility utilization (`FacilityUtilizationResponse`)
  - trend analytics (`BookingTrendResponse` with `TrendPoint`)
- Added analytics endpoints:
  - `GET /api/reports/summary`
  - `GET /api/reports/facility/{facilityId}/utilization`
  - `GET /api/reports/trend`
- Added validation rules for trend query date range and ordering.
- Added repository counters required for booking-date analytics.

## Module 15: QR Generation (Completed)

### Objective
Provide secure and verifiable QR lifecycle for confirmed bookings.

### Deliverables implemented
- Replaced random UUID QR with signed token format: `HYQR.v1.<bookingId>.<nonce>.<signature>`.
- Added HMAC-SHA256 signature generation/verification in rule engine.
- Generated QR only after booking persistence to include stable booking identity.
- Added verification endpoint: `POST /api/bookings/verify-qr`.
- Added QR lookup repository method and DB index migration `V3__booking_qr_index.sql`.

## Module 16: Notifications (Completed)

### Objective
Deliver enterprise-grade notification lifecycle with scheduling, retries, escalation, and operational observability.

### Deliverables implemented
- Added scheduling API: `POST /api/notifications/scheduled`.
- Added processing API: `POST /api/notifications/process` with batch support.
- Added ops summary API: `GET /api/notifications/ops/summary`.
- Added employee notification filtering by status via query param.
- Added notification lifecycle fields: `scheduledAt`, `processedAt`, `retryCount`, `maxRetries`, `lastError`, `escalated`, `escalatedAt`.
- Added retry/escalation logic and allowed status transition validation.
- Added migration `V4__notification_lifecycle_fields.sql`.

## Module Sequence Status
Modules 1 through 16 are now implemented.

## Post-Module Hardening (Completed)

### Objective
Improve runtime reliability and validation confidence for QR and notification lifecycle flows.

### Deliverables implemented
- Added automatic notification processing scheduler with cron and batch-size configuration.
- Added environment-configurable properties:
  - `app.notifications.processor.cron`
  - `app.notifications.processor.batch-size`
  - `app.qr.secret`
- Added unit tests for QR token generation/verification and tamper detection.
- Added unit tests for notification scheduling and escalation behavior.
- Added controller-level API contract tests (MockMvc) for:
  - reports trend/summary endpoints
  - booking QR verification endpoint
  - notification process/ops/scheduled endpoints
- Added admin RBAC interceptor for admin-only routes:
  - `/api/reports/**`
  - `/api/audit/**`
  - `/api/bookings/admin/**`
  - `/api/notifications/process`
  - `/api/notifications/ops/**`
- Added explicit 403 handling contract via `ForbiddenException`.

Each module will be delivered with:
- Architecture note
- Production code
- Validation results (tests and startup checks)
