package com.example.hy_backend.service;

import java.util.List;

public interface NotificationTemplateService {
    record TemplateDto(Long id, String templateKey, String displayName, String subject, String body, String updatedAt) {}
    record UpdateTemplateRequest(String subject, String body, String displayName) {}
    record TestSendRequest(String toEmail, String templateKey, String facilityName) {}
    record TestSendResponse(boolean sent, String message) {}

    List<TemplateDto> getAll();
    TemplateDto update(String templateKey, UpdateTemplateRequest request);
    TestSendResponse testSend(TestSendRequest request);

    /** Resolve subject/body for a template key, substituting placeholders. */
    String[] resolveTemplate(String templateKey, String facilityName, String employeeName);
}
