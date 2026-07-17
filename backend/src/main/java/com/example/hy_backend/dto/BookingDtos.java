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
            String facilityCategory,
            String employeeId,
            String status,
            String bookingDate,
            String bookingDeadline,
            String createdAt,
            List<BookingAnswer> responses,
            String selectedRoute,
            String selectedStop
    ) {
    }

    public record BookingAnswer(Long fieldId, String label, String value) {
    }

    public record BookingPreferenceItem(Long fieldId, String label, String value, Long voteCount) {
    }

    public record BookingPreferenceResponse(
            String employeeId,
            Long facilityId,
            Long sampleSize,
            List<BookingPreferenceItem> preferences
    ) {
    }

        public record AdminBookingSearchItem(
            Long bookingId,
            Long facilityId,
            String facilityName,
            String facilityCategory,
            String employeeId,
            String employeeName,
            String department,
            String status,
            String bookingDate,
            String createdAt,
            String cancelledAt,
            List<BookingAnswer> answers,
            String selectedRoute,
            String selectedStop
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

}
