package com.example.hy_backend.dto;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record LoginRequest(@NotBlank String employeeId, @NotBlank String password) {
    }

    public record LoginResponse(String token, String employeeId, String name, String email, String role) {
    }

    public record CurrentUserResponse(String employeeId, String name, String email, String role) {
    }
}
