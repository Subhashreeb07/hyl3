package com.example.hy_backend.service;

import com.example.hy_backend.dto.ReportDtos;

import java.util.Map;

public interface ReportService {
    Map<String, Long> getDailyReport();

    ReportDtos.FacilityReportResponse getFacilityReport(Long facilityId);

    ReportDtos.AnalyticsResponse getAnalytics();

    ReportDtos.OperationalSummaryResponse getOperationalSummary(String bookingDate);

    ReportDtos.FacilityUtilizationResponse getFacilityUtilization(Long facilityId, String bookingDate);

    ReportDtos.BookingTrendResponse getBookingTrend(Long facilityId, String fromDate, String toDate);
}
