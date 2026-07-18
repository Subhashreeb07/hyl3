package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.RuleDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.NotificationAdminService;
import com.example.hy_backend.service.RuleService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RuleServiceImpl implements RuleService {

    private static final Logger log = LoggerFactory.getLogger(RuleServiceImpl.class);

    private final FacilityRepository facilityRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationAdminService notificationAdminService;
    private final ObjectMapper objectMapper;

    public RuleServiceImpl(
            FacilityRepository facilityRepository,
            FacilityRuleRepository facilityRuleRepository,
            EmployeeRepository employeeRepository,
            NotificationAdminService notificationAdminService,
            ObjectMapper objectMapper
    ) {
        this.facilityRepository = facilityRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.employeeRepository = employeeRepository;
        this.notificationAdminService = notificationAdminService;
        this.objectMapper = objectMapper;
    }

    @Override
    public RuleDtos.RuleResponse saveRules(Long facilityId, com.fasterxml.jackson.databind.JsonNode request) {
        Facility facility = getFacilityOrThrow(facilityId);
        var existingRule = facilityRuleRepository.findByFacilityFacilityId(facilityId);
        boolean isFirstRuleSave = existingRule.isEmpty();
        FacilityRule rule = existingRule.orElse(new FacilityRule());
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

        if (isFirstRuleSave && !Boolean.TRUE.equals(facility.getIsTemplate())) {
            sendCreateReminderEmails(facility, request);
        }

        return toResponse(saved);
    }

    private void sendCreateReminderEmails(Facility facility, JsonNode request) {
        String rolesCsv = optionalTextOrEmpty(request, "roles");
        String employeeTypesCsv = optionalTextOrEmpty(request, "employeeTypes");

        List<String> recipientIds = resolveRecipientEmployeeIds(rolesCsv, employeeTypesCsv);
        if (recipientIds.isEmpty()) {
            log.info("Facility {} created, but no employees matched selected role/work-mode filters.", facility.getFacilityId());
            return;
        }

        NotificationDtos.BroadcastNotificationRequest payload = new NotificationDtos.BroadcastNotificationRequest(
                "FACILITY_CREATED",
            List.of("IN_APP", "EMAIL"),
                "New facility created: " + facility.getFacilityName(),
                "A new facility has been created on HY Hub."
                        + " You will receive a follow-up once it is published for booking."
                        + " Facility: " + facility.getFacilityName() + ".",
                recipientIds,
                "ALL",
                "ALL",
                "ALL",
                true,
                false
        );

        try {
            NotificationDtos.BroadcastNotificationResponse result = notificationAdminService.sendBroadcast(payload);
            log.info("Facility creation notifications sent for facility {}. matched={}, sent={}",
                    facility.getFacilityId(),
                    result.matchedEmployees(),
                    result.notificationsCreated());
        } catch (Exception ex) {
            log.warn("Facility {} created but notification dispatch failed: {}", facility.getFacilityId(), ex.getMessage());
        }
    }

    private List<String> resolveRecipientEmployeeIds(String rolesCsv, String employeeTypesCsv) {
        Set<String> allowedRoleCodes = parseRoleCodes(rolesCsv);
        Set<String> allowedWorkModes = parseWorkModes(employeeTypesCsv);

        return employeeRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(employee -> allowedRoleCodes.isEmpty() || allowedRoleCodes.contains(normalizeRoleCode(employee.getRoleCode())))
                .filter(employee -> allowedWorkModes.isEmpty() || allowedWorkModes.contains(normalizeWorkMode(employee.getWorkMode())))
                .map(Employee::getEmployeeId)
                .filter(id -> id != null && !id.isBlank())
                .distinct()
                .toList();
    }

    private Set<String> parseRoleCodes(String rolesCsv) {
        if (rolesCsv == null || rolesCsv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(rolesCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::normalizeRoleCode)
                .collect(Collectors.toSet());
    }

    private Set<String> parseWorkModes(String employeeTypesCsv) {
        if (employeeTypesCsv == null || employeeTypesCsv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(employeeTypesCsv.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .map(this::normalizeWorkMode)
                .collect(Collectors.toSet());
    }

    private String normalizeRoleCode(String roleCode) {
        if (roleCode == null) {
            return "";
        }
        return switch (roleCode.trim().toUpperCase(Locale.ROOT)) {
            case "MANAGER" -> "MANAGER";
            case "FINANCE" -> "FINANCE";
            case "CLOUD" -> "CLOUD";
            case "DIRECTOR" -> "DIRECTOR";
            case "OPS" -> "OPS";
            case "DEVOPS" -> "DEVOPS";
            case "HR" -> "HR";
            case "RD" -> "RD";
            case "IS" -> "IS";
            case "NOC" -> "NOC";
            default -> roleCode.trim().toUpperCase(Locale.ROOT);
        };
    }

    private String normalizeWorkMode(String workMode) {
        if (workMode == null) {
            return "HYBRID";
        }
        return switch (workMode.trim().toUpperCase(Locale.ROOT)) {
            case "ON-SITE", "ON_SITE", "ONSITE" -> "ON_SITE";
            case "REMOTE" -> "REMOTE";
            default -> "HYBRID";
        };
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

        LocalDate today = LocalDate.now();
        if (facilityAvailableFromDate != null && facilityAvailableFromDate.isBefore(today)) {
            throw new BadRequestException("facilityAvailableFromDate cannot be in the past");
        }
        if (facilityAvailableToDate != null && facilityAvailableToDate.isBefore(today)) {
            throw new BadRequestException("facilityAvailableToDate cannot be in the past");
        }

        if (bookingStartTime != null && bookingDeadline != null && bookingStartTime.isAfter(bookingDeadline)) {
            throw new BadRequestException("booking Start Time must be before or equal to booking Deadline");
        }

        rule.setBookingDeadline(bookingDeadline);
        rule.setBookingStartTime(bookingStartTime);
        rule.setFacilityAvailableFromDate(facilityAvailableFromDate);
        rule.setFacilityAvailableToDate(facilityAvailableToDate);
        rule.setRulesJson(buildRulesJson(request, bookingStartTime, bookingDeadline, facilityAvailableFromDate, facilityAvailableToDate));
    }

    private String buildRulesJson(
            JsonNode request,
            LocalTime bookingStartTime,
            LocalTime bookingDeadline,
            LocalDate facilityAvailableFromDate,
            LocalDate facilityAvailableToDate
    ) {
        ObjectNode result = objectMapper.createObjectNode();
        putNullableText(result, "bookingDeadline", bookingDeadline == null ? null : bookingDeadline.toString());
        putNullableText(result, "bookingStartTime", bookingStartTime == null ? null : bookingStartTime.toString());
        putNullableText(result, "availableDays", optionalTrimmedText(request, "availableDays"));
        putNullableText(result, "facilityAvailableFromDate", facilityAvailableFromDate == null ? null : facilityAvailableFromDate.toString());
        putNullableText(result, "facilityAvailableToDate", facilityAvailableToDate == null ? null : facilityAvailableToDate.toString());
        putNullableText(result, "reminderTime", optionalTrimmedText(request, "reminderTime"));
        putNullableText(result, "cancellationDeadline", optionalTrimmedText(request, "cancellationDeadline"));
        putNullableNumber(result, "bookingWindowDays", optionalInteger(request, "bookingWindowDays"));
        putNullableNumber(result, "maximumCapacity", optionalInteger(request, "maximumCapacity"));
        putNullableBoolean(result, "qrRequired", optionalBoolean(request, "qrRequired"));
        putNullableBoolean(result, "allowCancellation", optionalBoolean(request, "allowCancellation"));
        putNullableBoolean(result, "regularCommuteEnabled", optionalBoolean(request, "regularCommuteEnabled"));
        putNullableText(result, "employeeTypes", optionalTextOrEmpty(request, "employeeTypes"));
        putNullableText(result, "roles", optionalTextOrEmpty(request, "roles"));
        return result.toString();
    }

    private String optionalTrimmedText(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        String value = node.get(fieldName).asText("").trim();
        return value.isBlank() ? null : value;
    }

    private String optionalTextOrEmpty(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return "";
        }
        return node.get(fieldName).asText("").trim();
    }

    private void putNullableText(ObjectNode node, String key, String value) {
        if (value == null) {
            node.putNull(key);
            return;
        }
        node.put(key, value);
    }

    private Integer optionalInteger(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        JsonNode valueNode = node.get(fieldName);
        if (valueNode.isInt() || valueNode.isLong()) {
            return valueNode.asInt();
        }
        String value = valueNode.asText("").trim();
        if (value.isBlank()) {
            return null;
        }
        try {
            return Integer.parseInt(value);
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid integer format for " + fieldName);
        }
    }

    private Boolean optionalBoolean(JsonNode node, String fieldName) {
        if (node == null || !node.has(fieldName) || node.get(fieldName).isNull()) {
            return null;
        }
        return node.get(fieldName).asBoolean();
    }

    private void putNullableNumber(ObjectNode node, String key, Integer value) {
        if (value == null) {
            node.putNull(key);
            return;
        }
        node.put(key, value);
    }

    private void putNullableBoolean(ObjectNode node, String key, Boolean value) {
        if (value == null) {
            node.putNull(key);
            return;
        }
        node.put(key, value);
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
