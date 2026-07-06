package com.example.hy_backend.dto;

public final class SpecificationDtos {

    private SpecificationDtos() {
    }

    public record UploadResponse(
            Long facilityId,
            String facilityName,
            Boolean published,
            Integer fieldCount,
            String message
    ) {
    }
}