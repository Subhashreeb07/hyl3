package com.example.hy_backend.service;

import com.example.hy_backend.dto.NotificationDtos;

public interface NotificationAdminService {
    NotificationDtos.BroadcastNotificationResponse sendBroadcast(NotificationDtos.BroadcastNotificationRequest request);

    NotificationDtos.NotificationHistoryResponse getHistory(
            String query,
            String status,
            String channel,
            int page,
            int pageSize
    );

    NotificationDtos.EmployeeNotificationListResponse getEmployeeNotifications(String employeeId, String statusCode);

    void markNotificationRead(long notificationId);
}