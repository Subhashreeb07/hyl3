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

    private LocalTime reminderTime;

    @Column(nullable = false)
    private Boolean qrRequired = false;

    @Column(nullable = false)
    private Boolean allowCancellation = true;

    private Integer maximumCapacity;

    @Column(nullable = false)
    private Boolean regularCommuteEnabled = false;

    // Comma-separated days: MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY
    // NULL = available every day
    @Column(name = "available_days")
    private String availableDays;

    // Number of days in advance employees can book (e.g., 10 = can book up to 10 days from today)
    // NULL = unlimited booking window
    @Column(name = "booking_window_days")
    private Integer bookingWindowDays;
// Date range for facility availability
    // NULL = available for all dates
    @Column(name = "facility_available_from_date")
    private LocalDate facilityAvailableFromDate;

    @Column(name = "facility_available_to_date")
    private LocalDate facilityAvailableToDate;

    
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

    public String getAvailableDays() {
        return availableDays;
    }

    public void setAvailableDays(String availableDays) {
        this.availableDays = availableDays;
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

    public Integer getBookingWindowDays() {
        return bookingWindowDays;
    }

    public void setBookingWindowDays(Integer bookingWindowDays) {
        this.bookingWindowDays = bookingWindowDays;
    }
}
