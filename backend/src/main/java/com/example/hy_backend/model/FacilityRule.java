package com.example.hy_backend.model;

import jakarta.persistence.*;
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

    private LocalTime reminderTime;

    @Column(nullable = false)
    private Boolean qrRequired = false;

    @Column(nullable = false)
    private Boolean allowCancellation = true;

    private Integer maximumCapacity;

    @Column(nullable = false)
    private Boolean regularCommuteEnabled = false;

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

    public LocalTime getReminderTime() {
        return reminderTime;
    }

    public void setReminderTime(LocalTime reminderTime) {
        this.reminderTime = reminderTime;
    }

    public LocalTime getBookingStartTime() {
        return bookingStartTime;
    }

    public void setBookingStartTime(LocalTime bookingStartTime) {
        this.bookingStartTime = bookingStartTime;
    }

    public Boolean getQrRequired() {
        return qrRequired;
    }

    public void setQrRequired(Boolean qrRequired) {
        this.qrRequired = qrRequired;
    }

    public Boolean getAllowCancellation() {
        return allowCancellation;
    }

    public void setAllowCancellation(Boolean allowCancellation) {
        this.allowCancellation = allowCancellation;
    }

    public Integer getMaximumCapacity() {
        return maximumCapacity;
    }

    public void setMaximumCapacity(Integer maximumCapacity) {
        this.maximumCapacity = maximumCapacity;
    }

    public Boolean getRegularCommuteEnabled() {
        return regularCommuteEnabled;
    }

    public void setRegularCommuteEnabled(Boolean regularCommuteEnabled) {
        this.regularCommuteEnabled = regularCommuteEnabled;
    }
}
