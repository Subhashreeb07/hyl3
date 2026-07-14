package com.example.hy_backend.controller;

import com.example.hy_backend.dto.BookingDtos;
import com.example.hy_backend.dto.CommonDtos;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.example.hy_backend.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@Tag(name = "Booking", description = "Booking submission and management APIs")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
        @Operation(
            summary = "Submit booking",
            responses = {
                @ApiResponse(responseCode = "200", description = "Booking submitted"),
                @ApiResponse(responseCode = "400", description = "Validation failed")
            }
        )
    public ResponseEntity<BookingDtos.SubmitBookingResponse> submitBooking(
            @Valid @RequestBody
            @io.swagger.v3.oas.annotations.parameters.RequestBody(
                required = true,
                content = @Content(
                    schema = @Schema(implementation = BookingDtos.SubmitBookingRequest.class)
                )
            ) BookingDtos.SubmitBookingRequest request
    ) {
        return ResponseEntity.ok(bookingService.submitBooking(request));
    }


    @GetMapping("/history/{employeeId}")
    @Operation(summary = "Get booking history by employee")
    public ResponseEntity<List<BookingDtos.BookingHistoryItem>> getHistory(@PathVariable String employeeId) {
        return ResponseEntity.ok(bookingService.getBookingHistory(employeeId));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get employee majority preferences for a facility")
    public ResponseEntity<BookingDtos.BookingPreferenceResponse> getBookingPreferences(
            @RequestParam String employeeId,
            @RequestParam Long facilityId
    ) {
        return ResponseEntity.ok(bookingService.getBookingPreferences(employeeId, facilityId));
    }

    @GetMapping("/admin/search")
    @Operation(summary = "Admin search bookings")
    public ResponseEntity<List<BookingDtos.AdminBookingSearchItem>> searchBookings(
            @RequestParam(required = false) Long facilityId,
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String bookingDate
    ) {
        return ResponseEntity.ok(bookingService.searchBookings(facilityId, employeeId, status, bookingDate));
    }

    @GetMapping("/admin/summary")
    @Operation(summary = "Admin booking summary by facility/date")
    public ResponseEntity<BookingDtos.BookingSummaryResponse> bookingSummary(
            @RequestParam Long facilityId,
            @RequestParam(required = false) String bookingDate
    ) {
        return ResponseEntity.ok(bookingService.getBookingSummary(facilityId, bookingDate));
    }

    @GetMapping("/{bookingId}")
    @Operation(summary = "Get booking details")
    public ResponseEntity<BookingDtos.BookingDetail> getBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(bookingService.getBookingDetail(bookingId));
    }

    @DeleteMapping("/{bookingId}")
    @Operation(
            summary = "Cancel booking",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Booking cancelled"),
                    @ApiResponse(responseCode = "404", description = "Booking not found")
            }
    )
    public ResponseEntity<CommonDtos.MessageResponse> cancelBooking(@PathVariable Long bookingId) {
        bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(new CommonDtos.MessageResponse("Booking cancelled successfully"));
    }
}
