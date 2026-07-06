package com.example.hy_backend.controller;

import com.example.hy_backend.dto.SpecificationDtos;
import com.example.hy_backend.service.SpecificationService;
import com.fasterxml.jackson.databind.JsonNode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/specifications")
@Tag(name = "Specification", description = "Specification upload and template APIs")
public class SpecificationController {

    private final SpecificationService specificationService;

    public SpecificationController(SpecificationService specificationService) {
        this.specificationService = specificationService;
    }

    @PostMapping("/upload")
    @Operation(summary = "Upload facility specification JSON")
    public ResponseEntity<SpecificationDtos.UploadResponse> upload(@RequestBody JsonNode specificationJson) {
        return ResponseEntity.ok(specificationService.uploadSpecification(specificationJson));
    }

    @GetMapping("/template")
    @Operation(summary = "Get starter JSON template for facility specification")
    public ResponseEntity<JsonNode> getTemplate() {
        return ResponseEntity.ok(specificationService.getTemplateSpecification());
    }

    @GetMapping("/facilities/{facilityId}/generated")
    @Operation(summary = "Generate specification JSON from persisted configuration")
    public ResponseEntity<JsonNode> getGeneratedSpecification(@PathVariable Long facilityId) {
        return ResponseEntity.ok(specificationService.getGeneratedSpecification(facilityId));
    }
}