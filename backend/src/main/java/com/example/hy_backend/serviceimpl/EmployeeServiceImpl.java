package com.example.hy_backend.serviceimpl;
import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.EmployeeService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class EmployeeServiceImpl implements EmployeeService {

    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final FacilityRuleRepository facilityRuleRepository;
        private final ObjectMapper objectMapper;

    public EmployeeServiceImpl(
            FacilityRepository facilityRepository,
            BookingRepository bookingRepository,
            EmployeeRepository employeeRepository,
                        FacilityRuleRepository facilityRuleRepository,
                        ObjectMapper objectMapper
    ) {
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.facilityRuleRepository = facilityRuleRepository;
                this.objectMapper = objectMapper;
    }

    @Override
    public List<EmployeeDtos.DashboardFacilityResponse> getDashboardFacilities(String employeeId) {
        String normalizedEmployeeId = normalizeEmployeeId(employeeId);
        Optional<Employee> employeeOpt = employeeRepository.findById(normalizedEmployeeId);
        String officeLocation = employeeOpt
                .map(employee -> normalizeLocation(employee.getOfficeLocation()))
                .orElse(null);

        return facilityRepository.findByPublishedTrue().stream()
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
        List<Facility> facilities = facilityRepository.findByPublishedTrue();

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
        return new EmployeeDtos.InvitationsResponse(normalized, 0, Collections.emptyList());
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
     *
     * <p>The frontend stores restrictions as comma-separated label strings in
     * {@code rulesJson.employeeTypes} (e.g. {@code "Remote"} or {@code "On-site,Hybrid"})
     * and {@code rulesJson.roles} (e.g. {@code "HR"} or {@code "HR,Manager"}).
     * An empty string means no restriction.
     */
    private boolean facilityAllowedForEmployee(Facility facility, Employee employee) {
        if (employee == null) return true;
        if ("ADMIN".equalsIgnoreCase(employee.getRoleCode())) return true;

        FacilityRule rule = facilityRuleRepository
                .findByFacilityFacilityId(facility.getFacilityId())
                .orElse(null);
        if (rule == null || rule.getRulesJson() == null || rule.getRulesJson().isBlank()) return true;

        try {
            JsonNode rn = objectMapper.readTree(rule.getRulesJson());

            // ── Work-mode filter ─────────────────────────────────────────────
            // "On-site", "Remote", "Hybrid" comma-separated; empty = no restriction
            String empTypes = rn.has("employeeTypes") ? rn.get("employeeTypes").asText("").trim() : "";
            if (!empTypes.isBlank()) {
                Set<String> typeSet = Arrays.stream(empTypes.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty())
                        .collect(java.util.stream.Collectors.toSet());
                if (!typeSet.contains(normalizeWorkMode(employee.getWorkMode()))) return false;
            }

            // ── Role filter ──────────────────────────────────────────────────
            // "HR", "Manager", "Finance", … comma-separated; empty = no restriction
            String roles = rn.has("roles") ? rn.get("roles").asText("").trim() : "";
            if (!roles.isBlank()) {
                Set<String> roleSet = Arrays.stream(roles.split(","))
                        .map(String::trim).filter(s -> !s.isEmpty())
                        .collect(java.util.stream.Collectors.toSet());
                String rc = employee.getRoleCode() == null ? "" : employee.getRoleCode().trim().toUpperCase(Locale.ROOT);
                // Base EMPLOYEE role: only passes in "Everyone" mode (all 10 specific roles listed)
                if ("EMPLOYEE".equals(rc)) return roleSet.size() >= 10;
                if (!roleSet.contains(normalizeRoleCode(rc))) return false;
            }

            return true;
        } catch (Exception ignored) {
            return true;
        }
    }

    private boolean boolFlag(JsonNode node, String key) {
        return node.has(key) && node.get(key).asBoolean(false);
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

        List<Facility> publishedFacilities = facilityRepository.findByPublishedTrue()
                .stream()
                .filter(f -> facilityVisibleForOffice(f, officeLocation))
                .filter(f -> facilityAllowedForEmployee(f, employee))
                .toList();

        LocalTime now = LocalTime.now();
        return publishedFacilities.stream().map(facility -> {
            Optional<FacilityRule> ruleOpt = facilityRuleRepository.findByFacilityFacilityId(facility.getFacilityId());

            boolean bookingAllowed = true;
            String unavailableReason = null;

            if (ruleOpt.isPresent()) {
                FacilityRule rule = ruleOpt.get();

                if (bookingAllowed) {
                    LocalDate[] window = resolveFacilityDateWindow(rule);
                    LocalDate availableFromDate = window[0];
                    LocalDate availableToDate = window[1];

                    if (availableFromDate != null && availableToDate != null
                            && (date.isBefore(availableFromDate) || date.isAfter(availableToDate))) {
                        return null;
                    }
                }

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

                                if (bookingAllowed && date.isAfter(today)) {
                                        LocalTime startTime = rule.getBookingStartTime();
                                        if (startTime != null) {
                                                bookingAllowed = false;
                                                unavailableReason = "Booking opens on " + date + " at " + startTime;
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

            String availableDaysStr = null;
            Integer bookingWindowDaysInt = null;

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

        private LocalDate[] resolveFacilityDateWindow(FacilityRule rule) {
                LocalDate availableFromDate = rule.getFacilityAvailableFromDate();
                LocalDate availableToDate = rule.getFacilityAvailableToDate();

                if ((availableFromDate == null || availableToDate == null)
                                && rule.getRulesJson() != null && !rule.getRulesJson().isBlank()) {
                        try {
                                JsonNode rulesNode = objectMapper.readTree(rule.getRulesJson());

                                LocalDate jsonFrom = firstDate(rulesNode,
                                                "facilityAvailableFromDate",
                                                "facilityAvailableDateFrom",
                                                "availableFromDate",
                                                "availableFrom",
                                                "startDate");
                                LocalDate jsonTo = firstDate(rulesNode,
                                                "facilityAvailableToDate",
                                                "facilityAvailableDateTo",
                                                "availableToDate",
                                                "availableTo",
                                                "endDate");
                                LocalDate singleDate = firstDate(rulesNode,
                                                "facilityAvailableDate",
                                                "availableDate",
                                                "date");

                                if (availableFromDate == null) {
                                        availableFromDate = jsonFrom;
                                }
                                if (availableToDate == null) {
                                        availableToDate = jsonTo;
                                }
                                if (availableFromDate == null && availableToDate == null && singleDate != null) {
                                        availableFromDate = singleDate;
                                        availableToDate = singleDate;
                                }
                        } catch (Exception ignored) {
                                // Ignore malformed rules_json and fall back to typed columns only.
                        }
                }

                if (availableFromDate == null && availableToDate != null) {
                        availableFromDate = availableToDate;
                }
                if (availableToDate == null && availableFromDate != null) {
                        availableToDate = availableFromDate;
                }

                return new LocalDate[]{availableFromDate, availableToDate};
        }

        private LocalDate firstDate(JsonNode node, String... keys) {
                JsonNode rulesNode = node.has("rules") && node.get("rules").isObject() ? node.get("rules") : null;
                for (String key : keys) {
                        if (node.hasNonNull(key)) {
                                LocalDate parsed = parseFlexibleDate(node.get(key).asText(null));
                                if (parsed != null) {
                                        return parsed;
                                }
                        }

                        if (rulesNode != null && rulesNode.hasNonNull(key)) {
                                LocalDate parsed = parseFlexibleDate(rulesNode.get(key).asText(null));
                                if (parsed != null) {
                                        return parsed;
                                }
                        }
                }
                return null;
        }

        private LocalDate parseFlexibleDate(String value) {
                if (value == null || value.isBlank()) {
                        return null;
                }
                String trimmed = value.trim();
                try {
                        return LocalDate.parse(trimmed);
                } catch (Exception ignored) {
                        // Try ISO date-time by taking the date part.
                }
                if (trimmed.length() >= 10) {
                        try {
                                return LocalDate.parse(trimmed.substring(0, 10));
                        } catch (Exception ignored) {
                                return null;
                        }
                }
                return null;
        }
}
