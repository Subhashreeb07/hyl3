package com.example.hy_backend.dto;

import java.util.List;

public final class AdminEmployeeDtos {

    private AdminEmployeeDtos() {}

    public record EmployeeCreateRequest(
            String employeeId,
            String fullName,
            String email,
            String department,
            String roleCode,
            String workMode,
            String officeLocation,
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
