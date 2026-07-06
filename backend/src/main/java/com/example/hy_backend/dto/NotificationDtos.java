package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class NotificationDtos {

    private NotificationDtos() {
    }

    public record CreateNotificationRequest(
            @NotBlank String employeeId,
            Long bookingId,
            @NotBlank String notificationType,
            @NotBlank String channelCode,
            @NotBlank String messageBody
    ) {
    }

    public record CreateScheduledNotificationRequest(
            @NotBlank String employeeId,
            Long bookingId,
            @NotBlank String notificationType,
            @NotBlank String channelCode,
            @NotBlank String messageBody,
            @NotBlank String scheduledAt,
            Integer maxRetries
    ) {
    }

    public record NotificationResponse(
            Long notificationId,
            String employeeId,
            Long bookingId,
            String notificationType,
            String channelCode,
            String messageBody,
            String scheduledAt,
            String sentAt,
            String processedAt,
            String statusCode,
            Integer retryCount,
            Integer maxRetries,
            String lastError,
            Boolean escalated,
            String escalatedAt,
            String createdAt
    ) {
    }

    public record MarkNotificationRequest(@NotNull Long notificationId, @NotBlank String statusCode) {
    }

    public record NotificationListResponse(List<NotificationResponse> items) {
    }

    public record ProcessNotificationsResponse(
            int attempted,
            int sent,
            int retried,
            int escalated,
            int failed
    ) {
    }

    public record NotificationOpsSummaryResponse(
            String reportDate,
            long total,
            long pending,
            long retrying,
            long sent,
            long failed,
            long escalated
    ) {
    }
}
