package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.Notification;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.repository.NotificationRepository;
import com.example.hy_backend.service.EmployeeService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public EmployeeServiceImpl(
            FacilityRepository facilityRepository,
            BookingRepository bookingRepository,
            EmployeeRepository employeeRepository,
            NotificationRepository notificationRepository,
            FacilityRuleRepository facilityRuleRepository
    ) {
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.notificationRepository = notificationRepository;
        this.facilityRuleRepository = facilityRuleRepository;
    }

    @Override
    public List<EmployeeDtos.DashboardFacilityResponse> getDashboardFacilities(String employeeId) {
        String normalizedEmployeeId = normalizeEmployeeId(employeeId);
        Optional<Employee> employeeOpt = employeeRepository.findById(normalizedEmployeeId);
        String officeLocation = employeeOpt
                .map(employee -> normalizeLocation(employee.getOfficeLocation()))
                .orElse(null);

        return facilityRepository.findByPublishedTrueAndStatusTrue().stream()
                .filter(facility -> facilityVisibleForOffice(facility, officeLocation))
                .filter(facility -> facilityAllowedForEmployee(facility, employeeOpt.orElse(null)))
                .map(f -> new EmployeeDtos.DashboardFacilityResponse(
                        f.getFacilityId(),
                        f.getFacilityName(),
                        f.getIcon()
                ))
                .toList();
    }

    @Override
    public EmployeeDtos.EmployeeHomeResponse getEmployeeHomeSummary(String employeeId) {
        String normalizedEmployeeId = normalizeEmployeeId(employeeId);
        List<Facility> facilities = facilityRepository.findByPublishedTrueAndStatusTrue();

        Optional<Employee> employeeOpt = employeeRepository.findById(normalizedEmployeeId);
        String officeLocation = employeeOpt.map(e -> normalizeLocation(e.getOfficeLocation())).orElse(null);
        Employee employee = employeeOpt.orElse(null);

        LocalDate today = LocalDate.now();
        List<Booking> todaysBookings = bookingRepository.findByEmployeeIdAndBookingDateOrderByCreatedAtDesc(normalizedEmployeeId, today);

        Map<Long, Booking> bookingByFacility = todaysBookings.stream()
                .collect(Collectors.toMap(
                        booking -> booking.getFacility().getFacilityId(),
                        booking -> booking,
                        (left, right) -> left
                ));

        List<EmployeeDtos.HomeServiceCard> services = facilities.stream()
                .filter(f -> facilityVisibleForOffice(f, officeLocation))
                .filter(f -> facilityAllowedForEmployee(f, employee))
                .map(facility -> {
                    Booking booking = bookingByFacility.get(facility.getFacilityId());
                    boolean booked = booking != null && booking.getStatus() == BookingStatus.CONFIRMED;

                    String status = booked ? "BOOKED" : "NOT BOOKED";
                    String badge = booked ? "CONFIRMED" : null;

                    String subtitle = facility.getDescription();
                    if (subtitle == null || subtitle.isBlank()) {
                        subtitle = "Quick service";
                    }

                    return new EmployeeDtos.HomeServiceCard(
                            facility.getFacilityId(),
                            facility.getFacilityName(),
                            subtitle,
                            iconForFacility(facility),
                            status,
                            badge
                    );
                })
                .toList();

        List<EmployeeDtos.DateChip> dates = java.util.stream.IntStream.range(0, 5)
                .mapToObj(offset -> {
                    LocalDate date = today.plusDays(offset);
                    return new EmployeeDtos.DateChip(
                            date.format(DateTimeFormatter.ofPattern("EEE", Locale.ENGLISH)).toUpperCase(Locale.ROOT),
                            date.getDayOfMonth(),
                            date.toString(),
                            offset == 0
                    );
                })
                .toList();

        Long targetFacilityId = facilities.isEmpty() ? null : facilities.getFirst().getFacilityId();

        return new EmployeeDtos.EmployeeHomeResponse(
                normalizedEmployeeId,
                employeeDisplayName(normalizedEmployeeId),
                today.format(DateTimeFormatter.ofPattern("EEEE, MMMM d", Locale.ENGLISH)).toUpperCase(Locale.ROOT),
                dates,
                new EmployeeDtos.QuickSetup(
                        "Book My Workday",
                        "Confirm your lunch, desk, and cab with one tap.",
                        targetFacilityId
                ),
                services,
                new EmployeeDtos.OfficeSummary("Hyderabad Office", 85)
        );
    }

    @Override
    public EmployeeDtos.EmployeeProfileResponse getEmployeeProfile(String employeeId) {
        String normalized = normalizeEmployeeId(employeeId);
        long totalBookings = bookingRepository.countByEmployeeId(normalized);
        long activeBookings = bookingRepository.countByEmployeeIdAndStatus(normalized, BookingStatus.CONFIRMED);

        Optional<Employee> employeeOpt = employeeRepository.findById(normalized);
        String name = employeeOpt.map(Employee::getFullName).orElse("Employee");
        String email = employeeOpt.map(Employee::getEmail).orElse(normalized.toLowerCase(Locale.ROOT) + "@hyhub.com");
        String department = employeeOpt.map(Employee::getDepartment).filter(value -> value != null && !value.isBlank()).orElse("--");
        String officeLocation = employeeOpt.map(Employee::getOfficeLocation).orElse("HYDERABAD");

        return new EmployeeDtos.EmployeeProfileResponse(
                normalized,
                name,
                email,
                department,
                toDisplayLocation(officeLocation),
                Math.toIntExact(totalBookings),
                Math.toIntExact(activeBookings)
        );
    }

    @Override
    public EmployeeDtos.InvitationsResponse getEmployeeInvitations(String employeeId) {
        String normalized = normalizeEmployeeId(employeeId);
        List<Notification> notifications = notificationRepository.findByEmployeeIdOrderByCreatedAtDesc(normalized);

        List<EmployeeDtos.InvitationItem> invitations = notifications.stream()
                .map(notification -> new EmployeeDtos.InvitationItem(
                        "INV-" + notification.getNotificationId(),
                        notification.getNotificationType(),
                        notification.getCreatedAt() == null ? "N/A" : notification.getCreatedAt().toString(),
                        notification.getStatusCode(),
                        notification.getChannelCode()
                ))
                .toList();

        int pending = (int) invitations.stream()
                .filter(item -> "PENDING".equalsIgnoreCase(item.status()))
                .count();

        return new EmployeeDtos.InvitationsResponse(normalized, pending, invitations);
    }

    private String normalizeEmployeeId(String employeeId) {
        return employeeId == null ? "" : employeeId.trim().toUpperCase(Locale.ROOT);
    }

    private String employeeDisplayName(String employeeId) {
        return employeeRepository.findById(employeeId)
                .map(Employee::getFullName)
                .orElse("Employee");
    }

    private String iconForFacility(Facility facility) {
        String name = facility.getFacilityName().toLowerCase(Locale.ROOT);
        if (name.contains("lunch")) {
            return "utensils";
        }
        if (name.contains("transport") || name.contains("cab")) {
            return "bus";
        }
        if (name.contains("event") || name.contains("team")) {
            return "calendar";
        }
        return "building";
    }

        private boolean facilityVisibleForOffice(Facility facility, String officeLocation) {
                List<String> targetedLocations = splitTargetLocations(facility.getTargetLocations());
                if (targetedLocations.isEmpty() || officeLocation == null) {
                        return true;
                }
                return targetedLocations.contains(officeLocation);
        }

        private List<String> splitTargetLocations(String raw) {
                if (raw == null || raw.isBlank()) {
                        return Collections.emptyList();
                }
                return Arrays.stream(raw.split(","))
                                .map(this::normalizeLocation)
                                .filter(value -> !value.isBlank())
                                .toList();
        }

        private String normalizeLocation(String location) {
                if (location == null) {
                        return "";
                }
                return location.trim().toUpperCase(Locale.ROOT);
        }

        private String toDisplayLocation(String location) {
                String normalized = normalizeLocation(location);
                if (normalized.isBlank()) {
                        return "Unknown";
                }
                return normalized.charAt(0) + normalized.substring(1).toLowerCase(Locale.ROOT);
        }

    /**
     * Returns true when the employee's work mode and role satisfy the facility's
     * configured employee-type and role restrictions.  If no rule exists or the
     * restriction lists are empty, the facility is visible to everyone.
     * ADMIN role always bypasses role/type restrictions.
     */
    private boolean facilityAllowedForEmployee(Facility facility, Employee employee) {
        if (employee == null) return true; // no employee info → show everything
        if ("ADMIN".equalsIgnoreCase(employee.getRoleCode())) return true;

        FacilityRule rule = facilityRuleRepository
                .findByFacilityFacilityId(facility.getFacilityId())
                .orElse(null);
        if (rule == null) return true;

        // Check employee types (work mode)
        String empTypesCsv = rule.getEmployeeTypes();
        if (empTypesCsv != null && !empTypesCsv.isBlank()) {
            String normalized = normalizeWorkMode(employee.getWorkMode());
            boolean typeMatch = Arrays.stream(empTypesCsv.split(","))
                    .map(String::trim)
                    .anyMatch(t -> t.equalsIgnoreCase(normalized));
            if (!typeMatch) return false;
        }

        // Check roles
        String rolesCsv = rule.getRoles();
        if (rolesCsv != null && !rolesCsv.isBlank()) {
            String normalized = normalizeRoleCode(employee.getRoleCode());
            boolean roleMatch = Arrays.stream(rolesCsv.split(","))
                    .map(String::trim)
                    .anyMatch(r -> r.equalsIgnoreCase(normalized));
            if (!roleMatch) return false;
        }

        return true;
    }

    /** Converts DB work_mode value to the display string stored in FacilityRule.employeeTypes. */
    private String normalizeWorkMode(String workMode) {
        if (workMode == null) return "Hybrid";
        return switch (workMode.trim().toUpperCase(Locale.ROOT)) {
            case "ON_SITE", "ONSITE" -> "On-site";
            case "REMOTE"            -> "Remote";
            default                  -> "Hybrid";
        };
    }

    /** Maps DB role_code to the display string stored in FacilityRule.roles. */
    private String normalizeRoleCode(String roleCode) {
        if (roleCode == null) return "";
        return switch (roleCode.trim().toUpperCase(Locale.ROOT)) {
            case "MANAGER"           -> "Manager";
            case "FINANCE"           -> "Finance";
            case "CLOUD"             -> "Cloud";
            case "DIRECTOR"          -> "Director";
            case "OPS"               -> "Ops";
            case "DEVOPS"            -> "Devops";
            // HR, RD, IS, NOC stay uppercase as stored
            default                  -> roleCode.trim().toUpperCase(Locale.ROOT);
        };
    }

    @Override
    public List<EmployeeDtos.AvailableFacilityResponse> getAvailableFacilitiesForDate(
            String employeeId, java.time.LocalDate date) {

        String normalizedEmployeeId = normalizeEmployeeId(employeeId);
        LocalDate today = LocalDate.now();

        // Don't return facilities for past dates
        if (date.isBefore(today)) {
            return List.of();
        }

        Optional<Employee> empOpt = employeeRepository.findById(normalizedEmployeeId);
        String officeLocation = empOpt.map(e -> normalizeLocation(e.getOfficeLocation())).orElse(null);
        Employee employee = empOpt.orElse(null);

        List<Facility> publishedFacilities = facilityRepository.findByPublishedTrueAndStatusTrue()
                .stream()
                .filter(f -> facilityVisibleForOffice(f, officeLocation))
                .filter(f -> facilityAllowedForEmployee(f, employee))
                .toList();

        LocalTime now = LocalTime.now();
        java.time.DayOfWeek dayOfWeek = date.getDayOfWeek();
        long daysFromToday = java.time.temporal.ChronoUnit.DAYS.between(today, date);

        return publishedFacilities.stream().map(facility -> {
            Optional<FacilityRule> ruleOpt = facilityRuleRepository.findByFacilityFacilityId(facility.getFacilityId());

            boolean bookingAllowed = true;
            String unavailableReason = null;

            if (ruleOpt.isPresent()) {
                FacilityRule rule = ruleOpt.get();

                // Check facility date range — FILTER OUT (hide) if selected date is outside range
                java.time.LocalDate facilityFromDate = rule.getFacilityAvailableFromDate();
                java.time.LocalDate facilityToDate = rule.getFacilityAvailableToDate();
                if (facilityFromDate != null || facilityToDate != null) {
                    if (facilityFromDate != null && date.isBefore(facilityFromDate)) {
                        return null; // hide facility — not yet available on this date
                    }
                    if (facilityToDate != null && date.isAfter(facilityToDate)) {
                        return null; // hide facility — no longer available on this date
                    }
                }

                // Check booking window restriction (how many days in advance can book)
                Integer bookingWindowDays = rule.getBookingWindowDays();
                if (bookingAllowed && bookingWindowDays != null && daysFromToday > bookingWindowDays) {
                    bookingAllowed = false;
                    LocalDate openDate = today.plusDays(bookingWindowDays);
                    unavailableReason = "Booking opens on " + openDate.format(java.time.format.DateTimeFormatter.ofPattern("MMM d"));
                }

                // Check available days restriction
                String availableDays = rule.getAvailableDays();
                if (bookingAllowed && availableDays != null && !availableDays.isBlank()) {
                    boolean allowed = java.util.Arrays.stream(availableDays.split(","))
                            .map(String::trim)
                            .map(String::toUpperCase)
                            .anyMatch(d -> d.equals(dayOfWeek.name()));
                    if (!allowed) {
                        bookingAllowed = false;
                        String dayName = dayOfWeek.name().charAt(0) + dayOfWeek.name().substring(1).toLowerCase();
                        unavailableReason = "Not available on " + dayName;
                    }
                }

                // For today: check the booking window (bookingStartTime → bookingDeadline)
                if (bookingAllowed && date.equals(today)) {
                    LocalTime startTime = rule.getBookingStartTime();
                    LocalTime deadline = rule.getBookingDeadline();

                    if (startTime != null && now.isBefore(startTime)) {
                        bookingAllowed = false;
                        unavailableReason = "Booking window opens at " + startTime;
                    } else if (deadline != null && now.isAfter(deadline)) {
                        bookingAllowed = false;
                        unavailableReason = "Booking window closed at " + deadline;
                    }
                }
            }

            String startTimeStr = ruleOpt
                    .map(FacilityRule::getBookingStartTime)
                    .map(LocalTime::toString)
                    .orElse(null);

            String deadlineStr = ruleOpt
                    .map(FacilityRule::getBookingDeadline)
                    .map(LocalTime::toString)
                    .orElse(null);

            String availableDaysStr = ruleOpt
                    .map(FacilityRule::getAvailableDays)
                    .orElse(null);

            Integer bookingWindowDaysInt = ruleOpt
                    .map(FacilityRule::getBookingWindowDays)
                    .orElse(null);

            boolean alreadyBooked = bookingAllowed && bookingRepository
                    .existsByEmployeeIdAndFacilityFacilityIdAndBookingDateAndStatus(
                            normalizedEmployeeId, facility.getFacilityId(), date, BookingStatus.CONFIRMED);

            String bookingIdStr = null;
            if (alreadyBooked) {
                List<Booking> existing = bookingRepository
                        .findByEmployeeIdAndBookingDateOrderByCreatedAtDesc(normalizedEmployeeId, date);
                bookingIdStr = existing.stream()
                        .filter(b -> b.getFacility().getFacilityId().equals(facility.getFacilityId()))
                        .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                        .findFirst()
                        .map(b -> String.valueOf(b.getBookingId()))
                        .orElse(null);
            }

            return new EmployeeDtos.AvailableFacilityResponse(
                    facility.getFacilityId(),
                    facility.getFacilityName(),
                    facility.getIcon(),
                    facility.getCategory(),
                    facility.getDescription(),
                    startTimeStr,
                    deadlineStr,
                    alreadyBooked,
                    bookingIdStr,
                    availableDaysStr,
                    bookingWindowDaysInt,
                    bookingAllowed,
                    unavailableReason
            );
        })
        .filter(java.util.Objects::nonNull)
        .toList();
    }
}
