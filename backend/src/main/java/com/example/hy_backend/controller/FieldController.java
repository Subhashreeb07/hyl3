package com.example.hy_backend.controller;

import com.example.hy_backend.dto.CommonDtos;
import com.example.hy_backend.dto.FieldDtos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.hy_backend.service.FieldService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@Tag(name = "Template Builder", description = "Dynamic field and option APIs")
public class FieldController {

    private final FieldService fieldService;

    public FieldController(FieldService fieldService) {
        this.fieldService = fieldService;
    }

    @PostMapping("/facilities/{facilityId}/fields")
    @Operation(summary = "Add field to facility")
    public ResponseEntity<FieldDtos.FieldIdResponse> addField(
            @PathVariable Long facilityId,
            @Valid @RequestBody FieldDtos.AddFieldRequest request
    ) {
        return ResponseEntity.ok(fieldService.addField(facilityId, request));
    }


    @GetMapping("/facilities/{facilityId}/fields")
    @Operation(summary = "Get fields by facility")
    public ResponseEntity<List<FieldDtos.FieldSummaryResponse>> getFields(@PathVariable Long facilityId) {
        return ResponseEntity.ok(fieldService.getFields(facilityId));
    }

    @PutMapping("/fields/{fieldId}")
    @Operation(summary = "Update field")
    public ResponseEntity<FieldDtos.FieldDetailResponse> updateField(
            @PathVariable Long fieldId,
            @Valid @RequestBody FieldDtos.UpdateFieldRequest request
    ) {
        return ResponseEntity.ok(fieldService.updateField(fieldId, request));
    }

    @PostMapping("/fields/{fieldId}/options")
    @Operation(summary = "Update options for dropdown/radio/checkbox field")
    public ResponseEntity<CommonDtos.MessageResponse> updateFieldOptions(
            @PathVariable Long fieldId,
            @RequestBody FieldDtos.UpdateFieldOptionsRequest request
    ) {
        fieldService.updateFieldOptions(fieldId, request);
        return ResponseEntity.ok(new CommonDtos.MessageResponse("Field options updated successfully"));
    }

    @DeleteMapping("/fields/{fieldId}")
    @Operation(summary = "Delete field")
    public ResponseEntity<Void> deleteField(@PathVariable Long fieldId) {
        fieldService.deleteField(fieldId);
        return ResponseEntity.noContent().build();
    }
}
