package com.example.hy_backend.mapper;

import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

public interface SpecificationMapper {
    JsonNode toJson(Facility facility, List<FieldDefinition> fields, FacilityRule rule);
}
