package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.model.Booking;
import com.example.hy_backend.model.BookingStatus;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.service.RuleEngineService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class RuleEngineServiceImpl implements RuleEngineService {

    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;
    private final Clock clock = Clock.systemDefaultZone();

    public RuleEngineServiceImpl(BookingRepository bookingRepository, ObjectMapper objectMapper) {
        this.bookingRepository = bookingRepository;
        this.objectMapper = objectMapper;
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

        validateFacilityDateWindow(rule, bookingDate);

        LocalDate today = LocalDate.now(clock);
        validateBookingWindowForDate(rule, bookingDate, today, LocalTime.now(clock));
    }

    @Override
    public void validateBookingCancellation(Booking booking, FacilityRule rule) {
        if (rule == null) {
            return;
        }

        LocalDate today = LocalDate.now(clock);
        if (booking.getBookingDate().isBefore(today)) {
            throw new BadRequestException("Past bookings cannot be cancelled");
        }

        if (booking.getBookingDate().equals(today) && rule.getBookingDeadline() != null && LocalTime.now(clock).isAfter(rule.getBookingDeadline())) {
            throw new BadRequestException("Cancellation deadline has passed for today");
        }
    }



    private void validateBookingWindow(FacilityRule rule, LocalTime now) {
        if (rule.getBookingStartTime() != null && now.isBefore(rule.getBookingStartTime())) {
            throw new BadRequestException("Booking window has not started yet");
        }

        if (rule.getBookingDeadline() != null && now.isAfter(rule.getBookingDeadline())) {
            throw new BadRequestException("Booking deadline has passed for today");
        }
    }

    private void validateBookingWindowForDate(FacilityRule rule, LocalDate bookingDate, LocalDate today, LocalTime now) {
        LocalTime start = rule.getBookingStartTime();

        if (bookingDate.isAfter(today)) {
            if (start != null) {
                throw new BadRequestException(
                        "Booking for " + bookingDate + " opens at " + start + " on that date"
                );
            }
            return;
        }

        if (bookingDate.equals(today)) {
            validateBookingWindow(rule, now);
        }
    }

    private void validateFacilityDateWindow(FacilityRule rule, LocalDate bookingDate) {
        LocalDate[] window = resolveFacilityDateWindow(rule);
        LocalDate availableFrom = window[0];
        LocalDate availableTo = window[1];

        if (availableFrom == null && availableTo == null) {
            return;
        }

        if (availableFrom == null) {
            availableFrom = availableTo;
        }
        if (availableTo == null) {
            availableTo = availableFrom;
        }

        if (bookingDate.isBefore(availableFrom) || bookingDate.isAfter(availableTo)) {
            throw new BadRequestException(
                    "Facility is accessible only from " + availableFrom + " to " + availableTo
            );
        }
    }

    private LocalDate[] resolveFacilityDateWindow(FacilityRule rule) {
        LocalDate availableFromDate = rule.getFacilityAvailableFromDate();
        LocalDate availableToDate = rule.getFacilityAvailableToDate();

        if ((availableFromDate == null || availableToDate == null)
                && rule.getRulesJson() != null && !rule.getRulesJson().isBlank()) {
            try {
                JsonNode rulesNode = objectMapper.readTree(rule.getRulesJson());

                LocalDate jsonFrom = firstDate(rulesNode,
                        "facilityAvailableFromDate",
                        "facilityAvailableDateFrom",
                        "availableFromDate",
                        "availableFrom",
                        "startDate");
                LocalDate jsonTo = firstDate(rulesNode,
                        "facilityAvailableToDate",
                        "facilityAvailableDateTo",
                        "availableToDate",
                        "availableTo",
                        "endDate");
                LocalDate singleDate = firstDate(rulesNode,
                        "facilityAvailableDate",
                        "availableDate",
                        "date");

                if (availableFromDate == null) {
                    availableFromDate = jsonFrom;
                }
                if (availableToDate == null) {
                    availableToDate = jsonTo;
                }
                if (availableFromDate == null && availableToDate == null && singleDate != null) {
                    availableFromDate = singleDate;
                    availableToDate = singleDate;
                }
            } catch (Exception ignored) {
                // Ignore malformed rules_json and fall back to typed columns only.
            }
        }

        if (availableFromDate == null && availableToDate != null) {
            availableFromDate = availableToDate;
        }
        if (availableToDate == null && availableFromDate != null) {
            availableToDate = availableFromDate;
        }

        return new LocalDate[]{availableFromDate, availableToDate};
    }

    private LocalDate firstDate(JsonNode node, String... keys) {
        JsonNode rulesNode = node.has("rules") && node.get("rules").isObject() ? node.get("rules") : null;
        for (String key : keys) {
            if (node.hasNonNull(key)) {
                LocalDate parsed = parseFlexibleDate(node.get(key).asText(null));
                if (parsed != null) {
                    return parsed;
                }
            }

            if (rulesNode != null && rulesNode.hasNonNull(key)) {
                LocalDate parsed = parseFlexibleDate(rulesNode.get(key).asText(null));
                if (parsed != null) {
                    return parsed;
                }
            }
        }
        return null;
    }

    private LocalDate parseFlexibleDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        try {
            return LocalDate.parse(trimmed);
        } catch (Exception ignored) {
            // Try ISO date-time by taking the date part.
        }
        if (trimmed.length() >= 10) {
            try {
                return LocalDate.parse(trimmed.substring(0, 10));
            } catch (Exception ignored) {
                return null;
            }
        }
        return null;
    }


}
