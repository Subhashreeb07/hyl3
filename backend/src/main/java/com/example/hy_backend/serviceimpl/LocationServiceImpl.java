package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.LocationDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.FacilityLocationStat;
import com.example.hy_backend.model.OfficeLocation;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.FacilityLocationStatRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.OfficeLocationRepository;
import com.example.hy_backend.service.LocationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class LocationServiceImpl implements LocationService {

    private final OfficeLocationRepository locationRepository;
    private final FacilityLocationStatRepository statRepository;
    private final FacilityRepository facilityRepository;
    private final BookingRepository bookingRepository;

    public LocationServiceImpl(
            OfficeLocationRepository locationRepository,
            FacilityLocationStatRepository statRepository,
            FacilityRepository facilityRepository,
            BookingRepository bookingRepository
    ) {
        this.locationRepository = locationRepository;
        this.statRepository = statRepository;
        this.facilityRepository = facilityRepository;
        this.bookingRepository = bookingRepository;
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
                .filter(f -> Boolean.TRUE.equals(f.getStatus()) && Boolean.TRUE.equals(f.getPublished()))
                .map(facility -> {
                    var stat = statRepository.findByFacilityIdAndLocationIdAndBookingDate(
                            facility.getFacilityId(), locationId, date);
                    int requested = stat.map(FacilityLocationStat::getTotalRequested).orElse(0);
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
                .filter(row -> row.totalRequested() > 0 || row.acknowledged() > 0)
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

        long activeFacilities = facilityRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getStatus()) && Boolean.TRUE.equals(f.getPublished()))
                .count();

        long totalBookings = bookingRepository.count();
        long completedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getBookingDate().equals(date))
                .count();

        // Build 5-day strip centred on the chosen date
        List<LocationDtos.DateEventCount> strip = new ArrayList<>();
        for (int offset = -2; offset <= 2; offset++) {
            LocalDate d = date.plusDays(offset);
            long count = bookingRepository.findAll().stream()
                    .filter(b -> b.getBookingDate().equals(d))
                    .count();
            String dayLabel = d.getDayOfWeek()
                    .getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            strip.add(new LocationDtos.DateEventCount(d.toString(), dayLabel, count));
        }

        return new LocationDtos.DashboardStatsResponse(
                activeFacilities,
                totalBookings,
                completedBookings,
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
}
