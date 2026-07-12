# Notification Scheduling System - Complete Guide

## Overview

The notification scheduling system enables employees to create, manage, and receive notifications at specific times and frequencies. It supports:
- **One-time notifications** - Send at a specific date and time
- **Daily notifications** - Send every day at a specific time
- **Weekly notifications** - Send on selected days at a specific time
- **Monthly notifications** - Send on a specific day of the month at a specific time

---

## Backend Architecture

### Database Models

#### 1. **NotificationSchedule** (`notification_schedules` table)
Stores user-created notification schedules.

```sql
CREATE TABLE notification_schedules (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(64) NOT NULL,
    template_id BIGINT NOT NULL,
    scheduled_time DATETIME,           -- For ONCE frequency
    frequency VARCHAR(30) NOT NULL,    -- ONCE, DAILY, WEEKLY, MONTHLY
    days_of_week VARCHAR(255),         -- MON,WED,FRI (comma-separated)
    day_of_month INT,                  -- 1-31
    time_of_day TIME,                  -- HH:MM:SS
    start_date DATETIME NOT NULL,      -- When schedule becomes active
    end_date DATETIME,                 -- When schedule expires (optional)
    active BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

#### 2. **Existing Models Used**
- `NotificationTemplate` - Defines message templates
- `Notification` - Stores individual notifications
- `NotificationPreference` - User channel preferences (Email/SMS/In-App)

---

### API Endpoints

#### Create Schedule
```
POST /api/notifications/schedule
Header: X-Employee-Id: {employeeId}

Request Body:
{
  "templateId": 1,
  "frequency": "WEEKLY",
  "timeOfDay": "09:30:00",
  "daysOfWeek": "MON,WED,FRI",
  "startDate": "2026-07-15T00:00:00",
  "endDate": "2026-12-31T00:00:00",
  "timezone": "UTC"
}

Response:
{
  "scheduleId": 1,
  "templateId": 1,
  "templateName": "Booking Reminder",
  "frequency": "WEEKLY",
  "timeOfDay": "09:30:00",
  "daysOfWeek": "MON,WED,FRI",
  "startDate": "2026-07-15T00:00:00",
  "endDate": "2026-12-31T00:00:00",
  "active": true,
  "timezone": "UTC",
  "createdAt": "2026-07-12T10:30:00",
  "updatedAt": "2026-07-12T10:30:00"
}
```

#### Update Schedule
```
PUT /api/notifications/schedule
Header: X-Employee-Id: {employeeId}

Request Body:
{
  "scheduleId": 1,
  "templateId": 1,
  "frequency": "DAILY",
  "timeOfDay": "10:00:00",
  "startDate": "2026-07-15T00:00:00",
  "active": true,
  "timezone": "UTC"
}
```

#### Get Schedule
```
GET /api/notifications/schedule/{scheduleId}
Header: X-Employee-Id: {employeeId}

Response: Single ScheduleResponse
```

#### List Employee Schedules
```
GET /api/notifications/schedule
Header: X-Employee-Id: {employeeId}

Response:
{
  "items": [
    { /* ScheduleResponse */ },
    { /* ScheduleResponse */ }
  ]
}
```

#### Delete Schedule
```
DELETE /api/notifications/schedule/{scheduleId}
Header: X-Employee-Id: {employeeId}

Response: 204 No Content
```

---

### Service Layer

#### NotificationScheduleService Interface
```java
public interface NotificationScheduleService {
    // CRUD Operations
    NotificationDtos.ScheduleResponse createSchedule(String employeeId, CreateScheduleRequest request);
    NotificationDtos.ScheduleResponse updateSchedule(String employeeId, UpdateScheduleRequest request);
    NotificationDtos.ScheduleResponse getSchedule(String employeeId, Long scheduleId);
    NotificationDtos.ScheduleListResponse getEmployeeSchedules(String employeeId);
    boolean deleteSchedule(String employeeId, Long scheduleId);

