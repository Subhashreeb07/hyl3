# Facilities App

> **Status:** 🚧 Active Development

A web application for managing facility bookings at Hyland India, including food services, cab bookings, and event registrations.

## Overview

The Facilities App streamlines the process of booking essential facilities for Hyland India employees. The application provides a centralized platform where employees can manage their daily food and cab requirements, while administrators maintain full control over booking windows and event creation.

## Features

### For Employees
- **Food Booking**
  - Browse and select meal options
  - Choose preferred time slots
  - Cancel existing bookings
  - View booking history

- **Cab Booking**
  - Book pickup/drop service from predetermined spots
  - Select convenient time slots
  - Manage and cancel cab bookings

- **Event Registration**
  - Sign up for company events that require food and cab arrangements
  - View upcoming events
  - Manage event registrations

- **Dashboard**
  - Unified view of all active bookings
  - Quick access to booking history
  - Easy cancellation and modification

### For Administrators
- **Booking Management**
  - Open/close booking windows for food and cab services
  - View all employee bookings
  - Generate reports on facility usage

- **Event Management**
  - Create new events
  - Configure event details (date, time, facilities required)
  - Manage event registrations

## Tech Stack

### Frontend
- **Framework:** Angular
- **UI Library:** Hyland Design Library (Satori)
- **Package Manager:** npm

### Backend
- **Framework:** Java 17 + Spring Boot
- **Build Tool:** Maven
- **Database:** PostgreSQL
- **Authentication:** JWT-based (SSO integration planned)

### Deployment
- **Platform:** AWS
- **Domain:** `indiafacilities.hyland.com` (planned)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Java Development Kit (JDK) 17**
- **Maven 3.6+**
- **Node.js 18+ and npm**
- **PostgreSQL 14+**
- **Angular CLI** (`npm install -g @angular/cli`)

## Project Structure

```
facilities-app/
├── backend/              # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   └── pom.xml
├── frontend/             # Angular application
│   ├── src/
│   │   ├── app/
│   │   ├── assets/
│   │   └── environments/
│   ├── package.json
│   └── angular.json
└── README.md
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd facilities-app
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb facilities_db

# Update database configuration in backend/src/main/resources/application.properties
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies and build
mvn clean install

# Run the application
mvn spring-boot:run
```

The backend server will start on `http://localhost:8080`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

The frontend application will be available at `http://localhost:4200`

## Configuration

### Backend Configuration

Create an `application-local.properties` file in `backend/src/main/resources/`:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/facilities_db
spring.datasource.username=your_username
spring.datasource.password=your_password

# JWT Configuration (when implemented)
jwt.secret=your_secret_key
jwt.expiration=86400000

# SSO Configuration (when implemented)
sso.provider.url=
sso.client.id=
sso.client.secret=
```

### Frontend Configuration

Update `frontend/src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

## Development

### Running Tests

**Backend:**
```bash
cd backend
mvn test
```

**Frontend:**
```bash
cd frontend
ng test
```

### Building for Production

**Backend:**
```bash
cd backend
mvn clean package
```

**Frontend:**
```bash
cd frontend
ng build --configuration production
```

## API Documentation

Once the backend is running, API documentation will be available at:
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Roadmap

### Current Sprint
- [ ] Complete SSO authentication integration
- [ ] Finalize JWT token implementation
- [ ] Set up AWS deployment infrastructure

### Upcoming Features
- [ ] Email notifications for booking confirmations
- [ ] SMS alerts for cab bookings
- [ ] Mobile-responsive dashboard improvements
- [ ] Recurring booking options
- [ ] Integration with calendar applications
- [ ] Analytics dashboard for administrators

## Known Issues

- Authentication is work in progress
- Deployment configuration pending
- Email notification system not yet implemented

## Support

For questions or issues related to this project, please contact the development team through internal channels.

---

**Note:** This application is intended for internal use by Hyland India employees only.
