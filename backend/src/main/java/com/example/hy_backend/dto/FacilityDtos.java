package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class FacilityDtos {

    private FacilityDtos() {
    }

    public record FacilityCreateRequest(
            @NotBlank String facilityName,
            String description,
            String category,
            String icon,
            String facilityType,
            Boolean isTemplate,
            Boolean isPublic
    ) {
    }

    public record FacilityUpdateRequest(
            @NotBlank String facilityName,
            String description,
            String category,
            String icon,
            String facilityType,
            Boolean isTemplate,
            Boolean isPublic
    ) {
    }

    public record FacilityCreateResponse(Long facilityId, String message) {
    }

    public record FacilitySummaryResponse(
            Long facilityId,
            String facilityName,
            String facilityType,
            Boolean isTemplate,
            Boolean isPublic
    ) {
    }

    public record FacilityDetailResponse(
            Long facilityId,
            String facilityName,
            String description,
            String category,
            String icon,
            String facilityType,
            Boolean published,
            Boolean isTemplate,
            Boolean isPublic,
            List<String> targetLocations
    ) {
    }

    public record PublishRequest(List<String> targetLocations, List<String> targetEmployeeIds) {
    }

    public record PublishResponse(Long facilityId, String message) {
    }

    public record FacilityRegistrationStatsResponse(
            Long facilityId,
            int eligibleEmployees,
            int registeredEmployees,
            int notRegisteredEmployees
    ) {
    }

    public record FacilityReminderResponse(
            Long facilityId,
            int matchedEmployees,
            int notificationsCreated,
            int registeredEmployees,
            int notRegisteredEmployees,
            String message
    ) {
    }

    public record CreateFromTemplateResponse(Long facilityId, String facilityName, String message) {
    }

    public record TemplateVisibilityRequest(@NotNull Boolean isPublic) {
    }
}
