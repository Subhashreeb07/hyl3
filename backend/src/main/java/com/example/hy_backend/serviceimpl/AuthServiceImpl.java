package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.AuthDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.service.AuditService;
import com.example.hy_backend.service.AuthService;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_PASSWORD = "password123";

    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final Map<String, String> tokenStore = new ConcurrentHashMap<>();

    public AuthServiceImpl(EmployeeRepository employeeRepository, AuditService auditService) {
        this.employeeRepository = employeeRepository;
        this.auditService = auditService;
    }

    @Override
    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        String employeeId = request.employeeId().trim().toUpperCase();
        Employee profile = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BadRequestException("Invalid employee ID or password"));

        if (!Boolean.TRUE.equals(profile.getActive()) || !DEFAULT_PASSWORD.equals(request.password().trim())) {
            throw new BadRequestException("Invalid employee ID or password");
        }

        String token = UUID.randomUUID().toString();
        tokenStore.put(token, profile.getEmployeeId());

        auditService.logAction(
                profile.getEmployeeId(),
                profile.getRoleCode(),
                "AUTH_LOGIN",
                "Employee",
                profile.getEmployeeId(),
                null,
                "{\"login\":\"SUCCESS\"}",
                null
        );

        return new AuthDtos.LoginResponse(token, profile.getEmployeeId(), profile.getFullName(), profile.getEmail(), profile.getRoleCode());
    }

    @Override
    public void logout(String bearerToken) {
        String token = extractToken(bearerToken);
        String employeeId = tokenStore.remove(token);
        if (employeeId != null) {
            Employee employee = employeeRepository.findById(employeeId).orElse(null);
            auditService.logAction(
                    employeeId,
                    employee == null ? "UNKNOWN" : employee.getRoleCode(),
                    "AUTH_LOGOUT",
                    "Employee",
                    employeeId,
                    null,
                    "{\"logout\":\"SUCCESS\"}",
                    null
            );
        }
    }

    @Override
    public AuthDtos.CurrentUserResponse currentUser(String bearerToken) {
        String token = extractToken(bearerToken);
        String employeeId = tokenStore.get(token);
        if (employeeId == null) {
            throw new ResourceNotFoundException("Session not found. Please login again.");
        }

        Employee profile = employeeRepository.findById(employeeId)
            .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));

        return new AuthDtos.CurrentUserResponse(
            profile.getEmployeeId(),
            profile.getFullName(),
            profile.getEmail(),
            profile.getRoleCode().toUpperCase(Locale.ROOT)
        );
    }

    @Override
    public String resolveRole(String bearerToken) {
        return currentUser(bearerToken).role();
    }

    private String extractToken(String bearerToken) {
        if (bearerToken == null || bearerToken.isBlank()) {
            throw new BadRequestException("Authorization token is required");
        }

        if (!bearerToken.startsWith("Bearer ")) {
            throw new BadRequestException("Authorization header must be in format: Bearer <token>");
        }

        String token = bearerToken.substring(7).trim();
        if (token.isBlank()) {
            throw new BadRequestException("Authorization token is required");
        }
        return token;
    }
}
