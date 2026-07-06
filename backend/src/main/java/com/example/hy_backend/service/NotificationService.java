package com.example.hy_backend.service;

import com.example.hy_backend.dto.NotificationDtos;

public interface NotificationService {
    NotificationDtos.NotificationResponse createNotification(NotificationDtos.CreateNotificationRequest request);

    NotificationDtos.NotificationResponse scheduleNotification(NotificationDtos.CreateScheduledNotificationRequest request);

    NotificationDtos.NotificationListResponse getEmployeeNotifications(String employeeId, String statusCode);

    NotificationDtos.NotificationResponse markNotificationStatus(NotificationDtos.MarkNotificationRequest request);

    NotificationDtos.ProcessNotificationsResponse processPendingNotifications(Integer batchSize);

    NotificationDtos.NotificationOpsSummaryResponse getOperationalSummary(String reportDate);
}
