package com.example.hy_backend.mapper;

import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;

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
            if (field.getFieldOptions() != null && !field.getFieldOptions().isBlank()) {
                for (String option : field.getFieldOptions().split("\n")) {
                    optionArray.add(option.trim());
                }
            }
        }

        ObjectNode rulesNode = root.putObject("rules");
        if (rule != null) {
            if (rule.getRulesJson() != null && !rule.getRulesJson().isBlank()) {
                try {
                    JsonNode storedRules = objectMapper.readTree(rule.getRulesJson());
                    if (storedRules.isObject()) {
                        rulesNode.setAll((ObjectNode) storedRules);
                    }
                } catch (Exception ignored) {
                }
            }
            putNullableText(rulesNode, "bookingStartTime", rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString());
            putNullableText(rulesNode, "bookingDeadline", rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString());
        } else {
            rulesNode.putNull("bookingStartTime");
            rulesNode.putNull("bookingDeadline");
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
