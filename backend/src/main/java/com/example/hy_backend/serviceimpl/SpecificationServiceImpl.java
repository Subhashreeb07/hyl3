package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.SpecificationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.mapper.SpecificationMapper;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FieldType;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.repository.FieldDefinitionRepository;
import com.example.hy_backend.service.SpecificationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SpecificationServiceImpl implements SpecificationService {

    private final FacilityRepository facilityRepository;
    private final FieldDefinitionRepository fieldDefinitionRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final SpecificationMapper specificationMapper;
    private final ObjectMapper objectMapper;

    public SpecificationServiceImpl(
            FacilityRepository facilityRepository,
            FieldDefinitionRepository fieldDefinitionRepository,
            FacilityRuleRepository facilityRuleRepository,
            SpecificationMapper specificationMapper,
            ObjectMapper objectMapper
    ) {
        this.facilityRepository = facilityRepository;
        this.fieldDefinitionRepository = fieldDefinitionRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.specificationMapper = specificationMapper;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public SpecificationDtos.UploadResponse uploadSpecification(JsonNode specificationJson) {
        if (specificationJson == null || specificationJson.isNull()) {
            throw new BadRequestException("Specification JSON is required");
        }

        String facilityName = getRequiredText(specificationJson, "facilityName");
        Long incomingFacilityId = specificationJson.hasNonNull("facilityId") ? specificationJson.path("facilityId").asLong() : null;
        Facility facility;

        if (incomingFacilityId != null) {
            facility = facilityRepository.findById(incomingFacilityId).orElseGet(Facility::new);
            if (facilityRepository.existsByFacilityNameIgnoreCaseAndFacilityIdNot(facilityName, incomingFacilityId)) {
                throw new BadRequestException("Another facility already exists with name: " + facilityName);
            }
        } else {
            if (facilityRepository.existsByFacilityNameIgnoreCase(facilityName)) {
                throw new BadRequestException("Facility already exists: " + facilityName + ". Use the same facilityId in JSON to update it.");
            }
            facility = new Facility();
        }

        facility.setFacilityName(facilityName);
        facility.setDescription(getOptionalText(specificationJson, "description"));
        facility.setCategory(getOptionalText(specificationJson, "category"));
        facility.setIcon(getOptionalText(specificationJson, "icon"));

        facility.setPublished(getOptionalBoolean(specificationJson, "published", false));

        List<FieldDefinition> fields = parseFields(specificationJson.path("fields"), facility);
        facility.setFields(fields);

        if (specificationJson.hasNonNull("rules") && specificationJson.path("rules").isObject()) {
            FacilityRule rule = parseRule(specificationJson.path("rules"), facility);
            facility.setRule(rule);
        } else {
            facility.setRule(null);
        }

        Facility saved = facilityRepository.save(facility);
        return new SpecificationDtos.UploadResponse(
                saved.getFacilityId(),
                saved.getFacilityName(),
                saved.getPublished(),
                saved.getFields().size(),
                "Specification uploaded successfully"
        );
    }

    @Override
    public JsonNode getTemplateSpecification() {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("facilityName", "");
        root.put("description", "");
        root.put("category", "");
        root.put("icon", "");
        root.put("status", true);
        root.put("published", false);
        root.putArray("fields");
        root.putObject("rules");
        return root;
    }

    @Override
    @Transactional
    public JsonNode getGeneratedSpecification(Long facilityId) {
        Facility facility = facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));

        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(null);

        return specificationMapper.toJson(facility, fields, rule);
    }

    private List<FieldDefinition> parseFields(JsonNode fieldsNode, Facility facility) {
        if (!fieldsNode.isArray()) {
            throw new BadRequestException("'fields' must be an array");
        }

        List<FieldDefinition> fields = new ArrayList<>();
        Set<String> labels = new HashSet<>();
        Set<Integer> displayOrders = new HashSet<>();
        int fallbackDisplayOrder = 1;
        for (JsonNode fieldNode : fieldsNode) {
            String label = getRequiredText(fieldNode, "label");
            String fieldTypeRaw = getRequiredText(fieldNode, "fieldType");
            FieldType parsedType = parseFieldType(fieldTypeRaw);

            String normalizedLabel = label.trim().toLowerCase(Locale.ROOT);
            if (!labels.add(normalizedLabel)) {
                throw new BadRequestException("Duplicate field label in specification: " + label);
            }

            FieldDefinition field = new FieldDefinition();
            field.setFacility(facility);
            field.setLabel(label);
            field.setFieldType(parsedType);
            field.setPlaceholder(getOptionalText(fieldNode, "placeholder"));
            field.setRequired(getOptionalBoolean(fieldNode, "required", false));
            field.setValidationJson(getOptionalText(fieldNode, "validationJson"));
            field.setDefaultValue(getOptionalText(fieldNode, "defaultValue"));
            validateValidationJson(field.getValidationJson());
            validateDefaultValue(field.getFieldType(), field.getDefaultValue());

            int displayOrder = fallbackDisplayOrder;
            if (fieldNode.has("displayOrder") && fieldNode.path("displayOrder").isInt()) {
                displayOrder = fieldNode.path("displayOrder").asInt();
            }
            if (displayOrder <= 0) {
                throw new BadRequestException("displayOrder must be greater than zero for field: " + label);
            }
            if (!displayOrders.add(displayOrder)) {
                throw new BadRequestException("Duplicate displayOrder in specification: " + displayOrder);
            }
            field.setDisplayOrder(displayOrder);
            fallbackDisplayOrder++;

            String parsedOptions = parseFieldOptions(fieldNode.path("options"));
            if (requiresOptions(parsedType) && parsedOptions.isBlank()) {
                throw new BadRequestException("Options are required for field type " + parsedType + " and label " + label);
            }
            field.setFieldOptions(parsedOptions);
            fields.add(field);
        }
        if (fields.isEmpty()) {
            throw new BadRequestException("At least one field is required in specification");
        }
        return fields;
    }

    private String parseFieldOptions(JsonNode optionsNode) {
        if (!optionsNode.isArray()) {
            return "";
        }

        List<String> options = new ArrayList<>();
        for (JsonNode optionNode : optionsNode) {
            String optionValue;
            if (optionNode.isTextual()) {
                optionValue = optionNode.asText().trim();
            } else if (optionNode.isObject() && optionNode.hasNonNull("value")) {
                optionValue = optionNode.path("value").asText().trim();
            } else {
                continue;
            }

            if (optionValue.isBlank()) {
                continue;
            }

            options.add(optionValue);
        }
        return String.join("\n", options);
    }

    private FacilityRule parseRule(JsonNode rulesNode, Facility facility) {
        FacilityRule rule = new FacilityRule();
        rule.setFacility(facility);
        rule.setBookingDeadline(parseOptionalTime(rulesNode, "bookingDeadline"));
        rule.setBookingStartTime(parseOptionalTime(rulesNode, "bookingStartTime"));
        rule.setRulesJson(rulesNode.toString());

        return rule;
    }

    private LocalTime parseOptionalTime(JsonNode node, String key) {
        if (!node.hasNonNull(key)) {
            return null;
        }
        String value = node.path(key).asText().trim();
        if (value.isBlank()) {
            return null;
        }
        try {
            return LocalTime.parse(value);
        } catch (DateTimeParseException ex) {
            throw new BadRequestException("Invalid time format for '" + key + "'. Use HH:mm or HH:mm:ss");
        }
    }

    private FieldType parseFieldType(String rawType) {
        String normalized = rawType.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        try {
            return FieldType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Unsupported fieldType: " + rawType);
        }
    }

    private String getRequiredText(JsonNode node, String key) {
        if (!node.hasNonNull(key)) {
            throw new BadRequestException("Missing required field: " + key);
        }
        String value = node.path(key).asText().trim();
        if (value.isBlank()) {
            throw new BadRequestException("Field '" + key + "' cannot be blank");
        }
        return value;
    }

    private String getOptionalText(JsonNode node, String key) {
        if (!node.hasNonNull(key)) {
            return null;
        }
        String value = node.path(key).asText().trim();
        return value.isBlank() ? null : value;
    }

    private Boolean getOptionalBoolean(JsonNode node, String key, boolean defaultValue) {
        if (!node.has(key) || node.path(key).isNull()) {
            return defaultValue;
        }
        return node.path(key).asBoolean(defaultValue);
    }

    private boolean requiresOptions(FieldType fieldType) {
        return fieldType == FieldType.DROPDOWN || fieldType == FieldType.RADIO_BUTTON || fieldType == FieldType.CHECKBOX;
    }

    private void validateValidationJson(String validationJson) {
        if (validationJson == null || validationJson.isBlank()) {
            return;
        }

        try {
            if (!objectMapper.readTree(validationJson).isObject()) {
                throw new BadRequestException("validationJson must be a JSON object");
            }
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("validationJson must be valid JSON object");
        }
    }

    private void validateDefaultValue(FieldType fieldType, String defaultValue) {
        if (defaultValue == null || defaultValue.isBlank()) {
            return;
        }

        String normalized = defaultValue.trim();
        try {
            switch (fieldType) {
                case NUMBER -> Double.parseDouble(normalized);
                case EMAIL -> {
                    if (!normalized.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$")) {
                        throw new BadRequestException("defaultValue is not a valid email");
                    }
                }
                case PHONE -> {
                    if (!normalized.matches("^[0-9+()\\-\\s]{7,20}$")) {
                        throw new BadRequestException("defaultValue is not a valid phone number");
                    }
                }
                default -> {
                }
            }
        } catch (NumberFormatException ex) {
            throw new BadRequestException("defaultValue is not a valid number");
        }
    }
}
