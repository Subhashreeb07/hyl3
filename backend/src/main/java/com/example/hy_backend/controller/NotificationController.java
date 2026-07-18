package com.example.hy_backend.controller;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.service.NotificationAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Admin - Notifications", description = "Admin notification operations including SMTP dispatch")
public class NotificationController {

    private final NotificationAdminService notificationAdminService;

    public NotificationController(NotificationAdminService notificationAdminService) {
        this.notificationAdminService = notificationAdminService;
    }

    @PostMapping("/broadcast")
    @Operation(summary = "Broadcast notification to employees")
    public ResponseEntity<NotificationDtos.BroadcastNotificationResponse> broadcast(
            @Valid @RequestBody NotificationDtos.BroadcastNotificationRequest request
    ) {
        return ResponseEntity.ok(notificationAdminService.sendBroadcast(request));
    }

    @GetMapping("/history")
    @Operation(summary = "Get notification delivery history")
    public ResponseEntity<NotificationDtos.NotificationHistoryResponse> history(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String channel,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return ResponseEntity.ok(notificationAdminService.getHistory(query, status, channel, page, pageSize));
    }

    @GetMapping("/employee/{employeeId}")
    @Operation(summary = "Get notifications for a specific employee")
    public ResponseEntity<NotificationDtos.EmployeeNotificationListResponse> employeeNotifications(
            @PathVariable String employeeId,
            @RequestParam(required = false) String statusCode
    ) {
        return ResponseEntity.ok(notificationAdminService.getEmployeeNotifications(employeeId, statusCode));
    }

    @PostMapping("/{notificationId}/read")
    @Operation(summary = "Mark an employee notification as read")
    public ResponseEntity<Void> markRead(@PathVariable long notificationId) {
        notificationAdminService.markNotificationRead(notificationId);
        return ResponseEntity.ok().build();
    }
}