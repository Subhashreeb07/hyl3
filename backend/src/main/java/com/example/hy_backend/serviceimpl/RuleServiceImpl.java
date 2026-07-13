package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.RuleDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.RuleService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class RuleServiceImpl implements RuleService {

    private final FacilityRepository facilityRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public RuleServiceImpl(FacilityRepository facilityRepository, FacilityRuleRepository facilityRuleRepository) {
        this.facilityRepository = facilityRepository;
        this.facilityRuleRepository = facilityRuleRepository;
    }

    @Override
    public RuleDtos.RuleResponse saveRules(Long facilityId, RuleDtos.RuleRequest request) {
        Facility facility = getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(new FacilityRule());
        rule.setFacility(facility);
        applyRuleRequest(rule, request);
        FacilityRule saved = facilityRuleRepository.save(rule);
        return toResponse(saved);
    }

    @Override
    public RuleDtos.RuleResponse getRules(Long facilityId) {
        getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                .orElse(new FacilityRule());
        return toResponse(rule);
    }

    @Override
    public RuleDtos.RuleResponse updateRules(Long facilityId, RuleDtos.RuleRequest request) {
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Rules not found for facility id: " + facilityId));
        applyRuleRequest(rule, request);
        FacilityRule saved = facilityRuleRepository.save(rule);
        return toResponse(saved);
    }

    private Facility getFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));
    }

    private void applyRuleRequest(FacilityRule rule, RuleDtos.RuleRequest request) {
        LocalTime bookingDeadline = parseTime(request.bookingDeadline(), "bookingDeadline");
        LocalTime bookingStartTime = parseTime(request.bookingStartTime(), "bookingStartTime");
        LocalTime reminderTime = parseTime(request.reminderTime(), "reminderTime");
        LocalDate facilityAvailableFromDate = parseDate(request.facilityAvailableFromDate(), "facilityAvailableFromDate");
        LocalDate facilityAvailableToDate = parseDate(request.facilityAvailableToDate(), "facilityAvailableToDate");
        LocalTime cancellationDeadline = parseTime(request.cancellationDeadline(), "cancellationDeadline");

        if (bookingStartTime != null && bookingDeadline != null && bookingStartTime.isAfter(bookingDeadline)) {
            throw new BadRequestException("booking Start Time must be before or equal to booking Deadline");
        }

        if (reminderTime != null && bookingDeadline != null && reminderTime.isAfter(bookingDeadline)) {
            throw new BadRequestException("reminder Time cannot be after booking Deadline");
        }

        if (request.maximumCapacity() != null && request.maximumCapacity() <= 0) {
            throw new BadRequestException("maximum Capacity must be greater than zero");
        }

        if (request.bookingWindowDays() != null && request.bookingWindowDays() < 0) {
            throw new BadRequestException("bookingWindowDays must be greater than or equal to zero");
        }

        if (facilityAvailableFromDate != null && facilityAvailableToDate != null && facilityAvailableFromDate.isAfter(facilityAvailableToDate)) {
            throw new BadRequestException("facility Available From Date must be before or equal to facility Available To Date");
        }

        rule.setBookingDeadline(bookingDeadline);
        rule.setBookingStartTime(bookingStartTime);
        rule.setReminderTime(reminderTime);
        rule.setQrRequired(request.qrRequired() != null ? request.qrRequired() : false);
        rule.setAllowCancellation(request.allowCancellation() != null ? request.allowCancellation() : true);
        rule.setMaximumCapacity(request.maximumCapacity());
        rule.setRegularCommuteEnabled(request.regularCommuteEnabled() != null ? request.regularCommuteEnabled() : false);
        rule.setAvailableDays(request.availableDays());
        rule.setBookingWindowDays(request.bookingWindowDays());
        rule.setFacilityAvailableFromDate(facilityAvailableFromDate);
        rule.setFacilityAvailableToDate(facilityAvailableToDate);
        rule.setCancellationDeadline(cancellationDeadline);
        rule.setEmployeeTypes(request.employeeTypes());
        rule.setRoles(request.roles());
    }

    private RuleDtos.RuleResponse toResponse(FacilityRule rule) {
        return new RuleDtos.RuleResponse(
                rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString(),
                rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString(),
                rule.getReminderTime() == null ? null : rule.getReminderTime().toString(),
                rule.getQrRequired() != null ? rule.getQrRequired() : false,
                rule.getAllowCancellation() != null ? rule.getAllowCancellation() : true,
                rule.getMaximumCapacity(),
                rule.getRegularCommuteEnabled() != null ? rule.getRegularCommuteEnabled() : false,
                rule.getAvailableDays(),
                rule.getBookingWindowDays(),
                rule.getFacilityAvailableFromDate() == null ? null : rule.getFacilityAvailableFromDate().toString(),
                rule.getFacilityAvailableToDate() == null ? null : rule.getFacilityAvailableToDate().toString(),
                rule.getCancellationDeadline() == null ? null : rule.getCancellationDeadline().toString(),
                rule.getEmployeeTypes(),
                rule.getRoles()
        );
    }

    private LocalTime parseTime(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid time format for " + fieldName + ". Use HH:mm or HH:mm:ss");
        }
    }

    private LocalDate parseDate(String value, String fieldName) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid date format for " + fieldName + ". Use yyyy-MM-dd");
        }
    }
}
