package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.AuditDtos;
import com.example.hy_backend.model.AuditLog;
import com.example.hy_backend.repository.AuditLogRepository;
import com.example.hy_backend.service.AuditService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    public void logAction(
            String actorId,
            String actorRole,
            String actionCode,
            String entityName,
            String entityId,
            String oldValueJson,
            String newValueJson,
            String ipAddress
    ) {
        AuditLog log = new AuditLog();
        log.setActorId(actorId);
        log.setActorRole(actorRole);
        log.setActionCode(actionCode);
        log.setEntityName(entityName);
        log.setEntityId(entityId);
        log.setOldValueJson(oldValueJson);
        log.setNewValueJson(newValueJson);
        log.setOccurredAt(LocalDateTime.now());
        log.setIpAddress(ipAddress);
        auditLogRepository.save(log);
    }

    @Override
    public List<AuditDtos.AuditLogResponse> getAuditTrailByEntity(String entityName, String entityId) {
        return auditLogRepository.findByEntityNameAndEntityIdOrderByOccurredAtDesc(entityName, entityId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public List<AuditDtos.AuditLogResponse> getAuditTrailByActor(String actorId) {
        return auditLogRepository.findByActorIdOrderByOccurredAtDesc(actorId).stream()
                .map(this::toResponse)
                .toList();
    }

    private AuditDtos.AuditLogResponse toResponse(AuditLog log) {
        return new AuditDtos.AuditLogResponse(
                log.getAuditId(),
                log.getActorId(),
                log.getActorRole(),
                log.getActionCode(),
                log.getEntityName(),
                log.getEntityId(),
                log.getOldValueJson(),
                log.getNewValueJson(),
                log.getOccurredAt() == null ? null : log.getOccurredAt().toString(),
                log.getIpAddress()
        );
    }
}
