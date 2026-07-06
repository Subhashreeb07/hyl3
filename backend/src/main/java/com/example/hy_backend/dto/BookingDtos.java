package com.example.hy_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public final class BookingDtos {

    private BookingDtos() {
    }

    public record SubmitBookingRequest(
            @NotNull Long facilityId,
            @NotBlank String employeeId,
            String clientRequestId,
            String bookingDate,
            @NotEmpty List<@Valid BookingFieldInput> responses
    ) {
    }

    public record BookingFieldInput(@NotNull Long fieldId, @NotBlank String value) {
    }

        public record SubmitBookingResponse(
            Long bookingId,
            String status,
            String bookingDate,
            String createdAt,
            Boolean idempotentReplay,
            String message
        ) {
    }

        public record BookingHistoryItem(Long bookingId, String facility, String status, String bookingDate) {
    }

    public record BookingDetail(
            Long bookingId,
            Long facilityId,
            String facilityName,
            String employeeId,
            String status,
            String bookingDate,
            String createdAt,
            String qrCode,
            List<BookingAnswer> responses
    ) {
    }

    public record BookingAnswer(Long fieldId, String label, String value) {
    }

        public record AdminBookingSearchItem(
            Long bookingId,
            Long facilityId,
            String facilityName,
            String employeeId,
            String status,
            String bookingDate,
            String createdAt,
            String cancelledAt,
            String qrCode
        ) {
        }

        public record BookingSummaryResponse(
            Long facilityId,
            String bookingDate,
            Long totalBookings,
            Long confirmedBookings,
            Long cancelledBookings
        ) {
        }

    public record VerifyQrRequest(@NotBlank String qrCode) {
    }

    public record VerifyQrResponse(
            Boolean valid,
            String message,
            Long bookingId,
            Long facilityId,
            String facilityName,
            String employeeId,
            String bookingDate,
            String status
    ) {
    }
}
