# Notification Functions - Quick Reference

## ✅ Implemented Functions

### Backend Functions (Java/Spring)

#### **NotificationScheduleService Interface**
```java
// Create a new notification schedule
ScheduleResponse createSchedule(String employeeId, CreateScheduleRequest request)

// Update existing schedule
ScheduleResponse updateSchedule(String employeeId, UpdateScheduleRequest request)

// Get single schedule
ScheduleResponse getSchedule(String employeeId, Long scheduleId)

// Get all schedules for employee
ScheduleListResponse getEmployeeSchedules(String employeeId)

// Delete schedule
boolean deleteSchedule(String employeeId, Long scheduleId)

// Process one-time schedules (runs every minute)
int processScheduledNotifications()

// Process daily schedules (runs every hour)
int processDailySchedules()

// Process weekly schedules (runs weekly)
int processWeeklySchedules()

// Process monthly schedules (runs monthly)
int processMonthlySchedules()
```

#### **NotificationService Interface** (Delegation Methods)
```java
// Delegates to NotificationScheduleService
ScheduleResponse createSchedule(String employeeId, CreateScheduleRequest request)
ScheduleResponse updateSchedule(String employeeId, UpdateScheduleRequest request)
ScheduleResponse getSchedule(String employeeId, Long scheduleId)
ScheduleListResponse getEmployeeSchedules(String employeeId)
boolean deleteSchedule(String employeeId, Long scheduleId)
```

#### **NotificationScheduleRepository** (JPA)
```java
// Find schedules by employee
List<NotificationSchedule> findByEmployeeId(String employeeId)

// Find active schedules for specific employee
List<NotificationSchedule> findByEmployeeIdAndActive(String employeeId, Boolean active)

// Find all active schedules across all employees
List<NotificationSchedule> findActiveSchedules(LocalDateTime now)

// Find schedules due for one-time sending
List<NotificationSchedule> findDueOneTimeSchedules(LocalDateTime now, LocalDateTime previousRun)

// Find all recurring schedules (DAILY, WEEKLY, MONTHLY)
List<NotificationSchedule> findRecurringSchedules()

// Get schedules ordered by creation date
List<NotificationSchedule> findByEmployeeIdOrderByCreatedAtDesc(String employeeId)

// Get specific schedule for employee
Optional<NotificationSchedule> findByScheduleIdAndEmployeeId(Long scheduleId, String employeeId)

// Delete schedule for employee
long deleteByScheduleIdAndEmployeeId(Long scheduleId, String employeeId)

// Count total schedules for employee
long countByEmployeeId(String employeeId)
```

#### **NotificationScheduleController** (REST API)
```java
// POST /api/notifications/schedule
ResponseEntity<ScheduleResponse> createSchedule(String employeeId, CreateScheduleRequest request)

// PUT /api/notifications/schedule
ResponseEntity<ScheduleResponse> updateSchedule(String employeeId, UpdateScheduleRequest request)

// GET /api/notifications/schedule/{scheduleId}
ResponseEntity<ScheduleResponse> getSchedule(String employeeId, Long scheduleId)

// GET /api/notifications/schedule
ResponseEntity<ScheduleListResponse> getEmployeeSchedules(String employeeId)

// DELETE /api/notifications/schedule/{scheduleId}
ResponseEntity<Void> deleteSchedule(String employeeId, Long scheduleId)
```

#### **NotificationProcessingScheduler** (Background Jobs)
```java
// Processes one-time and pending notifications (every minute)
@Scheduled(cron = "0 */1 * * * *")
void processPendingNotifications()

// Processes daily schedules (every hour)
@Scheduled(cron = "0 0 * * * *")
void processDailySchedules()

// Processes weekly schedules (Sunday 00:00)
@Scheduled(cron = "0 0 0 * * 0")
void processWeeklySchedules()

// Processes monthly schedules (1st of month 00:00)
@Scheduled(cron = "0 0 0 1 * *")
void processMonthlySchedules()
```

---

### Frontend Functions (Angular/TypeScript)

#### **NotificationScheduleApiService**
```typescript
// Create new schedule
createSchedule(request: CreateScheduleRequest): Observable<ScheduleResponse>

// Update schedule
updateSchedule(request: UpdateScheduleRequest): Observable<ScheduleResponse>

// Get single schedule
getSchedule(scheduleId: number): Observable<ScheduleResponse>

// Get all employee schedules
getEmployeeSchedules(): Observable<ScheduleListResponse>

// Delete schedule
deleteSchedule(scheduleId: number): Observable<void>
```

#### **NotificationSchedulesComponent**
```typescript
// Load schedules from API
loadSchedules(): void

// Open create dialog
openCreateDialog(): void

// Open edit dialog for existing schedule
openEditDialog(schedule: ScheduleResponse): void

// Delete schedule with confirmation
deleteSchedule(scheduleId: number): void

// Format date for display
formatDate(dateString: string): string
```

#### **CreateScheduleDialogComponent**
```typescript
// Initialize form with validators
ngOnInit(): void

// Handle frequency change for conditional fields
onFrequencyChange(): void

// Submit new schedule
onSubmit(): void

// Cancel dialog
onCancel(): void
```

#### **EditScheduleDialogComponent**
```typescript
// Pre-populate form with schedule data
ngOnInit(): void

// Handle frequency change
onFrequencyChange(): void

// Submit updated schedule
onSubmit(): void

// Cancel dialog
onCancel(): void
```

---

## 📦 Data Transfer Objects (DTOs)

