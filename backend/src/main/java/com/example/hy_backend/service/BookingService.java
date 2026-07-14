package com.example.hy_backend.service;

import com.example.hy_backend.dto.BookingDtos;

import java.util.List;

public interface BookingService {
    BookingDtos.SubmitBookingResponse submitBooking(BookingDtos.SubmitBookingRequest request);

    List<BookingDtos.BookingHistoryItem> getBookingHistory(String employeeId);

    BookingDtos.BookingPreferenceResponse getBookingPreferences(String employeeId, Long facilityId);

    BookingDtos.BookingDetail getBookingDetail(Long bookingId);

    void cancelBooking(Long bookingId);

    List<BookingDtos.AdminBookingSearchItem> searchBookings(Long facilityId, String employeeId, String status, String bookingDate);

    BookingDtos.BookingSummaryResponse getBookingSummary(Long facilityId, String bookingDate);
}
