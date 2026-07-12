package com.example.hy_backend.repository;

import com.example.hy_backend.model.NotificationSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationScheduleRepository extends JpaRepository<NotificationSchedule, Long> {

    List<NotificationSchedule> findByEmployeeId(String employeeId);

    List<NotificationSchedule> findByEmployeeIdAndActive(String employeeId, Boolean active);

    @Query("SELECT ns FROM NotificationSchedule ns WHERE ns.active = true " +
           "AND ns.startDate <= :now " +
           "AND (ns.endDate IS NULL OR ns.endDate >= :now)")
    List<NotificationSchedule> findActiveSchedules(@Param("now") LocalDateTime now);

    @Query("SELECT ns FROM NotificationSchedule ns WHERE ns.active = true " +
           "AND ns.frequency = 'ONCE' " +
           "AND ns.scheduledTime <= :now " +
           "AND ns.scheduledTime > :previousRun")
    List<NotificationSchedule> findDueOneTimeSchedules(@Param("now") LocalDateTime now, @Param("previousRun") LocalDateTime previousRun);

    @Query("SELECT ns FROM NotificationSchedule ns WHERE ns.active = true " +
           "AND ns.frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')")
    List<NotificationSchedule> findRecurringSchedules();

    List<NotificationSchedule> findByEmployeeIdOrderByCreatedAtDesc(String employeeId);

    Optional<NotificationSchedule> findByScheduleIdAndEmployeeId(Long scheduleId, String employeeId);

    long deleteByScheduleIdAndEmployeeId(Long scheduleId, String employeeId);

    long countByEmployeeId(String employeeId);
}
