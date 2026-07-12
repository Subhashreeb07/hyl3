package com.example.hy_backend.controller;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.service.NotificationScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications/schedule")
public class NotificationScheduleController {

    private final NotificationScheduleService scheduleService;

    public NotificationScheduleController(NotificationScheduleService scheduleService) {
        this.scheduleService = scheduleService;
    }

    @PostMapping
    public ResponseEntity<NotificationDtos.ScheduleResponse> createSchedule(
            @RequestHeader("X-Employee-Id") String employeeId,
            @Valid @RequestBody NotificationDtos.CreateScheduleRequest request) {
        NotificationDtos.ScheduleResponse response = scheduleService.createSchedule(employeeId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping
    public ResponseEntity<NotificationDtos.ScheduleResponse> updateSchedule(
            @RequestHeader("X-Employee-Id") String employeeId,
            @Valid @RequestBody NotificationDtos.UpdateScheduleRequest request) {
        NotificationDtos.ScheduleResponse response = scheduleService.updateSchedule(employeeId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{scheduleId}")
    public ResponseEntity<NotificationDtos.ScheduleResponse> getSchedule(
            @RequestHeader("X-Employee-Id") String employeeId,
            @PathVariable Long scheduleId) {
        NotificationDtos.ScheduleResponse response = scheduleService.getSchedule(employeeId, scheduleId);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<NotificationDtos.ScheduleListResponse> getEmployeeSchedules(
            @RequestHeader("X-Employee-Id") String employeeId) {
        NotificationDtos.ScheduleListResponse response = scheduleService.getEmployeeSchedules(employeeId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{scheduleId}")
    public ResponseEntity<Void> deleteSchedule(
            @RequestHeader("X-Employee-Id") String employeeId,
            @PathVariable Long scheduleId) {
        boolean deleted = scheduleService.deleteSchedule(employeeId, scheduleId);
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }
}
