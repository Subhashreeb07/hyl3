package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.ReportDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.ReportService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public ReportServiceImpl(
            BookingRepository bookingRepository,
            FacilityRepository facilityRepository,
            FacilityRuleRepository facilityRuleRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.facilityRuleRepository = facilityRuleRepository;
    }

    @Override
    public Map<String, Long> getDailyReport() {
        List<Facility> facilities = facilityRepository.findAll();
        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        Map<String, Long> response = new LinkedHashMap<>();
        for (Facility facility : facilities) {
            long count = bookingRepository.countByFacilityFacilityIdAndStatusAndCreatedAtBetween(
                    facility.getFacilityId(),
                    BookingStatus.CONFIRMED,
                    start,
                    end
            );
            response.put(facility.getFacilityName(), count);
        }
        return response;
    }

    @Override
    public ReportDtos.FacilityReportResponse getFacilityReport(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        LocalDateTime start = LocalDate.now().atStartOfDay();
        LocalDateTime end = LocalDate.now().atTime(LocalTime.MAX);

        long confirmed = bookingRepository.countByFacilityFacilityIdAndStatusAndCreatedAtBetween(
                facilityId,
                BookingStatus.CONFIRMED,
                start,
                end
        );
        long cancelled = bookingRepository.countByFacilityFacilityIdAndStatusAndCreatedAtBetween(
                facilityId,
                BookingStatus.CANCELLED,
                start,
                end
        );

        return new ReportDtos.FacilityReportResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                confirmed,
                cancelled
        );
    }

    @Override
    public ReportDtos.AnalyticsResponse getAnalytics() {
        Map<String, Long> daily = getDailyReport();
        return new ReportDtos.AnalyticsResponse(
                facilityRepository.count(),
                facilityRepository.countByStatusTrue(),
                facilityRepository.countByPublishedTrue(),
                bookingRepository.count(),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                bookingRepository.countByStatus(BookingStatus.CANCELLED),
                daily
        );
    }

    @Override
    public ReportDtos.OperationalSummaryResponse getOperationalSummary(String bookingDate) {
        LocalDate targetDate = bookingDate == null || bookingDate.isBlank() ? LocalDate.now() : parseDate(bookingDate, "bookingDate");

        long total = bookingRepository.countByBookingDate(targetDate);
        long confirmed = bookingRepository.countByBookingDateAndStatus(targetDate, BookingStatus.CONFIRMED);
        long cancelled = bookingRepository.countByBookingDateAndStatus(targetDate, BookingStatus.CANCELLED);

        double cancellationRate = total == 0 ? 0.0 : roundTwoDecimals((cancelled * 100.0) / total);

        return new ReportDtos.OperationalSummaryResponse(
                targetDate.toString(),
                total,
                confirmed,
                cancelled,
                cancellationRate,
                facilityRepository.count(),
                facilityRepository.countByPublishedTrue()
        );
    }

    @Override
    public ReportDtos.FacilityUtilizationResponse getFacilityUtilization(Long facilityId, String bookingDate) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        LocalDate targetDate = bookingDate == null || bookingDate.isBlank() ? LocalDate.now() : parseDate(bookingDate, "bookingDate");

        long confirmed = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(
                facilityId,
                targetDate,
                BookingStatus.CONFIRMED
        );

        long cancelled = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(
                facilityId,
                targetDate,
                BookingStatus.CANCELLED
        );

        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(null);
        Integer capacity = rule == null ? null : rule.getMaximumCapacity();

        double utilization = (capacity == null || capacity <= 0)
                ? 0.0
                : roundTwoDecimals((confirmed * 100.0) / capacity);

        return new ReportDtos.FacilityUtilizationResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                targetDate.toString(),
                capacity,
                confirmed,
                cancelled,
                utilization
        );
    }

    @Override
    public ReportDtos.BookingTrendResponse getBookingTrend(Long facilityId, String fromDate, String toDate) {
        LocalDate from = parseDate(fromDate, "fromDate");
        LocalDate to = parseDate(toDate, "toDate");

        if (from.isAfter(to)) {
            throw new BadRequestException("fromDate must be on or before toDate");
        }

        long days = ChronoUnit.DAYS.between(from, to);
        if (days > 90) {
            throw new BadRequestException("Date range cannot exceed 90 days");
        }

        if (facilityId != null && !facilityRepository.existsById(facilityId)) {
            throw new ResourceNotFoundException("Facility not found with id: " + facilityId);
        }

        List<ReportDtos.TrendPoint> points = new ArrayList<>();
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            long confirmed;
            long cancelled;

            if (facilityId == null) {
                confirmed = bookingRepository.countByBookingDateAndStatus(cursor, BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByBookingDateAndStatus(cursor, BookingStatus.CANCELLED);
            } else {
                confirmed = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, cursor, BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, cursor, BookingStatus.CANCELLED);
            }

            points.add(new ReportDtos.TrendPoint(
                    cursor.toString(),
                    confirmed,
                    cancelled,
                    confirmed + cancelled
            ));
            cursor = cursor.plusDays(1);
        }

        return new ReportDtos.BookingTrendResponse(from.toString(), to.toString(), facilityId, points);
    }

    private LocalDate parseDate(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(fieldName + " is required and must use yyyy-MM-dd format");
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid " + fieldName + ". Use yyyy-MM-dd format");
        }
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
