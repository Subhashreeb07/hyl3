package com.example.hy_backend.service;

import com.example.hy_backend.dto.SpecificationDtos;
import com.fasterxml.jackson.databind.JsonNode;

public interface SpecificationService {
    SpecificationDtos.UploadResponse uploadSpecification(JsonNode specificationJson);

    JsonNode getTemplateSpecification();

    JsonNode getGeneratedSpecification(Long facilityId);
}