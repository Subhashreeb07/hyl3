package com.example.hy_backend.controller;

import com.example.hy_backend.dto.FacilityDtos;
import com.example.hy_backend.service.FacilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/facilities")
@Tag(name = "Admin Facility", description = "Admin facility management APIs")
public class AdminFacilityController {

    private final FacilityService facilityService;

    public AdminFacilityController(FacilityService facilityService) {
        this.facilityService = facilityService;
    }

    @PostMapping("/import-json")
    @Operation(summary = "Import facility from JSON specification")
    public ResponseEntity<FacilityDtos.FacilityDetailResponse> importFacilityFromJson(
            @Valid @RequestBody Map<String, Object> jsonData
    ) {
        return ResponseEntity.ok(facilityService.importFacilityFromJson(jsonData));
    }
}
