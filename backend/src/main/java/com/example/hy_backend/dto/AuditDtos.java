package com.example.hy_backend.dto;

import java.util.List;

public final class AuditDtos {

    private AuditDtos() {
    }

    public record AuditLogResponse(
            Long auditId,
            String actorId,
            String actorRole,
            String actionCode,
            String entityName,
            String entityId,
            String oldValueJson,
            String newValueJson,
            String occurredAt,
            String ipAddress
    ) {
    }

    public record AuditTrailResponse(List<AuditLogResponse> entries) {
    }
}
