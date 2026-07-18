package com.example.hy_backend.controller;

import com.example.hy_backend.dto.AdminEmployeeDtos;
import com.example.hy_backend.service.AdminEmployeeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/admin/employees")
@Tag(name = "Admin - Employees", description = "Employee management by admin")
public class AdminEmployeeController {

    private final AdminEmployeeService service;

    public AdminEmployeeController(AdminEmployeeService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List all employees")
    public ResponseEntity<List<AdminEmployeeDtos.EmployeeResponse>> list() {
        return ResponseEntity.ok(service.listEmployees());
    }

    @GetMapping("/roles")
    @Operation(summary = "Get distinct role codes from employees table")
    public ResponseEntity<List<String>> distinctRoles() {
        return ResponseEntity.ok(service.listDistinctRoles());
    }

    @PostMapping
    @Operation(summary = "Create a single employee")
    public ResponseEntity<AdminEmployeeDtos.EmployeeResponse> create(
            @Valid @RequestBody AdminEmployeeDtos.EmployeeCreateRequest req) {
        return ResponseEntity.ok(service.createEmployee(req));
    }

    @PostMapping(value = "/bulk", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Bulk create employees from Excel file")
    public ResponseEntity<AdminEmployeeDtos.BulkUploadResult> bulk(
            @RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(service.bulkCreate(file));
    }

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Preview rows from uploaded Excel (no DB write)")
    public ResponseEntity<java.util.Map<String, Object>> preview(
            @RequestParam("file") MultipartFile file) throws IOException {
        var rows = service.previewRows(file);
        return ResponseEntity.ok(java.util.Map.of("rows", rows));
    }

    @GetMapping("/template")
    @Operation(summary = "Download Excel upload template")
    public ResponseEntity<byte[]> template() throws IOException {
        byte[] bytes = service.generateTemplate();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename("employee_upload_template.xlsx")
                                .build().toString())
                .body(bytes);
    }
}
