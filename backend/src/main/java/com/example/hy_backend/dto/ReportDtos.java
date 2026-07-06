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
            long activeFacilities,
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
            Integer maximumCapacity,
            long confirmedBookings,
            long cancelledBookings,
            double utilizationPercent
        ) {
        }

        public record TrendPoint(String bookingDate, long confirmedBookings, long cancelledBookings, long totalBookings) {
        }

        public record BookingTrendResponse(String fromDate, String toDate, Long facilityId, List<TrendPoint> points) {
        }
}
