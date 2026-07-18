package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.dto.FacilityDtos;
import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FieldType;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FieldDefinitionRepository;
import com.example.hy_backend.service.FacilityService;
import com.example.hy_backend.service.NotificationAdminService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.format.DateTimeFormatter;
import java.time.LocalTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class FacilityServiceImpl implements FacilityService {

    private static final Logger log = LoggerFactory.getLogger(FacilityServiceImpl.class);

    private static final Set<String> ALLOWED_LOCATIONS = Set.of("HYDERABAD", "KOLKATA");
    private static final List<String> DEFAULT_PUBLISH_LOCATIONS = List.of("HYDERABAD", "KOLKATA");

    private final FacilityRepository facilityRepository;
    private final EmployeeRepository employeeRepository;
    private final BookingRepository bookingRepository;
    private final FieldDefinitionRepository fieldDefinitionRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final NotificationAdminService notificationAdminService;
    private final ObjectMapper objectMapper;

    public FacilityServiceImpl(
            FacilityRepository facilityRepository,
            EmployeeRepository employeeRepository,
            BookingRepository bookingRepository,
            FieldDefinitionRepository fieldDefinitionRepository,
            FacilityRuleRepository facilityRuleRepository,
            NotificationAdminService notificationAdminService,
            ObjectMapper objectMapper
    ) {
        this.facilityRepository = facilityRepository;
        this.employeeRepository = employeeRepository;
        this.bookingRepository = bookingRepository;
        this.fieldDefinitionRepository = fieldDefinitionRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.notificationAdminService = notificationAdminService;
        this.objectMapper = objectMapper;
    }

    @Override
    public FacilityDtos.FacilityCreateResponse createFacility(FacilityDtos.FacilityCreateRequest request) {
        String name = normalizeFacilityName(request.facilityName());
        if (hasConflictingFacilityName(name, null)) {
            throw new BadRequestException("A facility named '" + name + "' already exists. Please choose a different name.");
        }
        Facility facility = new Facility();
        facility.setFacilityName(name);
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        facility.setIcon(request.icon());
        facility.setPublished(false);
        facility.setIsTemplate(request.isTemplate() != null && request.isTemplate());
        facility.setIsPublic(request.isPublic() == null || request.isPublic());

        Facility saved = facilityRepository.save(facility);
        return new FacilityDtos.FacilityCreateResponse(saved.getFacilityId(), "Facility created successfully");
    }

    @Override
    public List<FacilityDtos.FacilitySummaryResponse> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(f -> new FacilityDtos.FacilitySummaryResponse(
                        f.getFacilityId(),
                        f.getFacilityName(),
                        f.getIsTemplate(),
                        f.getIsPublic()
                ))
                .toList();
    }

    @Override
    public FacilityDtos.FacilityDetailResponse getFacility(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        return toDetailResponse(facility);
    }

    @Override
    public FacilityDtos.FacilityDetailResponse updateFacility(Long facilityId, FacilityDtos.FacilityUpdateRequest request) {
        Facility facility = getFacilityOrThrow(facilityId);
        String name = normalizeFacilityName(request.facilityName());
        if (hasConflictingFacilityName(name, facilityId)) {
            throw new BadRequestException("A facility named '" + name + "' already exists. Please choose a different name.");
        }
        facility.setFacilityName(name);
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        if (request.isPublic() != null) {
            facility.setIsPublic(request.isPublic());
        }
        // isTemplate can only be set at creation; not updatable via normal update endpoint
        Facility saved = facilityRepository.save(facility);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFacility(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        facilityRepository.delete(facility);
    }

    @Override
    @Transactional
    public FacilityDtos.PublishResponse publishFacility(Long facilityId, FacilityDtos.PublishRequest request) {
        Facility facility = getFacilityOrThrow(facilityId);
        if (Boolean.TRUE.equals(facility.getIsTemplate())) {
            throw new BadRequestException("Template facilities cannot be published directly. Use 'Create from Template' to make a new facility.");
        }
        validatePublishReadiness(facilityId);
        List<String> normalizedLocations = normalizeTargetLocations(request == null ? null : request.targetLocations());
        String locationsStr = normalizedLocations.isEmpty() ? null : String.join(",", normalizedLocations);
        facility.setTargetLocations(locationsStr);

        // Store selected employee IDs (comma-separated); null = no restriction
        List<String> empIds = (request != null && request.targetEmployeeIds() != null)
                ? request.targetEmployeeIds().stream()
                        .map(String::trim).filter(s -> !s.isEmpty()).toList()
                : Collections.emptyList();
        facility.setTargetEmployeeIds(empIds.isEmpty() ? null : String.join(",", empIds));

        facility.setPublished(true);
        facilityRepository.save(facility);
        sendPublishReminderEmails(facility, normalizedLocations);
        return new FacilityDtos.PublishResponse(facility.getFacilityId(), "Facility published successfully");
    }

        @Override
        public FacilityDtos.FacilityRegistrationStatsResponse getRegistrationStats(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        if (!Boolean.TRUE.equals(facility.getPublished())) {
            throw new BadRequestException("Registration stats are available only for published facilities.");
        }

        Set<String> eligibleEmployeeIds = resolveEligibleEmployeeIds(facility);
        Set<String> registeredEmployeeIds = new HashSet<>(
            bookingRepository.findDistinctEmployeeIdsByFacilityAndStatus(facilityId, BookingStatus.CONFIRMED)
        );
        registeredEmployeeIds.retainAll(eligibleEmployeeIds);

        int eligibleCount = eligibleEmployeeIds.size();
        int registeredCount = registeredEmployeeIds.size();
        int notRegisteredCount = Math.max(eligibleCount - registeredCount, 0);

        return new FacilityDtos.FacilityRegistrationStatsResponse(
            facilityId,
            eligibleCount,
            registeredCount,
            notRegisteredCount
        );
        }

        @Override
        public FacilityDtos.FacilityReminderResponse sendReminderToUnregistered(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        if (!Boolean.TRUE.equals(facility.getPublished())) {
            throw new BadRequestException("Reminder can be sent only for published facilities.");
        }

        Set<String> eligibleEmployeeIds = resolveEligibleEmployeeIds(facility);
        Set<String> registeredEmployeeIds = new HashSet<>(
            bookingRepository.findDistinctEmployeeIdsByFacilityAndStatus(facilityId, BookingStatus.CONFIRMED)
        );
        registeredEmployeeIds.retainAll(eligibleEmployeeIds);

        List<String> notRegisteredIds = eligibleEmployeeIds.stream()
            .filter(employeeId -> !registeredEmployeeIds.contains(employeeId))
            .toList();

        if (notRegisteredIds.isEmpty()) {
            return new FacilityDtos.FacilityReminderResponse(
                facilityId,
                0,
                0,
                registeredEmployeeIds.size(),
                0,
                "All eligible employees are already registered for this facility."
            );
        }

        String subject = "Reminder: Register for " + facility.getFacilityName();
        String message = "You have not yet registered for " + facility.getFacilityName()
            + ". Please log in to HY Hub and complete your registration.";

        NotificationDtos.BroadcastNotificationRequest payload = new NotificationDtos.BroadcastNotificationRequest(
            "FACILITY_PUBLISHED",
            List.of("IN_APP", "EMAIL"),
            subject,
            message,
            notRegisteredIds,
            "ALL",
            "ALL",
            "ALL",
            true,
            false
        );

        NotificationDtos.BroadcastNotificationResponse result = notificationAdminService.sendBroadcast(payload);
        return new FacilityDtos.FacilityReminderResponse(
            facilityId,
            result.matchedEmployees(),
            result.notificationsCreated(),
            registeredEmployeeIds.size(),
            notRegisteredIds.size(),
            result.message()
        );
        }

    private void sendPublishReminderEmails(Facility facility, List<String> targetLocations) {
        List<String> targetEmployeeIds = new ArrayList<>(resolveEligibleEmployeeIds(facility));
        if (targetEmployeeIds.isEmpty()) {
            log.info("Facility {} published, but no employees matched the selected publish audience.", facility.getFacilityId());
            return;
        }
        String subject = "Facility published: " + facility.getFacilityName();
        String message = "A new facility has been published and is ready for booking."
                + " Please log in and complete your registration preferences for "
                + facility.getFacilityName()
                + ".";

        NotificationDtos.BroadcastNotificationRequest payload = new NotificationDtos.BroadcastNotificationRequest(
                "FACILITY_PUBLISHED",
                List.of("IN_APP", "EMAIL"),
                subject,
                message,
                targetEmployeeIds,
                "ALL",
                "ALL",
                "ALL",
                true,
                false
        );

        try {
            NotificationDtos.BroadcastNotificationResponse result = notificationAdminService.sendBroadcast(payload);
            log.info("Facility publish notifications sent for facility {}. matched={}, sent={}",
                    facility.getFacilityId(),
                    result.matchedEmployees(),
                    result.notificationsCreated());
        } catch (Exception ex) {
            // Keep publish operation successful even if email transport has a transient failure.
            log.warn("Facility {} published but notification dispatch failed: {}", facility.getFacilityId(), ex.getMessage());
        }
    }

    private void sendCreateReminderEmails(Facility facility) {
        String locationFilter = String.join(",", DEFAULT_PUBLISH_LOCATIONS);
        String subject = "New facility created: " + facility.getFacilityName();
        String message = "A new facility has been created on HY Hub."
                + " You will receive a follow-up once it is published for booking."
                + " Facility: " + facility.getFacilityName() + ".";

        NotificationDtos.BroadcastNotificationRequest payload = new NotificationDtos.BroadcastNotificationRequest(
                "FACILITY_CREATED",
            List.of("IN_APP", "EMAIL"),
                subject,
                message,
                null,
                locationFilter,
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

    @Override
    @Transactional
    public FacilityDtos.CreateFromTemplateResponse createFromTemplate(Long templateFacilityId, String newFacilityName) {
        Facility template = getFacilityOrThrow(templateFacilityId);
        if (!Boolean.TRUE.equals(template.getIsTemplate())) {
            throw new BadRequestException("The selected facility is not a template.");
        }

        String baseName = (newFacilityName != null && !newFacilityName.isBlank())
            ? normalizeFacilityName(newFacilityName)
                : template.getFacilityName() + "_COPY";

        // Ensure unique name — collect all existing names first, then loop without lambda
        Set<String> existingNames = facilityRepository.findAll().stream()
            .map(f -> normalizeFacilityName(f.getFacilityName()).toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        String uniqueName = baseName;
        int suffix = 1;
        while (existingNames.contains(normalizeFacilityName(uniqueName).toLowerCase(Locale.ROOT))) {
            uniqueName = baseName + "_" + suffix++;
        }

        Facility copy = new Facility();
        copy.setFacilityName(uniqueName);
        copy.setDescription(template.getDescription());
        copy.setCategory(template.getCategory());
        copy.setIcon(template.getIcon());
        copy.setPublished(false);
        copy.setIsTemplate(false);
        copy.setIsPublic(template.getIsPublic());
        Facility savedCopy = facilityRepository.save(copy);

        // Deep-copy fields (including their options)
        List<FieldDefinition> sourceFields =
                fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(templateFacilityId);
        for (FieldDefinition src : sourceFields) {
            FieldDefinition fd = new FieldDefinition();
            fd.setFacility(savedCopy);
            fd.setLabel(src.getLabel());
            fd.setFieldType(src.getFieldType());
            fd.setRequired(src.getRequired());
            fd.setPlaceholder(src.getPlaceholder());
            fd.setDefaultValue(src.getDefaultValue());
            fd.setValidationJson(src.getValidationJson());
            fd.setDisplayOrder(src.getDisplayOrder());
            fd.setFieldOptions(src.getFieldOptions());
            fieldDefinitionRepository.save(fd);
        }

        // Deep-copy rule
        FacilityRule srcRule = facilityRuleRepository
                .findByFacilityFacilityId(templateFacilityId).orElse(null);
        if (srcRule != null) {
            FacilityRule rule = new FacilityRule();
            rule.setFacility(savedCopy);
            rule.setBookingDeadline(srcRule.getBookingDeadline());
            rule.setBookingStartTime(srcRule.getBookingStartTime());
            rule.setFacilityAvailableFromDate(srcRule.getFacilityAvailableFromDate());
            rule.setFacilityAvailableToDate(srcRule.getFacilityAvailableToDate());
            rule.setRulesJson(srcRule.getRulesJson());

            facilityRuleRepository.save(rule);
        }

        return new FacilityDtos.CreateFromTemplateResponse(
                savedCopy.getFacilityId(), savedCopy.getFacilityName(),
                "Facility created from template. You can now edit and publish it.");
    }

    @Override
    @Transactional
    public FacilityDtos.FacilityDetailResponse updateTemplateVisibility(Long facilityId,
            FacilityDtos.TemplateVisibilityRequest request) {
        Facility facility = getFacilityOrThrow(facilityId);
        if (!Boolean.TRUE.equals(facility.getIsTemplate())) {
            throw new BadRequestException("Only template facilities have a public/private visibility setting.");
        }
        facility.setIsPublic(request.isPublic());
        return toDetailResponse(facilityRepository.save(facility));
    }

    @Override
    @Transactional
    public FacilityDtos.FacilityDetailResponse saveAsTemplate(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        if (Boolean.TRUE.equals(facility.getIsTemplate())) {
            return toDetailResponse(facility); // already a template, no-op
        }
        facility.setIsTemplate(true);
        facility.setPublished(false); // templates are not published
        return toDetailResponse(facilityRepository.save(facility));
    }

    @Override
    @Transactional
    public EmployeeDtos.FacilitySpecificationResponse getFacilitySpecification(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(null);

        List<EmployeeDtos.SpecificationField> specificationFields = fields.stream()
                .map(field -> new EmployeeDtos.SpecificationField(
                        field.getFieldId(),
                        field.getLabel(),
                        field.getFieldType().name(),
                        field.getRequired(),
                        field.getPlaceholder(),
                        field.getValidationJson(),
                        field.getDefaultValue(),
                        parseFieldOptions(field.getFieldOptions())
                ))
                .toList();

        EmployeeDtos.SpecificationRule specificationRule = rule == null
                ? new EmployeeDtos.SpecificationRule(null, null, null, false, true, null, false, null, null, null, null)
                : new EmployeeDtos.SpecificationRule(
                        rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString(),
                        rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString(),
                        null, false, true, null, false, null, null, null, null
                );

        return new EmployeeDtos.FacilitySpecificationResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                specificationFields,
                specificationRule
        );
    }

    @Override
    @Transactional
    public FacilityDtos.FacilityDetailResponse importFacilityFromJson(java.util.Map<String, Object> jsonData) {
        try {
            // Extract facility information
            String facilityName = normalizeFacilityName((String) jsonData.getOrDefault("facilityName", "Imported Facility"));
            String description = (String) jsonData.getOrDefault("description", "");
            String category = (String) jsonData.getOrDefault("category", "General");
            String icon = (String) jsonData.getOrDefault("icon", "business");
            Boolean status = (Boolean) jsonData.getOrDefault("status", true);

            if (hasConflictingFacilityName(facilityName, null)) {
                throw new BadRequestException("A facility named '" + facilityName + "' already exists. Please choose a different name.");
            }

            // Create Facility
            Facility facility = new Facility();
            facility.setFacilityName(facilityName);
            facility.setDescription(description);
            facility.setCategory(category);
            facility.setIcon(icon);
            facility.setPublished(false);
            Facility savedFacility = facilityRepository.save(facility);

            // Extract and create fields
            @SuppressWarnings("unchecked")
            List<java.util.Map<String, Object>> fieldsList = (List<java.util.Map<String, Object>>) jsonData.get("fields");
            if (fieldsList != null) {
                int order = 1;
                for (java.util.Map<String, Object> fieldData : fieldsList) {
                    String fieldLabel = (String) fieldData.get("label");
                    String fieldTypeStr = (String) fieldData.get("fieldType");
                    Boolean required = (Boolean) fieldData.getOrDefault("required", false);
                    String placeholder = (String) fieldData.getOrDefault("placeholder", "");

                    try {
                        FieldType fieldType = FieldType.valueOf(fieldTypeStr.toUpperCase(java.util.Locale.ROOT));

                        FieldDefinition field = new FieldDefinition();
                        field.setFacility(savedFacility);
                        field.setLabel(fieldLabel);
                        field.setFieldType(fieldType);
                        field.setRequired(required);
                        field.setPlaceholder(placeholder);
                        field.setDisplayOrder(order++);

                        List<String> options = (List<String>) fieldData.get("options");
                        if (options != null && requiresOptions(fieldType)) {
                            field.setFieldOptions(String.join("\n", options));
                        }
                        
                        fieldDefinitionRepository.save(field);
                    } catch (IllegalArgumentException e) {
                        throw new BadRequestException("Invalid field type: " + fieldTypeStr);
                    }
                }
            }

            // Extract and create rules
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> rulesData = (java.util.Map<String, Object>) jsonData.get("rules");
            if (rulesData != null) {
                FacilityRule rule = new FacilityRule();
                rule.setFacility(savedFacility);
                
                if (rulesData.containsKey("bookingDeadline")) {
                    try {
                        if (rulesData.get("bookingDeadline") != null) {
                            rule.setBookingDeadline(LocalTime.parse((String) rulesData.get("bookingDeadline")));
                        }
                    } catch (Exception e) {
                        // Skip invalid time format
                    }
                }

                
                facilityRuleRepository.save(rule);
            }

            return toDetailResponse(savedFacility);
        } catch (ClassCastException e) {
            throw new BadRequestException("Invalid JSON format: " + e.getMessage());
        }
    }

    private Facility getFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));
    }

    private FacilityDtos.FacilityDetailResponse toDetailResponse(Facility facility) {
        return new FacilityDtos.FacilityDetailResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                facility.getDescription(),
                facility.getCategory(),
                facility.getIcon(),
                facility.getPublished(),
                facility.getIsTemplate(),
                facility.getIsPublic(),
                splitTargetLocations(facility.getTargetLocations())
        );
    }

    /** Parses field options stored as JSON array ["Veg","Non-Veg"] or legacy newline-separated text. */
    private List<String> parseFieldOptions(String raw) {
        if (raw == null || raw.isBlank()) return Collections.emptyList();
        String trimmed = raw.trim();
        if (trimmed.startsWith("[")) {
            try {
                JsonNode node = objectMapper.readTree(trimmed);
                if (node.isArray()) {
                    List<String> result = new ArrayList<>();
                    for (JsonNode item : node) {
                        String v = item.asText().trim();
                        if (!v.isEmpty()) result.add(v);
                    }
                    return result;
                }
            } catch (Exception ignored) { /* fall through to newline split */ }
        }
        return Arrays.stream(trimmed.split("\\n"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private List<String> normalizeTargetLocations(List<String> locations) {
        if (locations == null || locations.isEmpty()) {
            return DEFAULT_PUBLISH_LOCATIONS;
        }

        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        for (String location : locations) {
            if (location == null || location.isBlank()) {
                continue;
            }

            String canonical = location.trim().toUpperCase(Locale.ROOT);
            if (!ALLOWED_LOCATIONS.contains(canonical)) {
                throw new BadRequestException("Invalid location: " + location + ". Allowed values: HYDERABAD, KOLKATA");
            }
            normalized.add(canonical);
        }

        if (normalized.isEmpty()) {
            throw new BadRequestException("At least one target location is required to publish");
        }

        return new ArrayList<>(normalized);
    }

    private List<String> splitTargetLocations(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }

        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    private Set<String> resolveEligibleEmployeeIds(Facility facility) {
        List<String> targetLocations = splitTargetLocations(facility.getTargetLocations());
        String locationFilter = targetLocations.isEmpty()
                ? String.join(",", DEFAULT_PUBLISH_LOCATIONS)
                : String.join(",", targetLocations);

        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facility.getFacilityId()).orElse(null);
        String rolesCsv = extractRuleCsv(rule, "roles");
        String employeeTypesCsv = extractRuleCsv(rule, "employeeTypes");

        Set<String> allowedRoleCodes = parseRoleCodes(rolesCsv);
        Set<String> allowedWorkModes = parseWorkModes(employeeTypesCsv);

        Set<String> explicitIds = facility.getTargetEmployeeIds() == null || facility.getTargetEmployeeIds().isBlank()
                ? Set.of()
                : Arrays.stream(facility.getTargetEmployeeIds().split(","))
                        .map(String::trim)
                        .filter(value -> !value.isEmpty())
                        .collect(Collectors.toSet());

        return employeeRepository.findAllByOrderByCreatedAtDesc().stream()
            .filter(employee -> explicitIds.isEmpty() || explicitIds.contains(employee.getEmployeeId()))
            .filter(employee -> matchesAnyToken(employee.getOfficeLocation(), locationFilter))
            .filter(employee -> allowedRoleCodes.isEmpty() || allowedRoleCodes.contains(normalizeRoleCode(employee.getRoleCode())))
            .filter(employee -> allowedWorkModes.isEmpty() || allowedWorkModes.contains(normalizeWorkMode(employee.getWorkMode())))
            .map(Employee::getEmployeeId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private String extractRuleCsv(FacilityRule rule, String fieldName) {
        if (rule == null || rule.getRulesJson() == null || rule.getRulesJson().isBlank()) {
            return "";
        }
        try {
            JsonNode node = objectMapper.readTree(rule.getRulesJson());
            JsonNode field = node.get(fieldName);
            if (field == null || field.isNull()) {
                return "";
            }
            if (field.isTextual()) {
                return field.asText("").trim();
            }
            if (field.isArray()) {
                List<String> values = new ArrayList<>();
                field.forEach(item -> {
                    if (item != null && item.isTextual()) {
                        String value = item.asText("").trim();
                        if (!value.isBlank()) {
                            values.add(value);
                        }
                    }
                });
                return String.join(",", values);
            }
            return "";
        } catch (Exception ex) {
            return "";
        }
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

    private boolean matchesAnyToken(String candidateValue, String filterValue) {
        if (filterValue == null || "ALL".equalsIgnoreCase(filterValue)) {
            return true;
        }
        if (candidateValue == null || candidateValue.isBlank()) {
            return false;
        }

        String normalizedCandidate = candidateValue.trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(filterValue.split(","))
                .map(String::trim)
                .filter(token -> !token.isBlank())
                .map(token -> token.toUpperCase(Locale.ROOT))
                .anyMatch(normalizedCandidate::equals);
    }

    private void validatePublishReadiness(Long facilityId) {
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facilityId);
        if (fields.isEmpty()) {
            throw new BadRequestException("Cannot publish facility without dynamic fields");
        }

        for (FieldDefinition field : fields) {
            if (field.getLabel() == null || field.getLabel().isBlank()) {
                throw new BadRequestException("Cannot publish facility with empty field label");
            }

            if (requiresOptions(field.getFieldType()) && (field.getFieldOptions() == null || field.getFieldOptions().isBlank())) {
                throw new BadRequestException("Cannot publish facility. Options missing for field: " + field.getLabel());
            }
        }
    }

    private boolean requiresOptions(FieldType fieldType) {
        return fieldType == FieldType.DROPDOWN || fieldType == FieldType.RADIO_BUTTON || fieldType == FieldType.CHECKBOX;
    }

    private String normalizeFacilityName(String name) {
        if (name == null) {
            throw new BadRequestException("Facility name is required.");
        }
        String normalized = name.trim().replaceAll("\\s+", " ");
        if (normalized.isBlank()) {
            throw new BadRequestException("Facility name is required.");
        }
        return normalized;
    }

    private boolean hasConflictingFacilityName(String candidate, Long currentFacilityId) {
        String normalizedCandidate = normalizeFacilityName(candidate).toLowerCase(Locale.ROOT);
        return facilityRepository.findAll().stream()
                .filter(f -> currentFacilityId == null || !f.getFacilityId().equals(currentFacilityId))
                .map(Facility::getFacilityName)
                .map(this::normalizeFacilityName)
                .map(name -> name.toLowerCase(Locale.ROOT))
                .anyMatch(normalizedCandidate::equals);
    }

}

