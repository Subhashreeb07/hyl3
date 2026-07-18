package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.service.NotificationAdminService;
import com.example.hy_backend.service.SseEmitterService;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationAdminServiceImpl implements NotificationAdminService {

    private static final Logger log = LoggerFactory.getLogger(NotificationAdminServiceImpl.class);

    private final EmployeeRepository employeeRepository;
    private final SseEmitterService sseEmitterService;
    private final JavaMailSender mailSender;
    private final boolean emailEnabled;
    private final String mailFrom;

    private final AtomicLong historySequence = new AtomicLong(1);
    private final List<HistoryEntry> historyEntries = new CopyOnWriteArrayList<>();
    private final List<EmployeeNotificationEntry> employeeNotificationEntries = new CopyOnWriteArrayList<>();

    public NotificationAdminServiceImpl(
            EmployeeRepository employeeRepository,
            SseEmitterService sseEmitterService,
            JavaMailSender mailSender,
            @Value("${app.notifications.email.enabled:false}") boolean emailEnabled,
            @Value("${spring.mail.username:no-reply@hyhub.local}") String mailFrom
    ) {
        this.employeeRepository = employeeRepository;
        this.sseEmitterService = sseEmitterService;
        this.mailSender = mailSender;
        this.emailEnabled = emailEnabled;
        this.mailFrom = mailFrom;
    }

    @Override
    public NotificationDtos.BroadcastNotificationResponse sendBroadcast(NotificationDtos.BroadcastNotificationRequest request) {
        List<String> channels = normalizeChannels(request.channels());
        if (channels.isEmpty()) {
            throw new BadRequestException("At least one channel must be provided");
        }

        List<Employee> recipients = resolveRecipients(request);
        if (recipients.isEmpty()) {
            return new NotificationDtos.BroadcastNotificationResponse(0, 0, List.of(), "No employees matched the selected filters.");
        }

        boolean dryRun = Boolean.TRUE.equals(request.dryRun());
        int created = 0;
        int skippedUndeliverableEmail = 0;
        for (Employee employee : recipients) {
            for (String channel : channels) {
                if ("IN_APP".equals(channel)) {
                    if (!dryRun) {
                        sseEmitterService.sendNotification(employee.getEmployeeId(), buildInAppPayload(request, employee));
                        storeEmployeeNotification(employee, request, channel, "SENT");
                    }
                    addHistory(employee, request, channel, "SENT");
                    created++;
                    continue;
                }

                if ("EMAIL".equals(channel)) {
                    if (!isDeliverableEmail(employee.getEmail())) {
                        addHistory(employee, request, channel, "FAILED");
                        skippedUndeliverableEmail++;
                        continue;
                    }
                    if (!emailEnabled) {
                        addHistory(employee, request, channel, "FAILED");
                        continue;
                    }
                    if (!dryRun) {
                        sendEmail(employee, request.subject(), request.messageBody());
                    }
                    addHistory(employee, request, channel, "SENT");
                    created++;
                }
            }
        }

        if (skippedUndeliverableEmail > 0) {
            log.info("Skipped {} undeliverable/test email recipients for notification type {}",
                    skippedUndeliverableEmail,
                    request.notificationType());
        }

        List<String> sample = recipients.stream().map(Employee::getEmployeeId).limit(10).toList();
        String message;
        if (dryRun) {
            message = "Dry run completed. Notifications were not dispatched.";
        } else if (created == 0 && !recipients.isEmpty()) {
            if (channels.contains("EMAIL") && !emailEnabled) {
                message = "No notifications sent. Email notifications are disabled in this environment.";
            } else if (channels.contains("EMAIL") && skippedUndeliverableEmail > 0) {
                message = "No notifications sent. Matched users have undeliverable test emails.";
            } else {
                message = "No notifications were created for the selected channels.";
            }
        } else {
            message = "Notifications dispatched successfully.";
        }

        return new NotificationDtos.BroadcastNotificationResponse(
                recipients.size(),
                created,
                sample,
                message
        );
    }

    @Override
    public NotificationDtos.NotificationHistoryResponse getHistory(String query, String status, String channel, int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.max(pageSize, 1);
        String normalizedQuery = normalizeNullable(query);
        String normalizedStatus = normalizeNullable(status);
        String normalizedChannel = normalizeNullable(channel);

        List<HistoryEntry> filtered = historyEntries.stream()
                .filter(entry -> normalizedQuery == null || containsIgnoreCase(entry.employeeId(), normalizedQuery)
                        || containsIgnoreCase(entry.employeeName(), normalizedQuery)
                        || containsIgnoreCase(entry.subject(), normalizedQuery))
                .filter(entry -> normalizedStatus == null || normalizedStatus.equalsIgnoreCase(entry.status()))
                .filter(entry -> normalizedChannel == null || normalizedChannel.equalsIgnoreCase(entry.channel()))
                .sorted(Comparator.comparingLong(HistoryEntry::notificationId).reversed())
                .toList();

        int total = filtered.size();
        int fromIndex = Math.min((safePage - 1) * safePageSize, total);
        int toIndex = Math.min(fromIndex + safePageSize, total);

        List<NotificationDtos.NotificationHistoryItem> items = filtered.subList(fromIndex, toIndex).stream()
                .map(this::toHistoryItem)
                .toList();

        return new NotificationDtos.NotificationHistoryResponse(items, total, safePage, safePageSize);
    }

    @Override
    public NotificationDtos.EmployeeNotificationListResponse getEmployeeNotifications(String employeeId, String statusCode) {
        String normalizedEmployeeId = normalizeNullable(employeeId) == null
                ? ""
                : employeeId.trim().toUpperCase(Locale.ROOT);
        String normalizedStatus = normalizeNullable(statusCode);

        List<NotificationDtos.EmployeeNotificationItem> items = employeeNotificationEntries.stream()
                .filter(entry -> entry.employeeId().equalsIgnoreCase(normalizedEmployeeId))
                .filter(entry -> normalizedStatus == null || normalizedStatus.equalsIgnoreCase(entry.statusCode()))
                .sorted(Comparator.comparingLong(EmployeeNotificationEntry::notificationId).reversed())
                .map(this::toEmployeeNotificationItem)
                .toList();

        return new NotificationDtos.EmployeeNotificationListResponse(items);
    }

    @Override
    public void markNotificationRead(long notificationId) {
        for (int i = 0; i < employeeNotificationEntries.size(); i++) {
            EmployeeNotificationEntry entry = employeeNotificationEntries.get(i);
            if (entry.notificationId() == notificationId) {
                employeeNotificationEntries.set(i, entry.markRead());
                return;
            }
        }
        throw new ResourceNotFoundException("Notification not found: " + notificationId);
    }

    private List<String> normalizeChannels(List<String> channels) {
        if (channels == null) {
            return List.of();
        }
        Set<String> allowed = Set.of("IN_APP", "EMAIL");
        return channels.stream()
                .filter(Objects::nonNull)
                .map(value -> value.trim().toUpperCase(Locale.ROOT))
                .filter(allowed::contains)
                .distinct()
                .toList();
    }

    private List<Employee> resolveRecipients(NotificationDtos.BroadcastNotificationRequest request) {
        List<Employee> all = employeeRepository.findAllByOrderByCreatedAtDesc();
        Set<String> explicitIds = request.employeeIds() == null
                ? Set.of()
                : request.employeeIds().stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toSet());

        String location = normalizeNullable(request.location());
        String workMode = normalizeNullable(request.workMode());
        Boolean activeOnly = request.activeOnly();

        return all.stream()
                .filter(employee -> explicitIds.isEmpty() || explicitIds.contains(employee.getEmployeeId()))
                .filter(employee -> matchesAnyToken(employee.getOfficeLocation(), location))
                .filter(employee -> matchesAnyToken(employee.getWorkMode(), workMode))
                // Current schema has no active flag; keep forward-compatible handling.
                .filter(employee -> activeOnly == null || !activeOnly || employee.getRoleCode() != null)
                .toList();
    }

    private boolean matchesAnyToken(String candidateValue, String filterValue) {
        if (filterValue == null || "ALL".equalsIgnoreCase(filterValue)) {
            return true;
        }
        if (candidateValue == null || candidateValue.isBlank()) {
            return false;
        }

        String normalizedCandidate = candidateValue.trim().toUpperCase(Locale.ROOT);
        return java.util.Arrays.stream(filterValue.split(","))
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .map(token -> token.toUpperCase(Locale.ROOT))
                .anyMatch(normalizedCandidate::equals);
    }

    private void sendEmail(Employee employee, String subject, String body) {
        if (employee.getEmail() == null || employee.getEmail().isBlank()) {
            throw new BadRequestException("Employee does not have a valid email: " + employee.getEmployeeId());
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(employee.getEmail());
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    private boolean isDeliverableEmail(String email) {
        if (email == null) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (normalized.isBlank() || !normalized.contains("@")) {
            return false;
        }
        return !(normalized.endsWith(".local")
                || normalized.endsWith("@example.com")
                || normalized.endsWith("@test.com"));
    }

    private void addHistory(Employee employee, NotificationDtos.BroadcastNotificationRequest request, String channel, String status) {
        historyEntries.add(new HistoryEntry(
                historySequence.getAndIncrement(),
                employee.getEmployeeId(),
                employee.getFullName(),
                "GLOBAL",
                request.notificationType(),
                request.subject(),
                channel,
                LocalDateTime.now(),
                false,
                false,
                status
        ));

        // Prevent unbounded memory growth for this in-memory history implementation.
        if (historyEntries.size() > 5000) {
            List<HistoryEntry> copy = new ArrayList<>(historyEntries);
            copy.sort(Comparator.comparingLong(HistoryEntry::notificationId).reversed());
            List<Long> keepIds = copy.stream().limit(5000).map(HistoryEntry::notificationId).toList();
            historyEntries.removeIf(entry -> !keepIds.contains(entry.notificationId()));
        }
    }

    private NotificationDtos.NotificationHistoryItem toHistoryItem(HistoryEntry entry) {
        String sentTime = Instant.ofEpochMilli(entry.sentAt().toInstant(ZoneOffset.UTC).toEpochMilli()).toString();
        return new NotificationDtos.NotificationHistoryItem(
                entry.notificationId(),
                entry.employeeId(),
                entry.employeeName(),
                entry.facilityName(),
                entry.templateName(),
                entry.channel(),
                sentTime,
                entry.opened(),
                entry.read(),
                entry.status()
        );
    }

    private NotificationDtos.EmployeeNotificationItem toEmployeeNotificationItem(EmployeeNotificationEntry entry) {
        return new NotificationDtos.EmployeeNotificationItem(
                entry.notificationId(),
                entry.employeeId(),
                entry.bookingId(),
                entry.notificationType(),
                entry.channelCode(),
                entry.messageBody(),
                null,
                entry.sentAt(),
                entry.processedAt(),
                entry.statusCode(),
                entry.createdAt()
        );
    }

    private void storeEmployeeNotification(
            Employee employee,
            NotificationDtos.BroadcastNotificationRequest request,
            String channel,
            String statusCode
    ) {
        long id = historySequence.getAndIncrement();
        String now = Instant.now().toString();
        employeeNotificationEntries.add(new EmployeeNotificationEntry(
                id,
                employee.getEmployeeId(),
                null,
                request.notificationType(),
                channel,
                request.messageBody(),
                "SENT".equalsIgnoreCase(statusCode) ? now : null,
                null,
                statusCode,
                now
        ));

        // Prevent unbounded memory growth for employee inbox in this in-memory implementation.
        if (employeeNotificationEntries.size() > 5000) {
            List<EmployeeNotificationEntry> copy = new ArrayList<>(employeeNotificationEntries);
            copy.sort(Comparator.comparingLong(EmployeeNotificationEntry::notificationId).reversed());
            List<Long> keepIds = copy.stream().limit(5000).map(EmployeeNotificationEntry::notificationId).toList();
            employeeNotificationEntries.removeIf(entry -> !keepIds.contains(entry.notificationId()));
        }
    }

    private Object buildInAppPayload(NotificationDtos.BroadcastNotificationRequest request, Employee employee) {
        return new InAppPayload(
                request.notificationType(),
                request.subject(),
                request.messageBody(),
                employee.getEmployeeId(),
                employee.getFullName(),
                LocalDateTime.now().toString()
        );
    }

    private static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isBlank() ? null : normalized;
    }

    private static boolean containsIgnoreCase(String source, String token) {
        if (source == null || token == null) {
            return false;
        }
        return source.toLowerCase(Locale.ROOT).contains(token.toLowerCase(Locale.ROOT));
    }

    private record InAppPayload(
            String notificationType,
            String subject,
            String messageBody,
            String employeeId,
            String employeeName,
            String sentAt
    ) {
    }

    private record HistoryEntry(
            long notificationId,
            String employeeId,
            String employeeName,
            String facilityName,
            String templateName,
            String subject,
            String channel,
            LocalDateTime sentAt,
            boolean opened,
            boolean read,
            String status
    ) {
    }

    private record EmployeeNotificationEntry(
            long notificationId,
            String employeeId,
            Long bookingId,
            String notificationType,
            String channelCode,
            String messageBody,
            String sentAt,
            String processedAt,
            String statusCode,
            String createdAt
    ) {
        private EmployeeNotificationEntry markRead() {
            String processed = Instant.now().toString();
            return new EmployeeNotificationEntry(
                    notificationId,
                    employeeId,
                    bookingId,
                    notificationType,
                    channelCode,
                    messageBody,
                    sentAt,
                    processed,
                    "READ",
                    createdAt
            );
        }
    }
}