package com.example.hy_backend.repository;

import com.example.hy_backend.model.Notification;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByEmployeeIdOrderByCreatedAtDesc(String employeeId);

    List<Notification> findByEmployeeIdAndStatusCodeOrderByCreatedAtDesc(String employeeId, String statusCode);

    List<Notification> findByStatusCodeInAndScheduledAtLessThanEqualOrderByScheduledAtAsc(
            List<String> statuses,
            LocalDateTime scheduledAt,
            Pageable pageable
    );

    long countByStatusCode(String statusCode);

    long countByStatusCodeAndCreatedAtBetween(String statusCode, LocalDateTime start, LocalDateTime end);
}
