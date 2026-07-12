package com.example.hy_backend.service;

import com.example.hy_backend.dto.NotificationDtos;

import java.util.List;

public interface NotificationScheduleService {

    NotificationDtos.ScheduleResponse createSchedule(String employeeId, NotificationDtos.CreateScheduleRequest request);

    NotificationDtos.ScheduleResponse updateSchedule(String employeeId, NotificationDtos.UpdateScheduleRequest request);

    NotificationDtos.ScheduleResponse getSchedule(String employeeId, Long scheduleId);

    NotificationDtos.ScheduleListResponse getEmployeeSchedules(String employeeId);

    boolean deleteSchedule(String employeeId, Long scheduleId);

    int processScheduledNotifications();

    int processDailySchedules();

    int processWeeklySchedules();

    int processMonthlySchedules();
}
