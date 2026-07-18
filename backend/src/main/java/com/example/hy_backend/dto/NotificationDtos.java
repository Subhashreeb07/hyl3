package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record BroadcastNotificationRequest(
            @NotBlank String notificationType,
            @NotEmpty List<String> channels,
            @NotBlank String subject,
            @NotBlank String messageBody,
            List<String> employeeIds,
            String location,
            String workMode,
            String preference,
            Boolean activeOnly,
            Boolean dryRun
    ) {
    }

    public record BroadcastNotificationResponse(
            int matchedEmployees,
            int notificationsCreated,
            List<String> sampleEmployeeIds,
            String message
    ) {
    }

    public record NotificationHistoryItem(
            long notificationId,
            String employeeId,
            String employeeName,
            String facilityName,
            String templateName,
            String channel,
            String sentTime,
            boolean opened,
            boolean read,
            String status
    ) {
    }

    public record NotificationHistoryResponse(
            List<NotificationHistoryItem> items,
            int total,
            int page,
            int pageSize
    ) {
    }

    public record EmployeeNotificationItem(
            long notificationId,
            String employeeId,
            Long bookingId,
            String notificationType,
            String channelCode,
            String messageBody,
            String scheduledAt,
            String sentAt,
            String processedAt,
            String statusCode,
            String createdAt
    ) {
    }

    public record EmployeeNotificationListResponse(
            List<EmployeeNotificationItem> items
    ) {
    }
}