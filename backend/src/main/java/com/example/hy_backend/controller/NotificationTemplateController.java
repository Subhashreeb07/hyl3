package com.example.hy_backend.controller;

import com.example.hy_backend.service.NotificationTemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/notification-templates")
@Tag(name = "Admin - Notification Templates", description = "Manage email notification templates")
public class NotificationTemplateController {

    private final NotificationTemplateService service;

    public NotificationTemplateController(NotificationTemplateService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "Get all notification templates")
    public ResponseEntity<List<NotificationTemplateService.TemplateDto>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PutMapping("/{templateKey}")
    @Operation(summary = "Update a notification template by key (PUBLISH or REMINDER)")
    public ResponseEntity<NotificationTemplateService.TemplateDto> update(
            @PathVariable String templateKey,
            @RequestBody NotificationTemplateService.UpdateTemplateRequest request) {
        return ResponseEntity.ok(service.update(templateKey, request));
    }

    @PostMapping("/test-send")
    @Operation(summary = "Send a test email to verify SMTP and template")
    public ResponseEntity<NotificationTemplateService.TestSendResponse> testSend(
            @RequestBody NotificationTemplateService.TestSendRequest request) {
        return ResponseEntity.ok(service.testSend(request));
    }
}
