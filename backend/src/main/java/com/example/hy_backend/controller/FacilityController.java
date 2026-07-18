package com.example.hy_backend.controller;
import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.dto.FacilityDtos;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.hy_backend.service.FacilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/facilities")
@Tag(name = "Facility", description = "Facility management APIs")
public class FacilityController {

    private final FacilityService facilityService;

    public FacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @PostMapping
        @Operation(
            summary = "Create facility",
            responses = {
                @ApiResponse(responseCode = "200", description = "Facility created"),
                @ApiResponse(responseCode = "400", description = "Invalid request payload")
            }
        )
    public ResponseEntity<FacilityDtos.FacilityCreateResponse> createFacility(
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                required = true,
                content = @Content(
                    schema = @Schema(implementation = FacilityDtos.FacilityCreateRequest.class)
                )
            ) FacilityDtos.FacilityCreateRequest request
    ) {
        return ResponseEntity.ok(facilityService.createFacility(request));
    }

    @GetMapping
    @Operation(summary = "Get all facilities")
    public ResponseEntity<List<FacilityDtos.FacilitySummaryResponse>> getAllFacilities() {
        return ResponseEntity.ok(facilityService.getAllFacilities());
    }

    @GetMapping("/{facilityId}")
    @Operation(summary = "Get facility details")
    public ResponseEntity<FacilityDtos.FacilityDetailResponse> getFacility(@PathVariable Long facilityId) {
        return ResponseEntity.ok(facilityService.getFacility(facilityId));
    }

    @PutMapping("/{facilityId}")
    @Operation(summary = "Update facility")
    public ResponseEntity<FacilityDtos.FacilityDetailResponse> updateFacility(
            @PathVariable Long facilityId,
            @Valid @RequestBody FacilityDtos.FacilityUpdateRequest request
    ) {
        return ResponseEntity.ok(facilityService.updateFacility(facilityId, request));
    }

    @DeleteMapping("/{facilityId}")
    @Operation(summary = "Delete facility")
    public ResponseEntity<Void> deleteFacility(@PathVariable Long facilityId) {
        facilityService.deleteFacility(facilityId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{facilityId}/publish")
    @Operation(summary = "Publish facility")
    public ResponseEntity<FacilityDtos.PublishResponse> publishFacility(
            @PathVariable Long facilityId,
            @RequestBody(required = false) FacilityDtos.PublishRequest request
    ) {
        return ResponseEntity.ok(facilityService.publishFacility(facilityId, request));
    }

    @GetMapping("/{facilityId}/registration-stats")
    @Operation(summary = "Get registration stats for a published facility")
    public ResponseEntity<FacilityDtos.FacilityRegistrationStatsResponse> getRegistrationStats(
            @PathVariable Long facilityId
    ) {
        return ResponseEntity.ok(facilityService.getRegistrationStats(facilityId));
    }

    @PostMapping("/{facilityId}/remind-unregistered")
    @Operation(summary = "Send reminder to employees who have not registered for a published facility")
    public ResponseEntity<FacilityDtos.FacilityReminderResponse> remindUnregistered(
            @PathVariable Long facilityId
    ) {
        return ResponseEntity.ok(facilityService.sendReminderToUnregistered(facilityId));
    }

    @GetMapping("/{facilityId}/specification")
    @Operation(
            summary = "Get facility specification",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Specification returned"),
                    @ApiResponse(responseCode = "404", description = "Facility not found")
            }
    )
    public ResponseEntity<EmployeeDtos.FacilitySpecificationResponse> getSpecification(@PathVariable Long facilityId) {
        return ResponseEntity.ok(facilityService.getFacilitySpecification(facilityId));
    }

    @PostMapping("/{facilityId}/create-from-template")
    @Operation(summary = "Create a new facility from a template, pre-filled with all template fields and rules")
    public ResponseEntity<FacilityDtos.CreateFromTemplateResponse> createFromTemplate(
            @PathVariable Long facilityId,
            @RequestParam(value = "name", required = false) String newFacilityName
    ) {
        return ResponseEntity.ok(facilityService.createFromTemplate(facilityId, newFacilityName));
    }

    @PostMapping("/{facilityId}/save-as-template")
    @Operation(summary = "Mark an existing facility as a template")
    public ResponseEntity<FacilityDtos.FacilityDetailResponse> saveAsTemplate(@PathVariable Long facilityId) {
        return ResponseEntity.ok(facilityService.saveAsTemplate(facilityId));
    }

    @PatchMapping("/{facilityId}/visibility")
    @Operation(summary = "Toggle a template's public / private visibility")
    public ResponseEntity<FacilityDtos.FacilityDetailResponse> updateTemplateVisibility(
            @PathVariable Long facilityId,
            @Valid @RequestBody FacilityDtos.TemplateVisibilityRequest request
    ) {
        return ResponseEntity.ok(facilityService.updateTemplateVisibility(facilityId, request));
    }
}
