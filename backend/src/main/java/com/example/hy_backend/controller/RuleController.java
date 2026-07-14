package com.example.hy_backend.controller;

import com.example.hy_backend.dto.RuleDtos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.hy_backend.service.RuleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/facilities/{facilityId}/rules")
@Tag(name = "Rules", description = "Facility rule APIs")
public class RuleController {

    private final RuleService ruleService;

    public RuleController(RuleService ruleService) {
        this.ruleService = ruleService;
    }

    @PostMapping
    @Operation(summary = "Save facility rules")
    public ResponseEntity<RuleDtos.RuleResponse> saveRules(
            @PathVariable Long facilityId,
            @RequestBody com.fasterxml.jackson.databind.JsonNode request
    ) {
        return ResponseEntity.ok(ruleService.saveRules(facilityId, request));
    }

    @GetMapping
    @Operation(summary = "Get facility rules")
    public ResponseEntity<com.fasterxml.jackson.databind.JsonNode> getRules(@PathVariable Long facilityId) {
        return ResponseEntity.ok(ruleService.getFullRules(facilityId));
    }

    @PutMapping
    @Operation(summary = "Update facility rules")
    public ResponseEntity<RuleDtos.RuleResponse> updateRules(
            @PathVariable Long facilityId,
            @RequestBody com.fasterxml.jackson.databind.JsonNode request
    ) {
        return ResponseEntity.ok(ruleService.updateRules(facilityId, request));
    }
}
