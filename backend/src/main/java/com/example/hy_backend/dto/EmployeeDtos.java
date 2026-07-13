package com.example.hy_backend.dto;

import java.util.List;

public final class EmployeeDtos {

    private EmployeeDtos() {
    }

    public record DashboardFacilityResponse(Long facilityId, String facilityName, String icon) {
    }

    public record EmployeeHomeResponse(
            String employeeId,
            String employeeName,
            String dayLabel,
            List<DateChip> dates,
            QuickSetup quickSetup,
            List<HomeServiceCard> services,
            OfficeSummary officeSummary
    ) {
    }

        public record DateChip(String day, Integer date, String fullDate, Boolean selected) {
    }

    public record QuickSetup(String title, String description, Long targetFacilityId) {
    }

    public record HomeServiceCard(
            Long facilityId,
            String title,
            String subtitle,
            String icon,
            String bookingStatus,
            String badge
    ) {
    }

    public record OfficeSummary(String officeName, Integer availableDeskPercent) {
    }

    public record EmployeeProfileResponse(
            String employeeId,
            String employeeName,
            String email,
            String department,
            String location,
            Integer totalBookings,
            Integer activeBookings
    ) {
    }

    public record InvitationItem(
            String invitationId,
            String title,
            String schedule,
            String status,
            String location
    ) {
    }

    public record InvitationsResponse(String employeeId, Integer pendingCount, List<InvitationItem> invitations) {
    }

    public record AvailableFacilityResponse(
            Long facilityId,
            String facilityName,
            String icon,
            String category,
            String description,
            String bookingStartTime,
            String bookingDeadline,
            boolean alreadyBooked,
            String bookingId,
            String availableDays,
            Integer bookingWindowDays,
            boolean bookingAllowed,
            String unavailableReason
    ) {
    }

    public record FacilitySpecificationResponse(
            Long facilityId,
            String facilityName,
            List<SpecificationField> fields,
            SpecificationRule rules
    ) {
    }

    public record SpecificationField(
            Long fieldId,
            String label,
            String type,
            Boolean required,
            String placeholder,
            String validationJson,
            String defaultValue,
            List<String> options
    ) {
    }

    public record SpecificationRule(
            String bookingDeadline,
            String bookingStartTime,
            String reminderTime,
            Boolean qrRequired,
            Boolean allowCancellation,
            Integer maximumCapacity,
            Boolean regularCommuteEnabled,
            String availableDays,
            String cancellationDeadline,
            String employeeTypes,
            String roles
    ) {
    }
}
