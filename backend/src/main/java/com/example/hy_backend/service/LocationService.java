package com.example.hy_backend.service;

import com.example.hy_backend.dto.LocationDtos;
import java.util.List;

public interface LocationService {
    List<LocationDtos.LocationResponse> getAllLocations();
    LocationDtos.LocationResponse createLocation(LocationDtos.LocationCreateRequest request);
    LocationDtos.LocationResponse updateEmployeeCount(Long locationId, LocationDtos.LocationUpdateCountRequest request);
    void deleteLocation(Long locationId);
    LocationDtos.LocationStatsResponse getLocationStats(Long locationId, String date);
    LocationDtos.DashboardStatsResponse getDashboardStats(String date);
    void incrementRequested(Long facilityId, Long locationId, String bookingDate);
    void incrementAcknowledged(Long facilityId, Long locationId, String bookingDate);
}
