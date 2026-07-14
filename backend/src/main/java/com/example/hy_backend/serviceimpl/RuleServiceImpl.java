package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.RuleDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.RuleService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class RuleServiceImpl implements RuleService {

    private final FacilityRepository facilityRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final ObjectMapper objectMapper;

    public RuleServiceImpl(FacilityRepository facilityRepository, FacilityRuleRepository facilityRuleRepository, ObjectMapper objectMapper) {
        this.facilityRepository = facilityRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public RuleDtos.RuleResponse saveRules(Long facilityId, com.fasterxml.jackson.databind.JsonNode request) {
        Facility facility = getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(new FacilityRule());
        rule.setFacility(facility);
        applyRuleRequest(rule, request);
        FacilityRule saved;
        try {
            saved = facilityRuleRepository.saveAndFlush(rule);
        } catch (DataIntegrityViolationException ex) {
            FacilityRule existing = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                    .orElseThrow(() -> ex);
            existing.setFacility(facility);
            applyRuleRequest(existing, request);
            saved = facilityRuleRepository.save(existing);
        }
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
    public JsonNode getFullRules(Long facilityId) {
        getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                .orElse(null);

        ObjectNode result = objectMapper.createObjectNode();

        // Merge stored rules_json first (contains all extra fields)
        if (rule != null && rule.getRulesJson() != null && !rule.getRulesJson().isBlank()) {
            try {
                JsonNode stored = objectMapper.readTree(rule.getRulesJson());
                if (stored.isObject()) {
                    result.setAll((ObjectNode) stored);
                }
            } catch (Exception ignored) {}
        }

        // Overwrite with authoritative typed columns
        if (rule != null) {
            if (rule.getBookingStartTime() != null) {
                result.put("bookingStartTime", rule.getBookingStartTime().toString());
            } else {
                result.putNull("bookingStartTime");
            }
            if (rule.getBookingDeadline() != null) {
                result.put("bookingDeadline", rule.getBookingDeadline().toString());
            } else {
                result.putNull("bookingDeadline");
            }
            if (rule.getFacilityAvailableFromDate() != null) {
                result.put("facilityAvailableFromDate", rule.getFacilityAvailableFromDate().toString());
            } else {
                result.putNull("facilityAvailableFromDate");
            }
            if (rule.getFacilityAvailableToDate() != null) {
                result.put("facilityAvailableToDate", rule.getFacilityAvailableToDate().toString());
            } else {
                result.putNull("facilityAvailableToDate");
            }
        }

        return result;
    }

    public void deleteRules(Long facilityId) {
        getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("No rules found for facility with id " + facilityId));
        facilityRuleRepository.delete(rule);
    }

    @Override
    public RuleDtos.RuleResponse updateRules(Long facilityId, com.fasterxml.jackson.databind.JsonNode request) {
        Facility facility = getFacilityOrThrow(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Rules not found for facility id: " + facilityId));
        rule.setFacility(facility);
        applyRuleRequest(rule, request);
        FacilityRule saved = facilityRuleRepository.save(rule);
        return toResponse(saved);
    }

    private Facility getFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));
    }

    private void applyRuleRequest(FacilityRule rule, com.fasterxml.jackson.databind.JsonNode request) {
        String bookingDeadlineStr = request.hasNonNull("bookingDeadline") ? request.get("bookingDeadline").asText(null) : null;
        String bookingStartTimeStr = request.hasNonNull("bookingStartTime") ? request.get("bookingStartTime").asText(null) : null;
        String availableFromDateStr = request.hasNonNull("facilityAvailableFromDate") ? request.get("facilityAvailableFromDate").asText(null) : null;
        String availableToDateStr = request.hasNonNull("facilityAvailableToDate") ? request.get("facilityAvailableToDate").asText(null) : null;
        
        LocalTime bookingDeadline = parseTime(bookingDeadlineStr, "bookingDeadline");
        LocalTime bookingStartTime = parseTime(bookingStartTimeStr, "bookingStartTime");
        LocalDate facilityAvailableFromDate = parseDate(availableFromDateStr, "facilityAvailableFromDate");
        LocalDate facilityAvailableToDate = parseDate(availableToDateStr, "facilityAvailableToDate");

        if (facilityAvailableFromDate != null && facilityAvailableToDate == null) {
            facilityAvailableToDate = facilityAvailableFromDate;
        }
        if (facilityAvailableToDate != null && facilityAvailableFromDate == null) {
            facilityAvailableFromDate = facilityAvailableToDate;
        }

        if (facilityAvailableFromDate != null && facilityAvailableToDate != null
                && facilityAvailableFromDate.isAfter(facilityAvailableToDate)) {
            throw new BadRequestException("facilityAvailableFromDate must be before or equal to facilityAvailableToDate");
        }

        if (bookingStartTime != null && bookingDeadline != null && bookingStartTime.isAfter(bookingDeadline)) {
            throw new BadRequestException("booking Start Time must be before or equal to booking Deadline");
        }

        rule.setBookingDeadline(bookingDeadline);
        rule.setBookingStartTime(bookingStartTime);
        rule.setFacilityAvailableFromDate(facilityAvailableFromDate);
        rule.setFacilityAvailableToDate(facilityAvailableToDate);
        rule.setRulesJson(request.toString());
    }

    private RuleDtos.RuleResponse toResponse(FacilityRule rule) {
        return new RuleDtos.RuleResponse(
                rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString(),
                rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString()
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
