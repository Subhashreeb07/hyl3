package com.example.hy_backend.service;

import com.example.hy_backend.dto.AdminEmployeeDtos;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

public interface AdminEmployeeService {
    List<AdminEmployeeDtos.EmployeeResponse> listEmployees();
    List<String> listDistinctRoles();
    AdminEmployeeDtos.EmployeeResponse createEmployee(AdminEmployeeDtos.EmployeeCreateRequest req);
    AdminEmployeeDtos.BulkUploadResult bulkCreate(MultipartFile file) throws IOException;
    byte[] generateTemplate() throws IOException;
    List<Map<String, String>> previewRows(MultipartFile file) throws IOException;
}
