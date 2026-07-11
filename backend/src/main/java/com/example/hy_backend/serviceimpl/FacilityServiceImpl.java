package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.dto.FacilityDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FieldOption;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldType;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FieldDefinitionRepository;
import com.example.hy_backend.repository.FieldOptionRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.FacilityService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Service
public class FacilityServiceImpl implements FacilityService {

    private static final Set<String> ALLOWED_LOCATIONS = Set.of("HYDERABAD", "KOLKATA");
    private static final List<String> DEFAULT_PUBLISH_LOCATIONS = List.of("HYDERABAD", "KOLKATA");

    private final FacilityRepository facilityRepository;
    private final FieldDefinitionRepository fieldDefinitionRepository;
    private final FieldOptionRepository fieldOptionRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public FacilityServiceImpl(
            FacilityRepository facilityRepository,
            FieldDefinitionRepository fieldDefinitionRepository,
            FieldOptionRepository fieldOptionRepository,
            FacilityRuleRepository facilityRuleRepository
    ) {
        this.facilityRepository = facilityRepository;
        this.fieldDefinitionRepository = fieldDefinitionRepository;
        this.fieldOptionRepository = fieldOptionRepository;
        this.facilityRuleRepository = facilityRuleRepository;
    }

    @Override
    public FacilityDtos.FacilityCreateResponse createFacility(FacilityDtos.FacilityCreateRequest request) {
        Facility facility = new Facility();
        facility.setFacilityName(request.facilityName().trim());
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        facility.setIcon(request.icon());
        facility.setStatus(request.status());
        facility.setPublished(false);

        Facility saved = facilityRepository.save(facility);
        return new FacilityDtos.FacilityCreateResponse(saved.getFacilityId(), "Facility created successfully");
    }

    @Override
    public List<FacilityDtos.FacilitySummaryResponse> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(f -> new FacilityDtos.FacilitySummaryResponse(
                        f.getFacilityId(),
                        f.getFacilityName(),
                        f.getStatus()
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
        facility.setFacilityName(request.facilityName().trim());
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        facility.setIcon(request.icon());
        facility.setStatus(request.status());
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
        validatePublishReadiness(facilityId);
        List<String> normalizedLocations = normalizeTargetLocations(request == null ? null : request.targetLocations());
        facility.setTargetLocations(String.join(",", normalizedLocations));
        facility.setStatus(true);
        facility.setPublished(true);
        facilityRepository.save(facility);
        return new FacilityDtos.PublishResponse(facility.getFacilityId(), "Facility published successfully");
    }

    @Override
    @Transactional
    public EmployeeDtos.FacilitySpecificationResponse getFacilitySpecification(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdWithOptions(facilityId);
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
                        field.getOptions().isEmpty()
                                ? Collections.emptyList()
                                : field.getOptions().stream().map(o -> o.getOptionValue()).toList()
                ))
                .toList();

        EmployeeDtos.SpecificationRule specificationRule = rule == null
                ? new EmployeeDtos.SpecificationRule(null, null, null, false, true, null, false)
                : new EmployeeDtos.SpecificationRule(
                        rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString(),
                        rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString(),
                        rule.getReminderTime() == null ? null : rule.getReminderTime().toString(),
                        rule.getQrRequired(),
                        rule.getAllowCancellation(),
                        rule.getMaximumCapacity(),
                        rule.getRegularCommuteEnabled()
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
            String facilityName = (String) jsonData.getOrDefault("facilityName", "Imported Facility");
            String description = (String) jsonData.getOrDefault("description", "");
            String category = (String) jsonData.getOrDefault("category", "General");
            String icon = (String) jsonData.getOrDefault("icon", "business");
            Boolean status = (Boolean) jsonData.getOrDefault("status", true);

            // Create Facility
            Facility facility = new Facility();
            facility.setFacilityName(facilityName.trim());
            facility.setDescription(description);
            facility.setCategory(category);
            facility.setIcon(icon);
            facility.setStatus(status);
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

                        FieldDefinition savedField = fieldDefinitionRepository.save(field);

                        // Create options if it's a dropdown/radio/checkbox field
                        @SuppressWarnings("unchecked")
                        List<String> options = (List<String>) fieldData.get("options");
                        if (options != null && requiresOptions(fieldType)) {
                            for (String optionValue : options) {
                                FieldOption option = new FieldOption();
                                option.setField(savedField);
                                option.setOptionValue(optionValue);
                                fieldOptionRepository.save(option);
                            }
                        }
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
                        rule.setBookingDeadline(LocalTime.parse((String) rulesData.get("bookingDeadline")));
                    } catch (Exception e) {
                        // Skip invalid time format
                    }
                }
                if (rulesData.containsKey("reminderTime")) {
                    try {
                        rule.setReminderTime(LocalTime.parse((String) rulesData.get("reminderTime")));
                    } catch (Exception e) {
                        // Skip invalid time format
                    }
                }
                if (rulesData.containsKey("bookingStartTime")) {
                    try {
                        rule.setBookingStartTime(LocalTime.parse((String) rulesData.get("bookingStartTime")));
                    } catch (Exception e) {
                        // Skip invalid time format
                    }
                }
                if (rulesData.containsKey("qrRequired")) {
                    rule.setQrRequired((Boolean) rulesData.getOrDefault("qrRequired", false));
                }
                if (rulesData.containsKey("allowCancellation")) {
                    rule.setAllowCancellation((Boolean) rulesData.getOrDefault("allowCancellation", true));
                }
                if (rulesData.containsKey("maximumCapacity")) {
                    Object capacityObj = rulesData.get("maximumCapacity");
                    if (capacityObj instanceof Number) {
                        rule.setMaximumCapacity(((Number) capacityObj).intValue());
                    }
                }
                if (rulesData.containsKey("regularCommuteEnabled")) {
                    rule.setRegularCommuteEnabled((Boolean) rulesData.getOrDefault("regularCommuteEnabled", false));
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
                facility.getStatus(),
                facility.getPublished(),
                splitTargetLocations(facility.getTargetLocations())
        );
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

    private void validatePublishReadiness(Long facilityId) {
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdWithOptions(facilityId);
        if (fields.isEmpty()) {
            throw new BadRequestException("Cannot publish facility without dynamic fields");
        }

        for (FieldDefinition field : fields) {
            if (field.getLabel() == null || field.getLabel().isBlank()) {
                throw new BadRequestException("Cannot publish facility with empty field label");
            }

            if (requiresOptions(field.getFieldType()) && field.getOptions().isEmpty()) {
                throw new BadRequestException("Cannot publish facility. Options missing for field: " + field.getLabel());
            }
        }
    }

    private boolean requiresOptions(FieldType fieldType) {
        return fieldType == FieldType.DROPDOWN || fieldType == FieldType.RADIO_BUTTON || fieldType == FieldType.CHECKBOX;
    }
}
