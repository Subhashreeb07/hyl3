package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.Notification;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.NotificationRepository;
import com.example.hy_backend.service.NotificationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final Set<String> ALLOWED_CHANNELS = Set.of("IN_APP", "EMAIL", "SMS", "PUSH");
    private static final Set<String> ALLOWED_STATUSES = Set.of(
            "SCHEDULED",
            "PENDING",
            "RETRYING",
            "SENT",
            "FAILED",
            "ESCALATED",
            "READ",
            "CANCELLED"
    );

    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, BookingRepository bookingRepository) {
        this.notificationRepository = notificationRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public NotificationDtos.NotificationResponse createNotification(NotificationDtos.CreateNotificationRequest request) {
        return createInternal(
                request.employeeId(),
                request.bookingId(),
                request.notificationType(),
                request.channelCode(),
                request.messageBody(),
                LocalDateTime.now(),
                3
        );
    }

    @Override
    public NotificationDtos.NotificationResponse scheduleNotification(NotificationDtos.CreateScheduledNotificationRequest request) {
        LocalDateTime scheduledAt = parseDateTime(request.scheduledAt(), "scheduledAt");
        int maxRetries = request.maxRetries() == null ? 3 : request.maxRetries();
        if (maxRetries < 0 || maxRetries > 10) {
            throw new BadRequestException("maxRetries must be between 0 and 10");
        }

        return createInternal(
                request.employeeId(),
                request.bookingId(),
                request.notificationType(),
                request.channelCode(),
                request.messageBody(),
                scheduledAt,
                maxRetries
        );
    }

    @Override
    public NotificationDtos.NotificationListResponse getEmployeeNotifications(String employeeId, String statusCode) {
        String normalizedEmployeeId = normalizeEmployeeId(employeeId);

        List<Notification> notifications;
        if (statusCode == null || statusCode.isBlank()) {
            notifications = notificationRepository.findByEmployeeIdOrderByCreatedAtDesc(normalizedEmployeeId);
        } else {
            String normalizedStatus = normalizeStatus(statusCode);
            notifications = notificationRepository.findByEmployeeIdAndStatusCodeOrderByCreatedAtDesc(
                    normalizedEmployeeId,
                    normalizedStatus
            );
        }

        return new NotificationDtos.NotificationListResponse(notifications.stream().map(this::toResponse).toList());
    }

    @Override
    public NotificationDtos.NotificationResponse markNotificationStatus(NotificationDtos.MarkNotificationRequest request) {
        Notification notification = notificationRepository.findById(request.notificationId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + request.notificationId()));

        String targetStatus = normalizeStatus(request.statusCode());
        validateStatusTransition(notification.getStatusCode(), targetStatus);

        notification.setStatusCode(targetStatus);
        if ("SENT".equals(targetStatus)) {
            notification.setSentAt(LocalDateTime.now());
            notification.setProcessedAt(LocalDateTime.now());
            notification.setLastError(null);
        }
        if ("ESCALATED".equals(targetStatus)) {
            notification.setEscalated(true);
            notification.setEscalatedAt(LocalDateTime.now());
        }

        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    @Override
    public NotificationDtos.ProcessNotificationsResponse processPendingNotifications(Integer batchSize) {
        int safeBatchSize = batchSize == null ? 100 : batchSize;
        if (safeBatchSize <= 0 || safeBatchSize > 500) {
            throw new BadRequestException("batchSize must be between 1 and 500");
        }

        List<Notification> dueNotifications = notificationRepository.findByStatusCodeInAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
                List.of("SCHEDULED", "PENDING", "RETRYING"),
                LocalDateTime.now(),
                PageRequest.of(0, safeBatchSize)
        );

        int attempted = 0;
        int sent = 0;
        int retried = 0;
        int escalated = 0;
        int failed = 0;

        for (Notification notification : dueNotifications) {
            attempted++;
            boolean delivered = attemptDelivery(notification);

            if (delivered) {
                sent++;
                continue;
            }

            if (Boolean.TRUE.equals(notification.getEscalated())) {
                escalated++;
                continue;
            }

            if ("RETRYING".equals(notification.getStatusCode())) {
                retried++;
            } else {
                failed++;
            }
        }

        return new NotificationDtos.ProcessNotificationsResponse(attempted, sent, retried, escalated, failed);
    }

    @Override
    public NotificationDtos.NotificationOpsSummaryResponse getOperationalSummary(String reportDate) {
        LocalDate date = (reportDate == null || reportDate.isBlank()) ? LocalDate.now() : parseDate(reportDate, "reportDate");
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay().minusNanos(1);

        long pending = notificationRepository.countByStatusCodeAndCreatedAtBetween("PENDING", start, end)
                + notificationRepository.countByStatusCodeAndCreatedAtBetween("SCHEDULED", start, end);
        long retrying = notificationRepository.countByStatusCodeAndCreatedAtBetween("RETRYING", start, end);
        long sent = notificationRepository.countByStatusCodeAndCreatedAtBetween("SENT", start, end);
        long failed = notificationRepository.countByStatusCodeAndCreatedAtBetween("FAILED", start, end);
        long escalated = notificationRepository.countByStatusCodeAndCreatedAtBetween("ESCALATED", start, end);
        long total = pending + retrying + sent + failed + escalated;

        return new NotificationDtos.NotificationOpsSummaryResponse(
                date.toString(),
                total,
                pending,
                retrying,
                sent,
                failed,
                escalated
        );
    }

    private NotificationDtos.NotificationResponse createInternal(
            String employeeId,
            Long bookingId,
            String notificationType,
            String channelCode,
            String messageBody,
            LocalDateTime scheduledAt,
            int maxRetries
    ) {
        Notification notification = new Notification();
        notification.setEmployeeId(normalizeEmployeeId(employeeId));

        if (bookingId != null) {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
            notification.setBooking(booking);
        }

        notification.setNotificationType(notificationType.trim());
        notification.setChannelCode(normalizeChannel(channelCode));
        notification.setMessageBody(messageBody.trim());
        notification.setScheduledAt(scheduledAt);
        notification.setStatusCode(scheduledAt.isAfter(LocalDateTime.now()) ? "SCHEDULED" : "PENDING");
        notification.setRetryCount(0);
        notification.setMaxRetries(maxRetries);
        notification.setEscalated(false);
        notification.setCreatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);
        return toResponse(saved);
    }

    private boolean attemptDelivery(Notification notification) {
        String channel = normalizeChannel(notification.getChannelCode());
        LocalDateTime now = LocalDateTime.now();

        if (!ALLOWED_CHANNELS.contains(channel)) {
            markFailure(notification, "Unsupported channel: " + channel, now);
            return false;
        }

        notification.setStatusCode("SENT");
        notification.setSentAt(now);
        notification.setProcessedAt(now);
        notification.setLastError(null);
        notificationRepository.save(notification);
        return true;
    }

    private void markFailure(Notification notification, String errorMessage, LocalDateTime now) {
        int retries = notification.getRetryCount() == null ? 0 : notification.getRetryCount();
        int maxRetries = notification.getMaxRetries() == null ? 3 : notification.getMaxRetries();

        retries++;
        notification.setRetryCount(retries);
        notification.setLastError(errorMessage);
        notification.setProcessedAt(now);

        if (retries >= maxRetries) {
            notification.setStatusCode("ESCALATED");
            notification.setEscalated(true);
            notification.setEscalatedAt(now);
        } else {
            notification.setStatusCode("RETRYING");
            notification.setScheduledAt(now.plusMinutes(5));
        }

        notificationRepository.save(notification);
    }

    private void validateStatusTransition(String currentStatus, String targetStatus) {
        if (!ALLOWED_STATUSES.contains(currentStatus) || !ALLOWED_STATUSES.contains(targetStatus)) {
            throw new BadRequestException("Unsupported notification status transition");
        }

        if ("SENT".equals(currentStatus) && !("READ".equals(targetStatus) || "CANCELLED".equals(targetStatus))) {
            throw new BadRequestException("SENT notifications can only move to READ or CANCELLED");
        }

        if ("ESCALATED".equals(currentStatus) && !"CANCELLED".equals(targetStatus)) {
            throw new BadRequestException("ESCALATED notifications can only move to CANCELLED");
        }

        if ("READ".equals(currentStatus) || "CANCELLED".equals(currentStatus)) {
            throw new BadRequestException("Final notification status cannot be changed");
        }
    }

    private String normalizeEmployeeId(String employeeId) {
        if (employeeId == null || employeeId.isBlank()) {
            throw new BadRequestException("employeeId is required");
        }
        return employeeId.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeChannel(String channelCode) {
        if (channelCode == null || channelCode.isBlank()) {
            throw new BadRequestException("channelCode is required");
        }
        return channelCode.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeStatus(String statusCode) {
        if (statusCode == null || statusCode.isBlank()) {
            throw new BadRequestException("statusCode is required");
        }
        String normalized = statusCode.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_STATUSES.contains(normalized)) {
            throw new BadRequestException("Unsupported statusCode: " + statusCode);
        }
        return normalized;
    }

    private LocalDate parseDate(String value, String fieldName) {
        try {
            return LocalDate.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid " + fieldName + ". Use yyyy-MM-dd format");
        }
    }

    private LocalDateTime parseDateTime(String value, String fieldName) {
        try {
            return LocalDateTime.parse(value.trim());
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid " + fieldName + ". Use ISO local date-time format");
        }
    }

    private NotificationDtos.NotificationResponse toResponse(Notification notification) {
        return new NotificationDtos.NotificationResponse(
                notification.getNotificationId(),
                notification.getEmployeeId(),
                notification.getBooking() == null ? null : notification.getBooking().getBookingId(),
                notification.getNotificationType(),
                notification.getChannelCode(),
                notification.getMessageBody(),
                notification.getScheduledAt() == null ? null : notification.getScheduledAt().toString(),
                notification.getSentAt() == null ? null : notification.getSentAt().toString(),
                notification.getProcessedAt() == null ? null : notification.getProcessedAt().toString(),
                notification.getStatusCode(),
                notification.getRetryCount(),
                notification.getMaxRetries(),
                notification.getLastError(),
                notification.getEscalated(),
                notification.getEscalatedAt() == null ? null : notification.getEscalatedAt().toString(),
                notification.getCreatedAt() == null ? null : notification.getCreatedAt().toString()
        );
    }
}