    // Schedule Processing
    int processScheduledNotifications();    // Runs every minute
    int processDailySchedules();            // Runs every hour
    int processWeeklySchedules();           // Runs at 00:00 Sunday
    int processMonthlySchedules();          // Runs at 00:00 1st of month
}
```

#### NotificationScheduleServiceImpl
Handles all notification schedule business logic:
- **Schedule Creation/Update/Deletion** - Validates and persists schedules
- **Schedule Processing** - Converts schedules to actual notifications based on frequency
- **Timezone Support** - Handles different timezones
- **Frequency Validation** - Ensures proper configuration for each frequency type

#### Scheduler Integration
The `NotificationProcessingScheduler` component runs scheduled tasks:
```java
@Scheduled(cron = "${app.notifications.processor.cron:0 */1 * * * *}")
public void processPendingNotifications() // Every minute

@Scheduled(cron = "${app.notifications.daily.cron:0 0 * * * *}")
public void processDailySchedules() // Every hour

@Scheduled(cron = "${app.notifications.weekly.cron:0 0 0 * * 0}")
public void processWeeklySchedules() // Sunday at 00:00

@Scheduled(cron = "${app.notifications.monthly.cron:0 0 0 1 * *}")
public void processMonthlySchedules() // 1st of month at 00:00
```

---

### Database Migration
File: `V17__notification_schedules.sql`

Creates the `notification_schedules` table with:
- Foreign key constraints to `employees` and `notification_templates`
- Indexes for efficient querying:
  - `idx_employee_active` - Fast lookup for user's active schedules
  - `idx_frequency` - Filter by frequency type
  - `idx_scheduled_time` - Find due one-time schedules
  - `idx_start_date` - Range queries

---

## Frontend Implementation

### Services

#### NotificationScheduleApiService
File: `notification-schedule-api.service.ts`

Provides HTTP client methods:
```typescript
createSchedule(request: CreateScheduleRequest): Observable<ScheduleResponse>
updateSchedule(request: UpdateScheduleRequest): Observable<ScheduleResponse>
getSchedule(scheduleId: number): Observable<ScheduleResponse>
getEmployeeSchedules(): Observable<ScheduleListResponse>
deleteSchedule(scheduleId: number): Observable<void>
```

Automatically includes `X-Employee-Id` header from session.

### Components

#### NotificationSchedulesComponent
File: `notification-schedules.component.ts`

**Main component** - Displays list of schedules with actions:
- Create new schedule (dialog)
- Edit existing schedule (dialog)
- Delete schedule (confirmation)
- Status indicators (Active/Inactive)
- Frequency badges (ONCE, DAILY, WEEKLY, MONTHLY)
- Metadata display (dates, time, timezone, days)

#### CreateScheduleDialogComponent
Dialog for creating new schedules:
- Template selection
- Frequency selection
- Conditional fields based on frequency:
  - ONCE: `scheduledAt` (date/time picker)
  - DAILY/WEEKLY/MONTHLY: `timeOfDay` (time picker)
  - WEEKLY: `daysOfWeek` (comma-separated list)
  - MONTHLY: `dayOfMonth` (dropdown 1-31)
- Date range: `startDate` and optional `endDate`
- Timezone selection
- Form validation

#### EditScheduleDialogComponent
Dialog for editing existing schedules:
- Pre-populated with current values
- Status toggle (Active/Inactive)
- All creation fields available
- Saves changes back to API

---

## Frontend Routes

Add to employee portal navigation:
```typescript
{
  path: 'notification-schedules',
  component: NotificationSchedulesComponent
}
```

Accessible at: `/employee/notification-schedules`

---

## Configuration

### Application Properties
Add to `application.properties` or `application.yml`:

```properties
# Notification Scheduler Configuration
app.notifications.processor.cron=0 */1 * * * *
app.notifications.processor.batch-size=100
app.notifications.daily.cron=0 0 * * * *
app.notifications.weekly.cron=0 0 0 * * 0
app.notifications.monthly.cron=0 0 0 1 * *
```

---

## Usage Examples

### Example 1: Daily Reminder at 9 AM
```json
POST /api/notifications/schedule
{
  "templateId": 5,
  "frequency": "DAILY",
  "timeOfDay": "09:00:00",
  "startDate": "2026-07-15T00:00:00",
  "endDate": "2026-12-31T00:00:00",
  "timezone": "EST"
}
```

### Example 2: Weekly Standup on Mon/Wed/Fri at 2 PM
```json
POST /api/notifications/schedule
{
  "templateId": 3,
  "frequency": "WEEKLY",
  "timeOfDay": "14:00:00",
  "daysOfWeek": "MON,WED,FRI",
  "startDate": "2026-07-13T00:00:00",
  "timezone": "EST"
}
```

### Example 3: Monthly Report on 1st at Midnight
```json
POST /api/notifications/schedule
{
  "templateId": 7,
  "frequency": "MONTHLY",
  "timeOfDay": "00:00:00",
  "dayOfMonth": 1,
  "startDate": "2026-08-01T00:00:00",
  "timezone": "UTC"
}
```

### Example 4: One-Time Notification
```json
POST /api/notifications/schedule
{
  "templateId": 2,
  "frequency": "ONCE",
  "scheduledAt": "2026-07-20T14:30:00",
  "startDate": "2026-07-20T00:00:00",
  "timezone": "EST"
}
```

---

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Template not found | Verify `templateId` exists |
| 400 | Invalid frequency | Use: ONCE, DAILY, WEEKLY, or MONTHLY |
| 400 | Missing required fields | Ensure all required fields are provided |
| 401 | Unauthorized | Check `X-Employee-Id` header |
| 404 | Schedule not found | Verify schedule belongs to user |
| 422 | Invalid day of month | Use 1-31 for MONTHLY frequency |

---

## Testing

### Backend Testing
Test files:
- `NotificationScheduleServiceImplTest.java`
- `NotificationScheduleRepositoryTest.java`

### Frontend Testing
Use Angular Testing utilities with MockHttpClientTestingModule

---

## Performance Considerations

1. **Indexing**: Database indexes on `employee_id`, `active`, and `frequency` for fast queries
2. **Batch Processing**: Schedules are processed in batches during scheduled tasks
3. **Timezone Caching**: Timezone calculations happen at processing time, not storage
4. **Lazy Loading**: Employee and Template entities are lazily loaded to reduce memory usage

---

## Security Considerations

1. **Authorization**: All endpoints check `X-Employee-Id` header to prevent access to other users' schedules
2. **Input Validation**: All inputs validated using Jakarta validation annotations
3. **SQL Injection**: Uses parameterized queries through JPA
4. **Data Privacy**: Schedules are employee-specific with no cross-tenant access

---

## Troubleshooting

### Schedules Not Sending
1. Check if `active = true`
2. Verify `startDate` is in the past and `endDate` is in the future (if set)
3. Ensure scheduler is running: Check application logs for scheduler messages
4. Verify template exists and is properly configured

### Wrong Time Notifications
1. Check employee's timezone setting
2. Verify server timezone matches expected timezone
3. Confirm `timeOfDay` is in correct format (HH:MM:SS)

### Database Migration Failed
1. Ensure database user has CREATE TABLE permissions
2. Check for existing `notification_schedules` table
3. Verify foreign key constraints are satisfied

---

## Future Enhancements

1. **Notification Preview** - Show preview of message before scheduling
2. **Schedule Templates** - Save common schedules for reuse
3. **Frequency Analytics** - Track which schedules are most used
4. **Smart Scheduling** - Auto-suggest optimal times based on user activity
5. **Pause/Resume** - Temporarily pause without deleting
6. **Bulk Operations** - Create multiple schedules at once

---

## Related Documentation

- [Notification System Guide](./NOTIFICATION_SYSTEM.md)
- [API Documentation](./API.md)
- [Database Schema](./DATABASE_SCHEMA.md)
