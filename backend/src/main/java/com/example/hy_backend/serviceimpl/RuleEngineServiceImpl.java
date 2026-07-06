package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.service.RuleEngineService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Base64;
import java.util.Objects;
import java.util.UUID;

@Service
public class RuleEngineServiceImpl implements RuleEngineService {

    private static final String QR_PREFIX = "HYQR";
    private static final String QR_VERSION = "v1";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private final BookingRepository bookingRepository;
    private final Clock clock = Clock.systemDefaultZone();
    private final String qrSecret;

    public RuleEngineServiceImpl(
            BookingRepository bookingRepository,
            @Value("${app.qr.secret:hy-platform-qr-secret}") String qrSecret
    ) {
        this.bookingRepository = bookingRepository;
        this.qrSecret = qrSecret;
    }

    @Override
    public void validateBookingCreation(Facility facility, FacilityRule rule, String employeeId, LocalDate bookingDate) {
        if (bookingRepository.existsByEmployeeIdAndFacilityFacilityIdAndBookingDateAndStatus(
                employeeId,
                facility.getFacilityId(),
                bookingDate,
                BookingStatus.CONFIRMED
        )) {
            throw new BadRequestException("Booking already exists for this service on " + bookingDate);
        }

        if (rule == null) {
            return;
        }

        LocalDate today = LocalDate.now(clock);
        if (bookingDate.equals(today)) {
            validateBookingWindow(rule, LocalTime.now(clock));
        }

        if (rule.getMaximumCapacity() != null && rule.getMaximumCapacity() > 0) {
            long confirmed = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(
                    facility.getFacilityId(),
                    bookingDate,
                    BookingStatus.CONFIRMED
            );
            if (confirmed >= rule.getMaximumCapacity()) {
                throw new BadRequestException("Maximum capacity reached for this facility on " + bookingDate);
            }
        }
    }

    @Override
    public void validateBookingCancellation(Booking booking, FacilityRule rule) {
        if (rule == null) {
            return;
        }

        if (Boolean.FALSE.equals(rule.getAllowCancellation())) {
            throw new BadRequestException("Cancellation is not allowed for this facility");
        }

        LocalDate today = LocalDate.now(clock);
        if (booking.getBookingDate().isBefore(today)) {
            throw new BadRequestException("Past bookings cannot be cancelled");
        }

        if (booking.getBookingDate().equals(today) && rule.getBookingDeadline() != null && LocalTime.now(clock).isAfter(rule.getBookingDeadline())) {
            throw new BadRequestException("Cancellation deadline has passed for today");
        }
    }

    @Override
    public String generateQrCodeIfRequired(FacilityRule rule, Booking booking) {
        if (rule != null && Boolean.TRUE.equals(rule.getQrRequired()) && booking != null && booking.getBookingId() != null) {
            String nonce = UUID.randomUUID().toString().replace("-", "");
            String bookingId = String.valueOf(booking.getBookingId());
            String payload = buildPayload(booking, nonce);
            String signature = sign(payload);
            return QR_PREFIX + "." + QR_VERSION + "." + bookingId + "." + nonce + "." + signature;
        }
        return null;
    }

    @Override
    public boolean isQrCodeValid(String qrCode, Booking booking) {
        if (qrCode == null || qrCode.isBlank() || booking == null || booking.getBookingId() == null) {
            return false;
        }

        String[] parts = qrCode.split("\\.");
        if (parts.length != 5) {
            return false;
        }

        if (!QR_PREFIX.equals(parts[0]) || !QR_VERSION.equals(parts[1])) {
            return false;
        }

        if (!Objects.equals(parts[2], String.valueOf(booking.getBookingId()))) {
            return false;
        }

        String nonce = parts[3];
        String providedSignature = parts[4];
        String expectedSignature = sign(buildPayload(booking, nonce));

        return constantTimeEquals(providedSignature, expectedSignature);
    }

    private void validateBookingWindow(FacilityRule rule, LocalTime now) {
        if (rule.getBookingStartTime() != null && now.isBefore(rule.getBookingStartTime())) {
            throw new BadRequestException("Booking window has not started yet");
        }

        if (rule.getBookingDeadline() != null && now.isAfter(rule.getBookingDeadline())) {
            throw new BadRequestException("Booking deadline has passed for today");
        }
    }

    private String buildPayload(Booking booking, String nonce) {
        return booking.getBookingId() + "|"
                + booking.getFacility().getFacilityId() + "|"
                + booking.getEmployeeId() + "|"
                + booking.getBookingDate() + "|"
                + nonce;
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKeySpec = new SecretKeySpec(qrSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM);
            mac.init(secretKeySpec);
            byte[] digest = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to sign QR payload", ex);
        }
    }

    private boolean constantTimeEquals(String left, String right) {
        byte[] leftBytes = left.getBytes(StandardCharsets.UTF_8);
        byte[] rightBytes = right.getBytes(StandardCharsets.UTF_8);
        if (leftBytes.length != rightBytes.length) {
            return false;
        }

        int result = 0;
        for (int i = 0; i < leftBytes.length; i++) {
            result |= leftBytes[i] ^ rightBytes[i];
        }
        return result == 0;
    }
}
