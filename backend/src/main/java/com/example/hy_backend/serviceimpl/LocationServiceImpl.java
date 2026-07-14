package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.LocationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Employee;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityLocationStat;
import com.example.hy_backend.model.OfficeLocation;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.EmployeeRepository;
import com.example.hy_backend.repository.FacilityLocationStatRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.repository.OfficeLocationRepository;
import com.example.hy_backend.service.LocationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LocationServiceImpl implements LocationService {

    private final OfficeLocationRepository locationRepository;
    private final FacilityLocationStatRepository statRepository;
    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;
    private final EmployeeRepository employeeRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final ObjectMapper objectMapper;

    public LocationServiceImpl(
            OfficeLocationRepository locationRepository,
            FacilityLocationStatRepository statRepository,
            FacilityRepository facilityRepository,
            BookingRepository bookingRepository,
            EmployeeRepository employeeRepository,
            FacilityRuleRepository facilityRuleRepository,
            ObjectMapper objectMapper
    ) {
        this.locationRepository = locationRepository;
        this.statRepository = statRepository;
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
        this.employeeRepository = employeeRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public List<LocationDtos.LocationResponse> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public LocationDtos.LocationResponse createLocation(LocationDtos.LocationCreateRequest request) {
        String name = request.locationName().trim();
        if (locationRepository.existsByLocationNameIgnoreCase(name)) {
            throw new BadRequestException("Location '" + name + "' already exists.");
        }
        OfficeLocation loc = new OfficeLocation();
        loc.setLocationName(name);
        loc.setEmployeeCount(0);
        return toResponse(locationRepository.save(loc));
    }

    @Override
    @Transactional
    public LocationDtos.LocationResponse updateEmployeeCount(Long locationId, LocationDtos.LocationUpdateCountRequest request) {
        OfficeLocation loc = getOrThrow(locationId);
        loc.setEmployeeCount(request.employeeCount());
        return toResponse(locationRepository.save(loc));
    }

    @Override
    @Transactional
    public void deleteLocation(Long locationId) {
        OfficeLocation loc = getOrThrow(locationId);
        locationRepository.delete(loc);
    }

    @Override
    public LocationDtos.LocationStatsResponse getLocationStats(Long locationId, String dateStr) {
        OfficeLocation loc = getOrThrow(locationId);
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();

        List<LocationDtos.FacilityStatRow> rows = facilityRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getPublished()))
                .filter(f -> facilityMatchesLocation(f, loc.getLocationName()))
                .map(facility -> {
                    int requested = countEligibleEmployees(facility, loc);
                    int acknowledged = (int) bookingRepository.countByFacilityDateStatusAndOfficeLocation(
                            facility.getFacilityId(), date,
                            com.example.hy_backend.model.BookingStatus.CONFIRMED,
                            loc.getLocationName());
                    return new LocationDtos.FacilityStatRow(
                            facility.getFacilityId(),
                            facility.getFacilityName(),
                            facility.getCategory(),
                            requested,
                            acknowledged
                    );
                })
                .toList();

        return new LocationDtos.LocationStatsResponse(
                locationId,
                loc.getLocationName(),
                date.toString(),
                rows
        );
    }

    @Override
    public LocationDtos.DashboardStatsResponse getDashboardStats(String dateStr) {
        LocalDate date = dateStr != null ? LocalDate.parse(dateStr) : LocalDate.now();



        long totalBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().equals(date))
                .count();

        long pendingRequests = statRepository.findAll().stream()
                .filter(s -> s.getBookingDate().equals(date))
                .mapToLong(s -> (long) s.getTotalRequested() - s.getAcknowledged())
                .sum();

        // Build 5-day strip: events = published facilities active on each date
        List<LocationDtos.DateEventCount> strip = new ArrayList<>();
        List<Facility> publishedFacilities = facilityRepository.findByPublishedTrue();
        for (int offset = -2; offset <= 2; offset++) {
            LocalDate d = date.plusDays(offset);
            long count = publishedFacilities.stream()
                    .filter(f -> isFacilityActiveOnDate(f, d))
                    .count();
            String dayLabel = d.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            strip.add(new LocationDtos.DateEventCount(d.toString(), dayLabel, count));
        }

        return new LocationDtos.DashboardStatsResponse(
                totalBookings,
                pendingRequests,
                "06:00 PM",          // placeholder; extend with FacilityRule lookup if needed
                strip
        );
    }

    @Override
    @Transactional
    public void incrementRequested(Long facilityId, Long locationId, String bookingDateStr) {
        LocalDate date = bookingDateStr != null ? LocalDate.parse(bookingDateStr) : LocalDate.now();
        FacilityLocationStat stat = statRepository
                .findByFacilityIdAndLocationIdAndBookingDate(facilityId, locationId, date)
                .orElseGet(() -> {
                    FacilityLocationStat s = new FacilityLocationStat();
                    s.setFacilityId(facilityId);
                    s.setLocationId(locationId);
                    s.setBookingDate(date);
                    return s;
                });
        stat.setTotalRequested(stat.getTotalRequested() + 1);
        statRepository.save(stat);
    }

    @Override
    @Transactional
    public void incrementAcknowledged(Long facilityId, Long locationId, String bookingDateStr) {
        LocalDate date = bookingDateStr != null ? LocalDate.parse(bookingDateStr) : LocalDate.now();
        FacilityLocationStat stat = statRepository
                .findByFacilityIdAndLocationIdAndBookingDate(facilityId, locationId, date)
                .orElseGet(() -> {
                    FacilityLocationStat s = new FacilityLocationStat();
                    s.setFacilityId(facilityId);
                    s.setLocationId(locationId);
                    s.setBookingDate(date);
                    return s;
                });
        stat.setAcknowledged(stat.getAcknowledged() + 1);
        statRepository.save(stat);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private OfficeLocation getOrThrow(Long id) {
        return locationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Office location not found: " + id));
    }

    private LocationDtos.LocationResponse toResponse(OfficeLocation loc) {
        return new LocationDtos.LocationResponse(
                loc.getId(),
                loc.getLocationName(),
                loc.getEmployeeCount(),
                loc.getCreatedAt() != null ? loc.getCreatedAt().toString() : null
        );
    }

    /**
     * Counts employees at the given location who are eligible for the facility
     * based on the facility's employee-type and role restrictions in rulesJson.
     * <p>
     * ADMIN employees are always excluded from the count.
     * If no restrictions are configured, all non-admin employees at the location count.
     */
    /**
     * Counts non-admin employees at the location eligible for this facility.
     * {@code rulesJson.employeeTypes} = comma-separated work-mode labels; empty = no restriction.
     * {@code rulesJson.roles}         = comma-separated role labels; empty = no restriction.
     */
    private int countEligibleEmployees(Facility facility, OfficeLocation loc) {
        List<Employee> employees = employeeRepository
                .findByOfficeLocationIgnoreCase(loc.getLocationName())
                .stream()
                .filter(e -> !"ADMIN".equalsIgnoreCase(e.getRoleCode()))
                .toList();

        if (employees.isEmpty()) return 0;

        var rule = facilityRuleRepository.findByFacilityFacilityId(facility.getFacilityId()).orElse(null);
        if (rule == null || rule.getRulesJson() == null || rule.getRulesJson().isBlank()) {
            return employees.size();
        }

        try {
            JsonNode rn = objectMapper.readTree(rule.getRulesJson());

            String empTypes = rn.has("employeeTypes") ? rn.get("employeeTypes").asText("").trim() : "";
            String roles    = rn.has("roles")         ? rn.get("roles").asText("").trim()         : "";

            Set<String> typeSet = empTypes.isBlank() ? null :
                    Arrays.stream(empTypes.split(",")).map(String::trim)
                          .filter(s -> !s.isEmpty()).collect(Collectors.toSet());

            Set<String> roleSet = roles.isBlank() ? null :
                    Arrays.stream(roles.split(",")).map(String::trim)
                          .filter(s -> !s.isEmpty()).collect(Collectors.toSet());

            return (int) employees.stream().filter(e -> {
                if (typeSet != null && !typeSet.contains(workModeToLabel(e.getWorkMode()))) return false;
                if (roleSet != null) {
                    String rc = e.getRoleCode() == null ? "" : e.getRoleCode().trim().toUpperCase(Locale.ROOT);
                    if ("EMPLOYEE".equals(rc)) return roleSet.size() >= 10;
                    if (!roleSet.contains(roleCodeToLabel(rc))) return false;
                }
                return true;
            }).count();
        } catch (Exception ignored) {
            return employees.size();
        }
    }

    private String workModeToLabel(String workMode) {
        if (workMode == null) return "Hybrid";
        return switch (workMode.trim().toUpperCase(Locale.ROOT)) {
            case "ON_SITE", "ONSITE" -> "On-site";
            case "REMOTE"            -> "Remote";
            default                  -> "Hybrid";
        };
    }

    private String roleCodeToLabel(String roleCode) {
        if (roleCode == null) return "";
        return switch (roleCode.trim().toUpperCase(Locale.ROOT)) {
            case "MANAGER"   -> "Manager";
            case "FINANCE"   -> "Finance";
            case "CLOUD"     -> "Cloud";
            case "DIRECTOR"  -> "Director";
            case "OPS"       -> "Ops";
            case "DEVOPS"    -> "Devops";
            default          -> roleCode.trim().toUpperCase(Locale.ROOT);
        };
    }

    /** True if facility's availability window includes the given date (no window = always active). */
    private boolean isFacilityActiveOnDate(Facility f, LocalDate d) {
        var rule = f.getRule();
        if (rule == null) return true;
        java.time.LocalDate from = rule.getFacilityAvailableFromDate();
        java.time.LocalDate to   = rule.getFacilityAvailableToDate();
        if (from != null && d.isBefore(from)) return false;
        if (to   != null && d.isAfter(to))   return false;
        return true;
    }

    /** True if facility targets this location (empty targetLocations = available everywhere). */
    private boolean facilityMatchesLocation(Facility f, String locationName) {
        String raw = f.getTargetLocations();
        if (raw == null || raw.isBlank()) return true;
        for (String part : raw.split(",")) {
            if (part.trim().equalsIgnoreCase(locationName)) return true;
        }
        return false;
    }
}
