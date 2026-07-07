# Employee Flow (End-to-End)

This document describes the implemented employee-only journey across frontend and backend.

## Frontend Routes

- /login
- /employee/dashboard
- /employee/workday-setup
- /employee/facility/{facilityId}/book
- /employee/history
- /employee/bookings/{bookingId}

## Backend APIs Used

### Authentication
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/current-user

### Employee Dashboard + Facility Form
- GET /api/dashboard
- GET /api/employee/home/{employeeId}
- GET /api/facilities/{facilityId}/specification

### Booking
- POST /api/bookings
- GET /api/bookings/history/{employeeId}
- GET /api/bookings/{bookingId}
- DELETE /api/bookings/{bookingId}

Booking payload supports date-aware booking:

- bookingDate (ISO format: yyyy-MM-dd)

## E2E Sequence

1. Employee opens /login
2. Frontend calls POST /api/auth/login
3. Frontend stores token + employee profile in local storage session
4. Employee lands on dashboard (/employee/dashboard)
5. Frontend calls GET /api/employee/home/{employeeId} to render date chips + services
6. Employee picks a date chip (workday date)
7. Employee clicks Book My Workday (opens /employee/workday-setup with selected date)
8. Frontend calls POST /api/bookings for lunch/cab using bookingDate
9. Backend validates required fields + options + booking window + duplicate service/day booking
10. Backend stores bookingDate (separate from createdAt) for hybrid day tracking
11. Employee can still open facility form flow for additional bookings
12. Frontend loads dynamic spec via GET /api/facilities/{facilityId}/specification
13. Frontend renders form dynamically from specification and submits via POST /api/bookings
14. Employee opens history via /employee/history
15. Frontend calls GET /api/bookings/history/{employeeId}
16. Employee opens booking detail via /employee/bookings/{bookingId}
17. Frontend calls GET /api/bookings/{bookingId} and displays bookingDate + details
18. Employee cancels from booking detail when permitted
19. Frontend calls DELETE /api/bookings/{bookingId}

## Credentials

Employees must authenticate with their assigned employee ID and password through the login page.

## Initial Setup

No demo data or bootstrap data is created at startup. All facilities, templates, and triggers must be configured through the admin interface.

Source:
- backend/src/main/java/com/example/hy_backend/config/DemoDataInitializer.java
