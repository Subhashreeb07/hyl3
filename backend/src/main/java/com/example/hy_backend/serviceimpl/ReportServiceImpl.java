package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.ReportDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.EmployeeRepository;
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
import java.util.Locale;
import java.util.Map;

@Service
public class ReportServiceImpl implements ReportService {

    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final FacilityRepository facilityRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public ReportServiceImpl(
            BookingRepository bookingRepository,
            EmployeeRepository employeeRepository,
            FacilityRepository facilityRepository,
            FacilityRuleRepository facilityRuleRepository
    ) {
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
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
                facilityRepository.countByPublishedTrue(),
                bookingRepository.count(),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                bookingRepository.countByStatus(BookingStatus.CANCELLED),
                daily
        );
    }

    @Override
    public ReportDtos.OperationalSummaryResponse getOperationalSummary(String bookingDate, Long facilityId) {
        LocalDate targetDate;
        if (bookingDate == null || bookingDate.isBlank() || "all".equalsIgnoreCase(bookingDate.trim())) {
            targetDate = null;
        } else {
            targetDate = parseDate(bookingDate, "bookingDate");
        }

        long total;
        long confirmed;
        long cancelled;
        
        if (targetDate == null) {
            // Aggregate all time
            if (facilityId == null) {
                total = bookingRepository.count();
                confirmed = bookingRepository.countByStatus(BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);
            } else {
                total = bookingRepository.countByFacilityFacilityId(facilityId);
                confirmed = bookingRepository.countByFacilityFacilityIdAndStatus(facilityId, BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByFacilityFacilityIdAndStatus(facilityId, BookingStatus.CANCELLED);
            }
        } else {
            if (facilityId == null) {
                total = bookingRepository.countByBookingDate(targetDate);
                confirmed = bookingRepository.countByBookingDateAndStatus(targetDate, BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByBookingDateAndStatus(targetDate, BookingStatus.CANCELLED);
            } else {
                total = bookingRepository.countByFacilityFacilityIdAndBookingDate(facilityId, targetDate);
                confirmed = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, targetDate, BookingStatus.CONFIRMED);
                cancelled = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, targetDate, BookingStatus.CANCELLED);
            }
        }

        double cancellationRate = total == 0 ? 0.0 : roundTwoDecimals((cancelled * 100.0) / total);

        return new ReportDtos.OperationalSummaryResponse(
                targetDate == null ? "All Time" : targetDate.toString(),
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

        return new ReportDtos.FacilityUtilizationResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                targetDate.toString(),
                confirmed,
                cancelled
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

    @Override
    public ReportDtos.EmployeeRegistrationsResponse getEmployeeRegistrations(String query, String location) {
        String normalizedQuery = normalizeNullable(query);
        String normalizedLocation = normalizeNullable(location);

        List<Employee> allEmployees = employeeRepository.findAllByOrderByCreatedAtDesc();
        List<Employee> filtered = allEmployees.stream()
            .filter(employee -> matchesQuery(employee, normalizedQuery))
            .filter(employee -> matchesLocation(employee, normalizedLocation))
            .toList();

        List<ReportDtos.EmployeeRegistrationItem> items = filtered.stream()
            .map(employee -> new ReportDtos.EmployeeRegistrationItem(
                employee.getEmployeeId(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getOfficeLocation(),
                employee.getWorkMode(),
                employee.getRoleCode(),
                employee.getCreatedAt() == null ? null : employee.getCreatedAt().toString()
            ))
            .toList();

        return new ReportDtos.EmployeeRegistrationsResponse(items, filtered.size());
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

    private String normalizeNullable(String raw) {
        if (raw == null) {
            return null;
        }
        String value = raw.trim();
        return value.isEmpty() ? null : value.toUpperCase(Locale.ROOT);
    }

    private boolean matchesQuery(Employee employee, String query) {
        if (query == null) {
            return true;
        }

        return containsIgnoreCase(employee.getEmployeeId(), query)
                || containsIgnoreCase(employee.getFullName(), query)
                || containsIgnoreCase(employee.getEmail(), query)
                || containsIgnoreCase(employee.getDepartment(), query);
    }

    private boolean matchesLocation(Employee employee, String location) {
        if (location == null) {
            return true;
        }
        String office = employee.getOfficeLocation() == null ? "" : employee.getOfficeLocation().trim().toUpperCase(Locale.ROOT);
        return office.equals(location);
    }

    private boolean containsIgnoreCase(String raw, String needleUpper) {
        if (raw == null) {
            return false;
        }
        return raw.toUpperCase(Locale.ROOT).contains(needleUpper);
    }
}
