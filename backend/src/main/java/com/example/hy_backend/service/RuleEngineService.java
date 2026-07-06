package com.example.hy_backend.service;

import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;

import java.time.LocalDate;

public interface RuleEngineService {
    void validateBookingCreation(Facility facility, FacilityRule rule, String employeeId, LocalDate bookingDate);

    void validateBookingCancellation(Booking booking, FacilityRule rule);

    String generateQrCodeIfRequired(FacilityRule rule, Booking booking);

    boolean isQrCodeValid(String qrCode, Booking booking);
}
