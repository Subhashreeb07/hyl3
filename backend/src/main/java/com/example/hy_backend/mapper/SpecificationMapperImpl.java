package com.example.hy_backend.mapper;

import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FieldOption;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;

@Component
public class SpecificationMapperImpl implements SpecificationMapper {

    private static final String SPEC_VERSION = "1.0";

    private final ObjectMapper objectMapper;

    public SpecificationMapperImpl(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public JsonNode toJson(Facility facility, List<FieldDefinition> fields, FacilityRule rule) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("specVersion", SPEC_VERSION);
        root.put("generatedAt", OffsetDateTime.now(ZoneOffset.UTC).toString());

        ObjectNode facilityNode = root.putObject("facility");
        facilityNode.put("facilityId", facility.getFacilityId());
        facilityNode.put("facilityName", facility.getFacilityName());
        putNullableText(facilityNode, "description", facility.getDescription());
        putNullableText(facilityNode, "category", facility.getCategory());
        putNullableText(facilityNode, "icon", facility.getIcon());
        facilityNode.put("status", Boolean.TRUE.equals(facility.getStatus()));
        facilityNode.put("published", Boolean.TRUE.equals(facility.getPublished()));

        ArrayNode fieldsNode = root.putArray("fields");
        for (FieldDefinition field : fields.stream().sorted(Comparator.comparing(FieldDefinition::getDisplayOrder)).toList()) {
            ObjectNode fieldNode = fieldsNode.addObject();
            fieldNode.put("fieldId", field.getFieldId());
            fieldNode.put("label", field.getLabel());
            fieldNode.put("fieldType", field.getFieldType().name());
            putNullableText(fieldNode, "placeholder", field.getPlaceholder());
            fieldNode.put("required", Boolean.TRUE.equals(field.getRequired()));
            fieldNode.put("displayOrder", field.getDisplayOrder());
            putNullableText(fieldNode, "validationJson", field.getValidationJson());
            putNullableText(fieldNode, "defaultValue", field.getDefaultValue());

            ArrayNode optionArray = fieldNode.putArray("options");
            for (FieldOption option : field.getOptions().stream().sorted(Comparator.comparing(FieldOption::getDisplayOrder)).toList()) {
                optionArray.add(option.getOptionValue());
            }
        }

        ObjectNode rulesNode = root.putObject("rules");
        if (rule != null) {
            putNullableText(rulesNode, "bookingStartTime", rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString());
            putNullableText(rulesNode, "bookingDeadline", rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString());
            putNullableText(rulesNode, "reminderTime", rule.getReminderTime() == null ? null : rule.getReminderTime().toString());
            rulesNode.put("qrRequired", Boolean.TRUE.equals(rule.getQrRequired()));
            rulesNode.put("allowCancellation", !Boolean.FALSE.equals(rule.getAllowCancellation()));
            if (rule.getMaximumCapacity() == null) {
                rulesNode.putNull("maximumCapacity");
            } else {
                rulesNode.put("maximumCapacity", rule.getMaximumCapacity());
            }
            rulesNode.put("regularCommuteEnabled", Boolean.TRUE.equals(rule.getRegularCommuteEnabled()));
            putNullableText(rulesNode, "availableDays", rule.getAvailableDays());
            putNullableText(rulesNode, "cancellationDeadline", rule.getCancellationDeadline() == null ? null : rule.getCancellationDeadline().toString());
            
            putCsvAsArray(rulesNode, "employeeTypes", rule.getEmployeeTypes());
            putCsvAsArray(rulesNode, "roles", rule.getRoles());

            if (rule.getBookingWindowDays() == null) {
                rulesNode.putNull("bookingWindowDays");
            } else {
                rulesNode.put("bookingWindowDays", rule.getBookingWindowDays());
            }
            putNullableText(rulesNode, "facilityAvailableFromDate", rule.getFacilityAvailableFromDate() == null ? null : rule.getFacilityAvailableFromDate().toString());
            putNullableText(rulesNode, "facilityAvailableToDate", rule.getFacilityAvailableToDate() == null ? null : rule.getFacilityAvailableToDate().toString());
        } else {
            rulesNode.putNull("bookingStartTime");
            rulesNode.putNull("bookingDeadline");
            rulesNode.putNull("reminderTime");
            rulesNode.put("qrRequired", false);
            rulesNode.put("allowCancellation", true);
            rulesNode.putNull("maximumCapacity");
            rulesNode.put("regularCommuteEnabled", false);
            rulesNode.putNull("availableDays");
            rulesNode.putNull("cancellationDeadline");
            rulesNode.putArray("employeeTypes");
            rulesNode.putArray("roles");
            rulesNode.putNull("bookingWindowDays");
            rulesNode.putNull("facilityAvailableFromDate");
            rulesNode.putNull("facilityAvailableToDate");
        }

        return root;
    }

    private void putNullableText(ObjectNode node, String key, String value) {
        if (value == null || value.isBlank()) {
            node.putNull(key);
            return;
        }
        node.put(key, value);
    }

    private void putCsvAsArray(ObjectNode node, String key, String csv) {
        if (csv == null || csv.isBlank()) {
            node.putArray(key);
            return;
        }
        ArrayNode arrayNode = node.putArray(key);
        for (String item : csv.split(",")) {
            String trimmed = item.trim();
            if (!trimmed.isEmpty()) {
                arrayNode.add(trimmed);
            }
        }
    }
}
