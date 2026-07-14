package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.List;

public final class FieldDtos {

    private FieldDtos() {
    }

    public record AddFieldRequest(
            @NotBlank String label,
            @NotBlank String fieldType,
            String placeholder,
            @NotNull Boolean required,
            @NotNull @Positive Integer displayOrder,
            String validationJson,
            String defaultValue,
            String fieldOptions
    ) {
    }

    public record UpdateFieldRequest(
            @NotBlank String label,
            @NotBlank String fieldType,
            String placeholder,
            @NotNull Boolean required,
            @NotNull @Positive Integer displayOrder,
            String validationJson,
            String defaultValue,
            String fieldOptions
    ) {
    }

    public record UpdateFieldOptionsRequest(List<String> options) {
    }

    public record FieldIdResponse(Long fieldId) {
    }



    public record FieldSummaryResponse(Long fieldId, String label, String fieldType) {
    }

    public record FieldDetailResponse(
            Long fieldId,
            String label,
            String fieldType,
            String placeholder,
            Boolean required,
            Integer displayOrder,
                        String validationJson,
                        String defaultValue,
            String fieldOptions
    ) {
    }
}
