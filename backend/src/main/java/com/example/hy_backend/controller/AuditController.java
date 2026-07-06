package com.example.hy_backend.controller;

import com.example.hy_backend.dto.AuditDtos;
import com.example.hy_backend.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit")
@Tag(name = "Audit", description = "Audit trail APIs")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/entity/{entityName}/{entityId}")
    @Operation(summary = "Get audit trail by entity")
    public ResponseEntity<AuditDtos.AuditTrailResponse> getByEntity(
            @PathVariable String entityName,
            @PathVariable String entityId
    ) {
        return ResponseEntity.ok(new AuditDtos.AuditTrailResponse(
                auditService.getAuditTrailByEntity(entityName, entityId)
        ));
    }

    @GetMapping("/actor/{actorId}")
    @Operation(summary = "Get audit trail by actor")
    public ResponseEntity<AuditDtos.AuditTrailResponse> getByActor(@PathVariable String actorId) {
        return ResponseEntity.ok(new AuditDtos.AuditTrailResponse(
                auditService.getAuditTrailByActor(actorId)
        ));
    }

    @GetMapping
    @Operation(summary = "Get audit trail by optional filters")
    public ResponseEntity<AuditDtos.AuditTrailResponse> search(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String entityName,
            @RequestParam(required = false) String entityId
    ) {
        if (actorId != null && !actorId.isBlank()) {
            return ResponseEntity.ok(new AuditDtos.AuditTrailResponse(auditService.getAuditTrailByActor(actorId)));
        }

        if (entityName != null && !entityName.isBlank() && entityId != null && !entityId.isBlank()) {
            return ResponseEntity.ok(new AuditDtos.AuditTrailResponse(auditService.getAuditTrailByEntity(entityName, entityId)));
        }

        return ResponseEntity.ok(new AuditDtos.AuditTrailResponse(java.util.List.of()));
    }
}
