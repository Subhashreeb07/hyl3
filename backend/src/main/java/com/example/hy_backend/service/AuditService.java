package com.example.hy_backend.service;

import com.example.hy_backend.dto.AuditDtos;

import java.util.List;

public interface AuditService {
    void logAction(
            String actorId,
            String actorRole,
            String actionCode,
            String entityName,
            String entityId,
            String oldValueJson,
            String newValueJson,
            String ipAddress
    );

    List<AuditDtos.AuditLogResponse> getAuditTrailByEntity(String entityName, String entityId);

    List<AuditDtos.AuditLogResponse> getAuditTrailByActor(String actorId);
}