### Request DTOs
```java
record CreateScheduleRequest(
    Long templateId,
    String frequency,              // ONCE, DAILY, WEEKLY, MONTHLY
    String scheduledAt,            // ISO format, for ONCE
    String timeOfDay,              // HH:MM:SS, for recurring
    String daysOfWeek,             // MON,WED,FRI for WEEKLY
    Integer dayOfMonth,            // 1-31 for MONTHLY
    String startDate,              // ISO format, required
    String endDate,                // ISO format, optional
    String timezone
)

record UpdateScheduleRequest extends CreateScheduleRequest {
    Long scheduleId,
    Boolean active
}
```

### Response DTOs
```java
record ScheduleResponse(
    Long scheduleId,
    Long templateId,
    String templateName,
    String frequency,
    String scheduledAt,
    String timeOfDay,
    String daysOfWeek,
    Integer dayOfMonth,
    String startDate,
    String endDate,
    Boolean active,
    String timezone,
    String createdAt,
    String updatedAt
)

record ScheduleListResponse(List<ScheduleResponse> items)
```

---

## 🗄️ Database Models

### NotificationSchedule Entity
```java
@Entity
@Table(name = "notification_schedules")
class NotificationSchedule {
    Long scheduleId;           // Primary Key
    String employeeId;         // Foreign Key → employees
    NotificationTemplate template; // Foreign Key → notification_templates
    LocalDateTime scheduledTime;   // For ONCE frequency
    String frequency;              // ONCE, DAILY, WEEKLY, MONTHLY
    String daysOfWeek;             // Comma-separated
    Integer dayOfMonth;            // 1-31
    LocalTime timeOfDay;           // HH:MM:SS
    LocalDateTime startDate;       // When active starts
    LocalDateTime endDate;         // When it expires
    Boolean active;                // Enable/disable
    String timezone;               // UTC, EST, CST, MST, PST
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
```

---

## 🔄 Notification Flow

```
User Action
    ↓
[NotificationSchedulesComponent]
    ↓
HTTP Request to API
    ↓
[NotificationScheduleController]
    ↓
[NotificationScheduleService]
    ↓
[NotificationScheduleRepository] → Database
    ↓
Response to Frontend

Background Processing (Every minute/hour/day)
    ↓
[NotificationProcessingScheduler]
    ↓
[NotificationScheduleService.processXxxSchedules()]
    ↓
[NotificationService.queueTriggeredNotifications()]
    ↓
Create Notification records
    ↓
[NotificationService.processPendingNotifications()]
    ↓
Send via channels (Email, SMS, In-App)
```

---

## 📊 Frequency Types

| Type | When | Example |
|------|------|---------|
| **ONCE** | Specific date & time | Jul 20, 2026 at 2:30 PM |
| **DAILY** | Every day at same time | 9:00 AM daily |
| **WEEKLY** | Specific days at same time | Mon/Wed/Fri at 2:00 PM |
| **MONTHLY** | Same day each month at same time | 1st at midnight |

---

## 🛠️ Configuration

```properties
# Cron expressions for schedule processing
app.notifications.processor.cron=0 */1 * * * *
app.notifications.processor.batch-size=100
app.notifications.daily.cron=0 0 * * * *
app.notifications.weekly.cron=0 0 0 * * 0
app.notifications.monthly.cron=0 0 0 1 * *
```

---

## 📋 Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Schedule created successfully |
| 204 | No Content - Schedule deleted successfully |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid X-Employee-Id |
| 404 | Not Found - Schedule not found |
| 422 | Unprocessable Entity - Validation error |
| 500 | Server Error - Internal error |

---

## 🔐 Security Headers

All requests to `/api/notifications/schedule/*` require:
```
X-Employee-Id: {employeeId}
```

---

## 📝 File Locations

### Backend
- Model: `backend/src/main/java/.../model/NotificationSchedule.java`
- Repository: `backend/src/main/java/.../repository/NotificationScheduleRepository.java`
- Service: `backend/src/main/java/.../service/NotificationScheduleService.java`
- Implementation: `backend/src/main/java/.../serviceimpl/NotificationScheduleServiceImpl.java`
- Controller: `backend/src/main/java/.../controller/NotificationScheduleController.java`
- Migration: `backend/src/main/resources/db/migration/V17__notification_schedules.sql`
- Scheduler: `backend/src/main/java/.../scheduler/NotificationProcessingScheduler.java`

### Frontend
- API Service: `frontend/src/app/core/services/notification-schedule-api.service.ts`
- Component: `frontend/src/app/features/employee/notification-schedules.component.ts`
- Routes: `frontend/src/app/app.routes.ts`

---

## 🚀 How to Use

### Create a Schedule via API
```bash
curl -X POST http://localhost:8080/api/notifications/schedule \
  -H "X-Employee-Id: EMP123" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": 1,
    "frequency": "DAILY",
    "timeOfDay": "09:00:00",
    "startDate": "2026-07-15T00:00:00",
    "timezone": "EST"
  }'
```

### Use Frontend UI
1. Navigate to `/employee/notification-schedules`
2. Click "New Schedule"
3. Fill form with:
   - Template
   - Frequency
   - Time details
   - Date range
4. Click "Create Schedule"

---

## ✨ Special Features

✅ **Timezone Support** - Different timezones for each user
✅ **Date Range** - Start and optional end dates
✅ **Frequency Types** - ONCE, DAILY, WEEKLY, MONTHLY
✅ **Active Toggle** - Enable/disable without deleting
✅ **Auto-Processing** - Background jobs handle sending
✅ **Authorization** - User-specific schedules only
✅ **Validation** - Input validation on all fields

