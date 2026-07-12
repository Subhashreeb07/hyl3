package com.example.hy_backend.repository;

import com.example.hy_backend.model.OfficeLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OfficeLocationRepository extends JpaRepository<OfficeLocation, Long> {
    Optional<OfficeLocation> findByLocationNameIgnoreCase(String locationName);
    boolean existsByLocationNameIgnoreCase(String locationName);
}
