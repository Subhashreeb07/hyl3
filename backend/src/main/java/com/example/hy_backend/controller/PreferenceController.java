package com.example.hy_backend.controller;

import com.example.hy_backend.service.AuthService;
import com.example.hy_backend.service.PreferenceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/employee/preferences")
@Tag(name = "Preferences", description = "Employee saved form preferences (cross-facility, label-based)")
public class PreferenceController {

    private final PreferenceService preferenceService;
    private final AuthService authService;

    public PreferenceController(PreferenceService preferenceService, AuthService authService) {
        this.preferenceService = preferenceService;
        this.authService = authService;
    }

    @GetMapping
    @Operation(summary = "Get all saved preferences for the logged-in employee")
    public ResponseEntity<Map<String, String>> getPreferences(
            @RequestHeader("Authorization") String authorization) {
        String employeeId = authService.resolveEmployeeId(authorization);
        return ResponseEntity.ok(preferenceService.getPreferences(employeeId));
    }

    @PutMapping
    @Operation(summary = "Save / upsert form preferences for the logged-in employee")
    public ResponseEntity<Void> savePreferences(
            @RequestHeader("Authorization") String authorization,
            @RequestBody List<PreferenceService.PreferenceEntry> entries) {
        String employeeId = authService.resolveEmployeeId(authorization);
        preferenceService.savePreferences(employeeId, entries);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{label}")
    @Operation(summary = "Delete a single saved preference entry by label")
    public ResponseEntity<Void> deletePreference(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String label) {
        String employeeId = authService.resolveEmployeeId(authorization);
        preferenceService.deletePreference(employeeId, label);
        return ResponseEntity.noContent().build();
    }
}
