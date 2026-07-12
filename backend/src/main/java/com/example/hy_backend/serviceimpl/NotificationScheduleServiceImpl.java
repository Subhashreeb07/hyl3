package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.model.NotificationSchedule;
import com.example.hy_backend.model.NotificationTemplate;
import com.example.hy_backend.repository.NotificationScheduleRepository;
import com.example.hy_backend.repository.NotificationTemplateRepository;
import com.example.hy_backend.service.NotificationScheduleService;
import com.example.hy_backend.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class NotificationScheduleServiceImpl implements NotificationScheduleService {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduleServiceImpl.class);
    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;

    private final NotificationScheduleRepository scheduleRepository;
    private final NotificationTemplateRepository templateRepository;
    private final NotificationService notificationService;

    public NotificationScheduleServiceImpl(
            NotificationScheduleRepository scheduleRepository,
            NotificationTemplateRepository templateRepository,
            NotificationService notificationService
    ) {
        this.scheduleRepository = scheduleRepository;
        this.templateRepository = templateRepository;
        this.notificationService = notificationService;
    }

    @Override
    public NotificationDtos.ScheduleResponse createSchedule(String employeeId, NotificationDtos.CreateScheduleRequest request) {
        NotificationTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + request.templateId()));

        NotificationSchedule schedule = new NotificationSchedule();
        schedule.setEmployeeId(employeeId);
        schedule.setTemplate(template);
        schedule.setFrequency(request.frequency());
        schedule.setTimezone(request.timezone() != null ? request.timezone() : "UTC");
        schedule.setActive(true);

        parseScheduleRequest(schedule, request);

        NotificationSchedule saved = scheduleRepository.save(schedule);
        return toScheduleResponse(saved);
    }

    @Override
    public NotificationDtos.ScheduleResponse updateSchedule(String employeeId, NotificationDtos.UpdateScheduleRequest request) {
        NotificationSchedule schedule = scheduleRepository.findByScheduleIdAndEmployeeId(request.scheduleId(), employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found or unauthorized"));

        NotificationTemplate template = templateRepository.findById(request.templateId())
                .orElseThrow(() -> new IllegalArgumentException("Template not found: " + request.templateId()));

        schedule.setTemplate(template);
        schedule.setFrequency(request.frequency());
        schedule.setTimezone(request.timezone() != null ? request.timezone() : "UTC");
        schedule.setActive(request.active());
        schedule.setUpdatedAt(LocalDateTime.now());

        parseUpdateRequest(schedule, request);

        NotificationSchedule saved = scheduleRepository.save(schedule);
        return toScheduleResponse(saved);
    }

    @Override
    public NotificationDtos.ScheduleResponse getSchedule(String employeeId, Long scheduleId) {
        NotificationSchedule schedule = scheduleRepository.findByScheduleIdAndEmployeeId(scheduleId, employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Schedule not found or unauthorized"));
        return toScheduleResponse(schedule);
    }

    @Override
    public NotificationDtos.ScheduleListResponse getEmployeeSchedules(String employeeId) {
        List<NotificationSchedule> schedules = scheduleRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId);
        List<NotificationDtos.ScheduleResponse> responses = schedules.stream()
                .map(this::toScheduleResponse)
                .toList();
        return new NotificationDtos.ScheduleListResponse(responses);
    }

    @Override
    public boolean deleteSchedule(String employeeId, Long scheduleId) {
        long deleted = scheduleRepository.deleteByScheduleIdAndEmployeeId(scheduleId, employeeId);
        return deleted > 0;
    }

    @Override
    public int processScheduledNotifications() {
        int processed = 0;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneMinuteAgo = now.minusMinutes(1);

        List<NotificationSchedule> dueSchedules = scheduleRepository.findDueOneTimeSchedules(now, oneMinuteAgo);
        for (NotificationSchedule schedule : dueSchedules) {
            try {
                sendScheduledNotification(schedule);
                processed++;
            } catch (Exception e) {
                log.error("Error processing schedule {}: {}", schedule.getScheduleId(), e.getMessage());
            }
        }

        return processed;
    }

    @Override
    public int processDailySchedules() {
        int processed = 0;
        List<NotificationSchedule> dailySchedules = scheduleRepository.findRecurringSchedules().stream()
                .filter(s -> "DAILY".equals(s.getFrequency()))
                .toList();

        for (NotificationSchedule schedule : dailySchedules) {
            try {
                if (shouldSendNow(schedule)) {
                    sendScheduledNotification(schedule);
                    processed++;
                }
            } catch (Exception e) {
                log.error("Error processing daily schedule {}: {}", schedule.getScheduleId(), e.getMessage());
            }
        }

        return processed;
    }

    @Override
    public int processWeeklySchedules() {
        int processed = 0;
        List<NotificationSchedule> weeklySchedules = scheduleRepository.findRecurringSchedules().stream()
                .filter(s -> "WEEKLY".equals(s.getFrequency()))
                .toList();

        DayOfWeek currentDay = DayOfWeek.from(LocalDateTime.now());

        for (NotificationSchedule schedule : weeklySchedules) {
            try {
                if (isDayIncluded(schedule, currentDay) && shouldSendNow(schedule)) {
                    sendScheduledNotification(schedule);
                    processed++;
                }
            } catch (Exception e) {
                log.error("Error processing weekly schedule {}: {}", schedule.getScheduleId(), e.getMessage());
            }
        }

        return processed;
    }

    @Override
    public int processMonthlySchedules() {
        int processed = 0;
        List<NotificationSchedule> monthlySchedules = scheduleRepository.findRecurringSchedules().stream()
                .filter(s -> "MONTHLY".equals(s.getFrequency()))
                .toList();

        int currentDayOfMonth = LocalDateTime.now().getDayOfMonth();

        for (NotificationSchedule schedule : monthlySchedules) {
            try {
                if (schedule.getDayOfMonth() != null &&
                    schedule.getDayOfMonth().equals(currentDayOfMonth) &&
                    shouldSendNow(schedule)) {
                    sendScheduledNotification(schedule);
                    processed++;
                }
            } catch (Exception e) {
                log.error("Error processing monthly schedule {}: {}", schedule.getScheduleId(), e.getMessage());
            }
        }

        return processed;
    }

    private void sendScheduledNotification(NotificationSchedule schedule) {
        NotificationTemplate template = schedule.getTemplate();

        NotificationDtos.CreateScheduledNotificationRequest request =
            new NotificationDtos.CreateScheduledNotificationRequest(
                schedule.getEmployeeId(),
                null,
                template.getNotificationType(),
                template.getChannels().isEmpty() ? "IN_APP" : template.getChannels().get(0),
                template.getMessageTemplate(),
                LocalDateTime.now().format(ISO_FORMATTER),
                3
            );

        notificationService.scheduleNotification(request);
    }

    private boolean shouldSendNow(NotificationSchedule schedule) {
        if (schedule.getTimeOfDay() == null) {
            return true;
        }

        LocalTime currentTime = LocalTime.now();
        LocalTime scheduleTime = schedule.getTimeOfDay();

        int minuteDifference = Math.abs(currentTime.getHour() * 60 + currentTime.getMinute() -
                                       scheduleTime.getHour() * 60 + scheduleTime.getMinute());

        return minuteDifference < 2;
    }

    private boolean isDayIncluded(NotificationSchedule schedule, DayOfWeek currentDay) {
        if (schedule.getDaysOfWeek() == null || schedule.getDaysOfWeek().isEmpty()) {
            return false;
        }

        List<String> days = Arrays.asList(schedule.getDaysOfWeek().split(","));
        return days.contains(currentDay.toString());
    }

    private void parseScheduleRequest(NotificationSchedule schedule, NotificationDtos.CreateScheduleRequest request) {
        if ("ONCE".equals(request.frequency()) && request.scheduledAt() != null) {
            schedule.setScheduledTime(LocalDateTime.parse(request.scheduledAt(), ISO_FORMATTER));
        }

        if (request.timeOfDay() != null) {
            schedule.setTimeOfDay(LocalTime.parse(request.timeOfDay()));
        }

        if (request.daysOfWeek() != null) {
            schedule.setDaysOfWeek(request.daysOfWeek());
        }

        if (request.dayOfMonth() != null) {
            schedule.setDayOfMonth(request.dayOfMonth());
        }

        if (request.startDate() != null) {
            schedule.setStartDate(LocalDateTime.parse(request.startDate(), ISO_FORMATTER));
        }

        if (request.endDate() != null) {
            schedule.setEndDate(LocalDateTime.parse(request.endDate(), ISO_FORMATTER));
        }
    }

    private void parseUpdateRequest(NotificationSchedule schedule, NotificationDtos.UpdateScheduleRequest request) {
        if ("ONCE".equals(request.frequency()) && request.scheduledAt() != null) {
            schedule.setScheduledTime(LocalDateTime.parse(request.scheduledAt(), ISO_FORMATTER));
        } else {
            schedule.setScheduledTime(null);
        }

        if (request.timeOfDay() != null) {
            schedule.setTimeOfDay(LocalTime.parse(request.timeOfDay()));
        } else {
            schedule.setTimeOfDay(null);
        }

        schedule.setDaysOfWeek(request.daysOfWeek());
        schedule.setDayOfMonth(request.dayOfMonth());

        if (request.startDate() != null) {
            schedule.setStartDate(LocalDateTime.parse(request.startDate(), ISO_FORMATTER));
        }

        if (request.endDate() != null) {
            schedule.setEndDate(LocalDateTime.parse(request.endDate(), ISO_FORMATTER));
        }
    }

    private NotificationDtos.ScheduleResponse toScheduleResponse(NotificationSchedule schedule) {
        return new NotificationDtos.ScheduleResponse(
            schedule.getScheduleId(),
            schedule.getTemplate().getTemplateId(),
            schedule.getTemplate().getTemplateName(),
            schedule.getFrequency(),
            schedule.getScheduledTime() != null ? schedule.getScheduledTime().format(ISO_FORMATTER) : null,
            schedule.getTimeOfDay() != null ? schedule.getTimeOfDay().toString() : null,
            schedule.getDaysOfWeek(),
            schedule.getDayOfMonth(),
            schedule.getStartDate().format(ISO_FORMATTER),
            schedule.getEndDate() != null ? schedule.getEndDate().format(ISO_FORMATTER) : null,
            schedule.getActive(),
            schedule.getTimezone(),
            schedule.getCreatedAt().format(ISO_FORMATTER),
            schedule.getUpdatedAt().format(ISO_FORMATTER)
        );
    }
}
