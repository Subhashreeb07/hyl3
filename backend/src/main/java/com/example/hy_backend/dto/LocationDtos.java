package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public final class LocationDtos {
    private LocationDtos() {}

    public record LocationCreateRequest(@NotBlank String locationName) {}

    public record LocationUpdateCountRequest(@NotNull Integer employeeCount) {}

    public record LocationResponse(
            Long id,
            String locationName,
            Integer employeeCount,
            String createdAt
    ) {}

    public record FacilityStatRow(
            Long facilityId,
            String facilityName,
            String category,
            Integer totalRequested,
            Integer acknowledged
    ) {}

    public record LocationStatsResponse(
            Long locationId,
            String locationName,
            String bookingDate,
            List<FacilityStatRow> facilityStats
    ) {}

    public record DashboardStatsResponse(
            long totalBookings,
            long pendingRequests,
            String todaysDeadline,
            List<DateEventCount> dateStrip
    ) {}

    public record DateEventCount(String date, String label, long eventCount) {}
}
