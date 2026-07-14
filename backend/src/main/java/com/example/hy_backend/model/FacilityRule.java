package com.example.hy_backend.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "facility_rules")
public class FacilityRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facility_id", nullable = false, unique = true)
    private Facility facility;

    private LocalTime bookingDeadline;

    private LocalTime bookingStartTime;

    @Column(name = "facility_available_from_date")
    private LocalDate facilityAvailableFromDate;

    @Column(name = "facility_available_to_date")
    private LocalDate facilityAvailableToDate;

    @Column(name = "rules_json", columnDefinition = "TEXT")
    private String rulesJson;

    public Long getRuleId() {
        return ruleId;
    }

    public void setRuleId(Long ruleId) {
        this.ruleId = ruleId;
    }

    public Facility getFacility() {
        return facility;
    }

    public void setFacility(Facility facility) {
        this.facility = facility;
    }

    public LocalTime getBookingDeadline() {
        return bookingDeadline;
    }

    public void setBookingDeadline(LocalTime bookingDeadline) {
        this.bookingDeadline = bookingDeadline;
    }

    public LocalTime getBookingStartTime() {
        return bookingStartTime;
    }

    public void setBookingStartTime(LocalTime bookingStartTime) {
        this.bookingStartTime = bookingStartTime;
    }

    public String getRulesJson() {
        return rulesJson;
    }

    public void setRulesJson(String rulesJson) {
        this.rulesJson = rulesJson;
    }

    public LocalDate getFacilityAvailableFromDate() {
        return facilityAvailableFromDate;
    }

    public void setFacilityAvailableFromDate(LocalDate facilityAvailableFromDate) {
        this.facilityAvailableFromDate = facilityAvailableFromDate;
    }

    public LocalDate getFacilityAvailableToDate() {
        return facilityAvailableToDate;
    }

    public void setFacilityAvailableToDate(LocalDate facilityAvailableToDate) {
        this.facilityAvailableToDate = facilityAvailableToDate;
    }
}
