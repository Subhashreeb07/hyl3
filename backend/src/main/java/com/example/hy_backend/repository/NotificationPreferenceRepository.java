package com.example.hy_backend.repository;

import com.example.hy_backend.model.NotificationPreference;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationPreferenceRepository extends JpaRepository<NotificationPreference, Long> {
    Optional<NotificationPreference> findByEmployeeIdAndNotificationType(String employeeId, String notificationType);
}
