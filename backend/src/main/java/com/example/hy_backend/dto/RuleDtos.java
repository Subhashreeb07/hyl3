package com.example.hy_backend.dto;

import jakarta.validation.constraints.Min;

public final class RuleDtos {

    private RuleDtos() {
    }

    public record RuleRequest(
            String bookingDeadline,
            String bookingStartTime,
            String reminderTime,
            Boolean qrRequired,
            Boolean allowCancellation,
            @Min(1) Integer maximumCapacity,
            Boolean regularCommuteEnabled,
            String availableDays,
            Integer bookingWindowDays,
            String facilityAvailableFromDate,
            String facilityAvailableToDate,
            String cancellationDeadline,
            String employeeTypes,
            String roles
    ) {
    }

    public record RuleResponse(
            String bookingDeadline,
            String bookingStartTime,
            String reminderTime,
            Boolean qrRequired,
            Boolean allowCancellation,
            Integer maximumCapacity,
            Boolean regularCommuteEnabled,
            String availableDays,
            Integer bookingWindowDays,
            String facilityAvailableFromDate,
            String facilityAvailableToDate,
            String cancellationDeadline,
            String employeeTypes,
            String roles
    ) {
    }
}
