package com.example.hy_backend.dto;

import java.util.List;
import java.util.Map;

public final class ReportDtos {

    private ReportDtos() {
    }

    public record FacilityReportResponse(Long facilityId, String facilityName, long confirmedToday, long cancelledToday) {
    }

    public record AnalyticsResponse(
            long totalFacilities,
            long publishedFacilities,
            long totalBookings,
            long confirmedBookings,
            long cancelledBookings,
            Map<String, Long> dailyByFacility
    ) {
    }

        public record OperationalSummaryResponse(
            String bookingDate,
            long totalBookings,
            long confirmedBookings,
            long cancelledBookings,
            double cancellationRate,
            long totalFacilities,
            long publishedFacilities
        ) {
        }

        public record FacilityUtilizationResponse(
            Long facilityId,
            String facilityName,
            String bookingDate,
            long confirmedBookings,
            long cancelledBookings
        ) {
        }

        public record TrendPoint(String bookingDate, long confirmedBookings, long cancelledBookings, long totalBookings) {
        }

        public record BookingTrendResponse(String fromDate, String toDate, Long facilityId, List<TrendPoint> points) {
        }

        public record EmployeeRegistrationItem(
            String employeeId,
            String fullName,
            String email,
            String department,
            String officeLocation,
            String workMode,
            String roleCode,
            String createdAt
        ) {
        }

        public record EmployeeRegistrationsResponse(
            List<EmployeeRegistrationItem> items,
            long total
        ) {
        }
}
