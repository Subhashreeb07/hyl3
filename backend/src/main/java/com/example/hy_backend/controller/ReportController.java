package com.example.hy_backend.controller;

import com.example.hy_backend.dto.ReportDtos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.hy_backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Reports", description = "Daily and analytics reporting APIs")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/daily")
    @Operation(summary = "Get daily bookings by facility")
    public ResponseEntity<Map<String, Long>> getDailyReport() {
        return ResponseEntity.ok(reportService.getDailyReport());
    }

    @GetMapping("/facility/{facilityId}")
    @Operation(summary = "Get facility report")
    public ResponseEntity<ReportDtos.FacilityReportResponse> getFacilityReport(@PathVariable Long facilityId) {
        return ResponseEntity.ok(reportService.getFacilityReport(facilityId));
    }

    @GetMapping("/analytics")
    @Operation(summary = "Get platform analytics")
    public ResponseEntity<ReportDtos.AnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(reportService.getAnalytics());
    }

    @GetMapping("/summary")
    @Operation(summary = "Get operational summary for a booking date")
    public ResponseEntity<ReportDtos.OperationalSummaryResponse> getOperationalSummary(
            @RequestParam(required = false) String bookingDate,
            @RequestParam(required = false) Long facilityId
    ) {
        return ResponseEntity.ok(reportService.getOperationalSummary(bookingDate, facilityId));
    }

    @GetMapping("/facility/{facilityId}/utilization")
    @Operation(summary = "Get facility utilization by booking date")
    public ResponseEntity<ReportDtos.FacilityUtilizationResponse> getFacilityUtilization(
            @PathVariable Long facilityId,
            @RequestParam(required = false) String bookingDate
    ) {
        return ResponseEntity.ok(reportService.getFacilityUtilization(facilityId, bookingDate));
    }

    @GetMapping("/trend")
    @Operation(summary = "Get booking trend for platform or a single facility")
    public ResponseEntity<ReportDtos.BookingTrendResponse> getBookingTrend(
            @RequestParam(required = false) Long facilityId,
            @RequestParam String fromDate,
            @RequestParam String toDate
    ) {
        return ResponseEntity.ok(reportService.getBookingTrend(facilityId, fromDate, toDate));
    }

    @GetMapping({"/registrations", "/registrations/", "/employee-registrations", "/employee-registrations/"})
    @Operation(summary = "Get employee registrations for admin review")
    public ResponseEntity<ReportDtos.EmployeeRegistrationsResponse> getEmployeeRegistrations(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String location
    ) {
        return ResponseEntity.ok(reportService.getEmployeeRegistrations(query, location));
    }
}
