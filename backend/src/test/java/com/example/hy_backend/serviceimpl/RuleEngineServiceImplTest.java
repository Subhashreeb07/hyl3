package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@ExtendWith(MockitoExtension.class)
class RuleEngineServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    private RuleEngineServiceImpl ruleEngineService;

    @BeforeEach
    void setUp() {
        ruleEngineService = new RuleEngineServiceImpl(bookingRepository, "unit-test-qr-secret");
    }

    @Test
    void generateQrCodeIfRequired_shouldGenerateSignedQrAndValidate() {
        FacilityRule rule = new FacilityRule();
        rule.setQrRequired(true);

        Booking booking = new Booking();
        booking.setBookingId(10L);
        booking.setEmployeeId("EMP001");
        booking.setBookingDate(LocalDate.of(2026, 7, 8));
        Facility facility = new Facility();
        facility.setFacilityId(3L);
        booking.setFacility(facility);

        String qrCode = ruleEngineService.generateQrCodeIfRequired(rule, booking);

        assertNotNull(qrCode);
        assertTrue(qrCode.startsWith("HYQR.v1.10."));
        assertTrue(ruleEngineService.isQrCodeValid(qrCode, booking));
    }

    @Test
    void isQrCodeValid_shouldFailForTamperedToken() {
        FacilityRule rule = new FacilityRule();
        rule.setQrRequired(true);

        Booking booking = new Booking();
        booking.setBookingId(11L);
        booking.setEmployeeId("EMP002");
        booking.setBookingDate(LocalDate.of(2026, 7, 9));
        Facility facility = new Facility();
        facility.setFacilityId(2L);
        booking.setFacility(facility);

        String qrCode = ruleEngineService.generateQrCodeIfRequired(rule, booking);
        assertNotNull(qrCode);

        String tampered = qrCode.substring(0, qrCode.length() - 1) + "A";
        assertFalse(ruleEngineService.isQrCodeValid(tampered, booking));
    }

    @Test
    void generateQrCodeIfRequired_shouldReturnNullWhenQrNotRequired() {
        FacilityRule rule = new FacilityRule();
        rule.setQrRequired(false);

        Booking booking = new Booking();
        booking.setBookingId(12L);

        String qrCode = ruleEngineService.generateQrCodeIfRequired(rule, booking);

        assertNull(qrCode);
    }
}
