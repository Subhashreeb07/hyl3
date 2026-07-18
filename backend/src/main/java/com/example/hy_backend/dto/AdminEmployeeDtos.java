package com.example.hy_backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class AdminEmployeeDtos {

    private AdminEmployeeDtos() {}

    public record EmployeeCreateRequest(
            @NotBlank
            @Size(max = 64)
            @Pattern(regexp = "^[A-Za-z0-9_-]+$", message = "employeeId must contain only letters, numbers, hyphen, or underscore")
            String employeeId,
            @NotBlank @Size(max = 200) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank @Size(max = 120) String department,
            @NotBlank String roleCode,
            @NotBlank String workMode,
            @NotBlank String officeLocation,
            String password
    ) {}

    public record EmployeeResponse(
            String employeeId,
            String fullName,
            String email,
            String department,
            String roleCode,
            String workMode,
            String officeLocation,
            boolean active
    ) {}

    public record BulkUploadResult(
            int created,
            int skipped,
            List<String> errors
    ) {}
}
