package com.example.hy_backend.controller;

import com.example.hy_backend.dto.LocationDtos;
import com.example.hy_backend.service.LocationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
@Tag(name = "Locations", description = "Office location management and dashboard stats APIs")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping
    @Operation(summary = "List all office locations")
    public ResponseEntity<List<LocationDtos.LocationResponse>> getAll() {
        return ResponseEntity.ok(locationService.getAllLocations());
    }

    @PostMapping
    @Operation(summary = "Create a new office location")
    public ResponseEntity<LocationDtos.LocationResponse> create(
            @Valid @RequestBody LocationDtos.LocationCreateRequest request) {
        return ResponseEntity.ok(locationService.createLocation(request));
    }

    @PatchMapping("/{locationId}/employee-count")
    @Operation(summary = "Update employee count for a location")
    public ResponseEntity<LocationDtos.LocationResponse> updateCount(
            @PathVariable Long locationId,
            @Valid @RequestBody LocationDtos.LocationUpdateCountRequest request) {
        return ResponseEntity.ok(locationService.updateEmployeeCount(locationId, request));
    }

    @DeleteMapping("/{locationId}")
    @Operation(summary = "Delete an office location")
    public ResponseEntity<Void> delete(@PathVariable Long locationId) {
        locationService.deleteLocation(locationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{locationId}/stats")
    @Operation(summary = "Get facility booking stats for a location and date")
    public ResponseEntity<LocationDtos.LocationStatsResponse> getStats(
            @PathVariable Long locationId,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(locationService.getLocationStats(locationId, date));
    }

    @PostMapping("/{facilityId}/locations/{locationId}/acknowledge")
    @Operation(summary = "Increment acknowledged count for a facility+location on today's date")
    public ResponseEntity<Void> acknowledge(
            @PathVariable Long facilityId,
            @PathVariable Long locationId,
            @RequestParam(required = false) String date) {
        locationService.incrementAcknowledged(facilityId, locationId, date);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get dashboard stats (date strip, active facilities, total bookings) for a given date")
    public ResponseEntity<LocationDtos.DashboardStatsResponse> getDashboardStats(
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(locationService.getDashboardStats(date));
    }
}
