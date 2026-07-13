package com.example.hy_backend.repository;

import com.example.hy_backend.model.FacilityLocationStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FacilityLocationStatRepository extends JpaRepository<FacilityLocationStat, Long> {

    Optional<FacilityLocationStat> findByFacilityIdAndLocationIdAndBookingDate(
            Long facilityId, Long locationId, LocalDate bookingDate);

    List<FacilityLocationStat> findByLocationIdAndBookingDate(Long locationId, LocalDate bookingDate);

    List<FacilityLocationStat> findByLocationId(Long locationId);

    void deleteByFacilityId(Long facilityId);
}
