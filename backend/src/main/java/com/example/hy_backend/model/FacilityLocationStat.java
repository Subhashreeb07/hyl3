package com.example.hy_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "facility_location_stats",
       uniqueConstraints = @UniqueConstraint(
               name = "uq_fac_loc_date",
               columnNames = {"facility_id", "location_id", "booking_date"}))
public class FacilityLocationStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "facility_id", nullable = false)
    private Long facilityId;

    @Column(name = "location_id", nullable = false)
    private Long locationId;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "total_requested", nullable = false)
    private Integer totalRequested = 0;

    @Column(name = "acknowledged", nullable = false)
    private Integer acknowledged = 0;

    public Long getId() { return id; }
    public Long getFacilityId() { return facilityId; }
    public void setFacilityId(Long facilityId) { this.facilityId = facilityId; }
    public Long getLocationId() { return locationId; }
    public void setLocationId(Long locationId) { this.locationId = locationId; }
    public LocalDate getBookingDate() { return bookingDate; }
    public void setBookingDate(LocalDate bookingDate) { this.bookingDate = bookingDate; }
    public Integer getTotalRequested() { return totalRequested; }
    public void setTotalRequested(Integer totalRequested) { this.totalRequested = totalRequested; }
    public Integer getAcknowledged() { return acknowledged; }
    public void setAcknowledged(Integer acknowledged) { this.acknowledged = acknowledged; }
}
