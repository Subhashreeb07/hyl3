package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.NotificationTemplate;
import com.example.hy_backend.repository.NotificationTemplateRepository;
import com.example.hy_backend.service.NotificationTemplateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NotificationTemplateServiceImpl implements NotificationTemplateService {

    private static final Logger log = LoggerFactory.getLogger(NotificationTemplateServiceImpl.class);

    private final NotificationTemplateRepository repo;
    private final JavaMailSender mailSender;
    private final boolean emailEnabled;
    private final String mailFrom;

    public NotificationTemplateServiceImpl(
            NotificationTemplateRepository repo,
            JavaMailSender mailSender,
            @Value("${app.notifications.email.enabled:false}") boolean emailEnabled,
            @Value("${spring.mail.username:no-reply@hyhub.local}") String mailFrom
    ) {
        this.repo = repo;
        this.mailSender = mailSender;
        this.emailEnabled = emailEnabled;
        this.mailFrom = mailFrom;
    }

    @Override
    @Transactional(readOnly = true)
    public List<TemplateDto> getAll() {
        return repo.findAll().stream()
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public TemplateDto update(String templateKey, UpdateTemplateRequest request) {
        NotificationTemplate t = repo.findByTemplateKey(templateKey)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found: " + templateKey));
        if (request.subject() != null && !request.subject().isBlank()) {
            t.setSubject(request.subject().trim());
        }
        if (request.body() != null && !request.body().isBlank()) {
            t.setBody(request.body().trim());
        }
        if (request.displayName() != null && !request.displayName().isBlank()) {
            t.setDisplayName(request.displayName().trim());
        }
        return toDto(repo.save(t));
    }

    @Override
    public TestSendResponse testSend(TestSendRequest request) {
        if (request.toEmail() == null || !request.toEmail().contains("@")) {
            throw new BadRequestException("A valid recipient email address is required.");
        }
        if (!emailEnabled) {
            return new TestSendResponse(false,
                    "Email is disabled. Set app.notifications.email.enabled=true and configure SMTP.");
        }

        String facilityName = request.facilityName() != null ? request.facilityName() : "Test Facility";
        String[] parts = resolveTemplate(request.templateKey(), facilityName, "Test Employee");

        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(mailFrom);
            msg.setTo(request.toEmail().trim());
            msg.setSubject("[TEST] " + parts[0]);
            msg.setText(parts[1] + "\n\n--- This is a test message sent from HyHub admin panel ---");
            mailSender.send(msg);
            log.info("Test email sent to {} for template {}", request.toEmail(), request.templateKey());
            return new TestSendResponse(true, "Test email sent to " + request.toEmail());
        } catch (Exception e) {
            log.error("Test email failed: {}", e.getMessage());
            return new TestSendResponse(false, "Failed to send: " + e.getMessage());
        }
    }

    @Override
    public String[] resolveTemplate(String templateKey, String facilityName, String employeeName) {
        NotificationTemplate t = repo.findByTemplateKey(templateKey).orElse(null);
        String subject, body;
        if (t == null) {
            subject = "Notification: " + facilityName;
            body    = "Dear " + employeeName + ",\n\nThis is a notification regarding " + facilityName + ".";
        } else {
            subject = applyPlaceholders(t.getSubject(), facilityName, employeeName);
            body    = applyPlaceholders(t.getBody(),    facilityName, employeeName);
        }
        return new String[]{ subject, body };
    }

    private String applyPlaceholders(String template, String facilityName, String employeeName) {
        return template
                .replace("{{facilityName}}", facilityName != null ? facilityName : "")
                .replace("{{employeeName}}", employeeName != null ? employeeName : "");
    }

    private TemplateDto toDto(NotificationTemplate t) {
        return new TemplateDto(
                t.getId(), t.getTemplateKey(), t.getDisplayName(),
                t.getSubject(), t.getBody(),
                t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null
        );
    }
}
