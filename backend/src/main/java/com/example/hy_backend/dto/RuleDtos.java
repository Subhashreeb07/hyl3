package com.example.hy_backend.dto;

import jakarta.validation.constraints.Min;

public final class RuleDtos {

    private RuleDtos() {
    }

    public record RuleRequest(
            String bookingDeadline,
            String bookingStartTime
    ) {
    }

    public record RuleResponse(
            String bookingDeadline,
            String bookingStartTime
    ) {
    }
}
