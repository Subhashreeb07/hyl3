package com.example.hy_backend.repository;

import com.example.hy_backend.model.AuditLog;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByEntityNameAndEntityIdOrderByOccurredAtDesc(String entityName, String entityId);

    List<AuditLog> findByActorIdOrderByOccurredAtDesc(String actorId);

    long countByActionCodeAndOccurredAtBetween(String actionCode, LocalDateTime start, LocalDateTime end);
}
