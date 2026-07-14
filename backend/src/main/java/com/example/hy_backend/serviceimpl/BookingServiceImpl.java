package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.BookingDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.hy_backend.repository.BookingRepository;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FieldDefinitionRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.repository.OfficeLocationRepository;
import com.example.hy_backend.service.AuditService;
import com.example.hy_backend.service.BookingService;
import com.example.hy_backend.service.LocationService;
import com.example.hy_backend.service.RuleEngineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final FacilityRepository facilityRepository;
    private final FieldDefinitionRepository fieldDefinitionRepository;
    private final FacilityRuleRepository facilityRuleRepository;
    private final AuditService auditService;
    private final RuleEngineService ruleEngineService;
    private final LocationService locationService;
    private final OfficeLocationRepository officeLocationRepository;
    private final ObjectMapper objectMapper;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            FacilityRepository facilityRepository,
            FieldDefinitionRepository fieldDefinitionRepository,
            FacilityRuleRepository facilityRuleRepository,
            AuditService auditService,
            RuleEngineService ruleEngineService,
            LocationService locationService,
            OfficeLocationRepository officeLocationRepository,
            ObjectMapper objectMapper
    ) {
        this.bookingRepository = bookingRepository;
        this.facilityRepository = facilityRepository;
        this.fieldDefinitionRepository = fieldDefinitionRepository;
        this.facilityRuleRepository = facilityRuleRepository;
        this.auditService = auditService;
        this.ruleEngineService = ruleEngineService;
        this.locationService = locationService;
        this.officeLocationRepository = officeLocationRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public BookingDtos.SubmitBookingResponse submitBooking(BookingDtos.SubmitBookingRequest request) {
        String normalizedEmployeeId = request.employeeId().trim().toUpperCase(Locale.ROOT);

        Facility facility = facilityRepository.findById(request.facilityId())
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + request.facilityId()));

        if (!Boolean.TRUE.equals(facility.getPublished())) {
            throw new BadRequestException("Facility is not available for booking");
        }

        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facility.getFacilityId()).orElse(null);
        LocalDate bookingDate = resolveBookingDate(request.bookingDate());
        ruleEngineService.validateBookingCreation(facility, rule, normalizedEmployeeId, bookingDate);

        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facility.getFacilityId());
        Map<Long, FieldDefinition> fieldMap = fields.stream().collect(
                HashMap::new,
                (map, field) -> map.put(field.getFieldId(), field),
                HashMap::putAll
        );

        Map<Long, String> responseMap = new HashMap<>();
        for (BookingDtos.BookingFieldInput input : request.responses()) {
            responseMap.put(input.fieldId(), input.value());
        }

        validateBookingResponses(fields, fieldMap, responseMap);

        Optional<Booking> existingForDay = bookingRepository
            .findFirstByEmployeeIdAndFacilityFacilityIdAndBookingDateAndStatusOrderByCreatedAtDesc(
                normalizedEmployeeId,
                facility.getFacilityId(),
                bookingDate,
                BookingStatus.CONFIRMED
            );

        if (existingForDay.isPresent()) {
            Booking existing = existingForDay.get();
            existing.setStatus(BookingStatus.CONFIRMED);
            existing.setCancelledAt(null);

            applyBookingResponses(existing, responseMap, fieldMap);

            Booking saved = bookingRepository.save(existing);

            auditService.logAction(
                saved.getEmployeeId(),
                "EMPLOYEE",
                "BOOKING_UPDATED",
                "Booking",
                String.valueOf(saved.getBookingId()),
                null,
                "{\"status\":\"CONFIRMED\",\"mode\":\"EDIT_SAME_DAY\"}",
                null
            );

            return new BookingDtos.SubmitBookingResponse(
                saved.getBookingId(),
                saved.getStatus().name(),
                saved.getBookingDate().toString(),
                saved.getCreatedAt().toString(),
                false,
                "Existing booking updated for this facility and date"
            );
        }

        Booking booking = new Booking();
        booking.setFacility(facility);
        booking.setEmployeeId(normalizedEmployeeId);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookingDate(bookingDate);

        applyBookingResponses(booking, responseMap, fieldMap);

        Booking saved = bookingRepository.save(booking);

        auditService.logAction(
            saved.getEmployeeId(),
            "EMPLOYEE",
            "BOOKING_CREATED",
            "Booking",
            String.valueOf(saved.getBookingId()),
            null,
            "{\"status\":\"CONFIRMED\"}",
            null
        );

        // ── Increment facility-location stat (best-effort, never fails the booking) ──
        try {
            com.example.hy_backend.model.Employee emp = saved.getEmployee();
            String officeLoc = (emp != null && emp.getOfficeLocation() != null)
                    ? emp.getOfficeLocation() : "HYDERABAD";
            final long facId    = saved.getFacility().getFacilityId();
            final String bdStr  = saved.getBookingDate().toString();
            officeLocationRepository.findByLocationNameIgnoreCase(officeLoc)
                    .ifPresent(loc -> {
                        locationService.incrementRequested(facId, loc.getId(), bdStr);
                    });
        } catch (Exception ignored) {
            // stat tracking is non-critical; do not fail the booking
        }

        return new BookingDtos.SubmitBookingResponse(
                saved.getBookingId(),
                saved.getStatus().name(),
                saved.getBookingDate().toString(),
                saved.getCreatedAt().toString(),
                false,
                "Booking submitted successfully"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDtos.BookingHistoryItem> getBookingHistory(String employeeId) {
        return bookingRepository.findByEmployeeIdOrderByCreatedAtDesc(employeeId.trim().toUpperCase(Locale.ROOT)).stream()
                .filter(booking -> isFacilityVisible(booking.getFacility()))
                .map(booking -> new BookingDtos.BookingHistoryItem(
                        booking.getBookingId(),
                        booking.getFacility().getFacilityName(),
                    booking.getStatus().name(),
                    booking.getBookingDate().toString()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDtos.BookingPreferenceResponse getBookingPreferences(String employeeId, Long facilityId) {
        if (employeeId == null || employeeId.isBlank()) {
            throw new BadRequestException("employeeId is required");
        }
        if (facilityId == null) {
            throw new BadRequestException("facilityId is required");
        }

        String normalizedEmployeeId = employeeId.trim().toUpperCase(Locale.ROOT);

        List<Booking> bookings = bookingRepository.findByEmployeeIdAndFacilityFacilityIdAndStatusOrderByCreatedAtDesc(
                normalizedEmployeeId,
                facilityId,
                BookingStatus.CONFIRMED
        );

        Map<Long, Map<String, Long>> fieldValueVotes = new HashMap<>();
        Map<Long, String> fieldLabels = new HashMap<>();

        for (Booking booking : bookings) {
            List<BookingDtos.BookingAnswer> answers = parseBookingAnswers(booking.getBookingResponse());
            for (BookingDtos.BookingAnswer answer : answers) {
                if (answer == null || answer.fieldId() == null) {
                    continue;
                }
                String value = answer.value() == null ? "" : answer.value().trim();
                if (value.isEmpty()) {
                    continue;
                }

                fieldLabels.putIfAbsent(answer.fieldId(), answer.label() == null ? "Field " + answer.fieldId() : answer.label());
                fieldValueVotes
                        .computeIfAbsent(answer.fieldId(), ignored -> new HashMap<>())
                        .merge(value, 1L, Long::sum);
            }
        }

        List<BookingDtos.BookingPreferenceItem> preferences = fieldValueVotes.entrySet()
                .stream()
                .map((entry) -> toPreferenceItem(entry.getKey(), fieldLabels.get(entry.getKey()), entry.getValue()))
                .sorted(Comparator.comparing(BookingDtos.BookingPreferenceItem::fieldId))
                .toList();

        return new BookingDtos.BookingPreferenceResponse(
                normalizedEmployeeId,
                facilityId,
                (long) bookings.size(),
                preferences
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDtos.BookingDetail getBookingDetail(Long bookingId) {
        Booking booking = getBookingOrThrow(bookingId);
        if (!isFacilityVisible(booking.getFacility())) {
            throw new ResourceNotFoundException("Booking not found with id: " + bookingId);
        }

        List<BookingDtos.BookingAnswer> answers = parseBookingAnswers(booking.getBookingResponse());

        return new BookingDtos.BookingDetail(
                booking.getBookingId(),
                booking.getFacility().getFacilityId(),
                booking.getFacility().getFacilityName(),
                booking.getEmployeeId(),
                booking.getStatus().name(),
                booking.getBookingDate().toString(),
                booking.getCreatedAt().toString(),
                answers
        );
    }

    @Override
    public void cancelBooking(Long bookingId) {
        Booking booking = getBookingOrThrow(bookingId);
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            return;
        }

        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(booking.getFacility().getFacilityId()).orElse(null);
        ruleEngineService.validateBookingCancellation(booking, rule);

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        auditService.logAction(
            saved.getEmployeeId(),
            "EMPLOYEE",
            "BOOKING_CANCELLED",
            "Booking",
            String.valueOf(saved.getBookingId()),
            "{\"status\":\"CONFIRMED\"}",
            "{\"status\":\"CANCELLED\"}",
            null
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingDtos.AdminBookingSearchItem> searchBookings(Long facilityId, String employeeId, String status, String bookingDate) {
        String normalizedEmployeeId = (employeeId == null || employeeId.isBlank())
                ? null
                : employeeId.trim().toUpperCase(Locale.ROOT);
        BookingStatus parsedStatus = (status == null || status.isBlank()) ? null : parseStatus(status);
        LocalDate parsedDate = (bookingDate == null || bookingDate.isBlank()) ? null : parseBookingDate(bookingDate);

        boolean applyFacility = facilityId != null;
        Long facilityIdParam = applyFacility ? facilityId : -1L;

        boolean applyEmployee = normalizedEmployeeId != null;
        String employeeIdParam = applyEmployee ? normalizedEmployeeId : "";

        boolean applyStatus = parsedStatus != null;
        BookingStatus statusParam = applyStatus ? parsedStatus : BookingStatus.CONFIRMED;

        boolean applyBookingDate = parsedDate != null;
        LocalDate bookingDateParam = applyBookingDate ? parsedDate : LocalDate.now();

        return bookingRepository.findAdminSearchBookings(
                applyFacility,
                facilityIdParam,
                applyEmployee,
                employeeIdParam,
                applyStatus,
                statusParam,
                applyBookingDate,
                bookingDateParam
            ).stream()
            .filter(booking -> isFacilityVisible(booking.getFacility()))
                .map(this::toAdminSearchItem)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDtos.BookingSummaryResponse getBookingSummary(Long facilityId, String bookingDate) {
        if (facilityId == null) {
            throw new BadRequestException("facilityId is required for booking summary");
        }

        LocalDate parsedDate = bookingDate == null || bookingDate.isBlank() ? LocalDate.now() : parseBookingDate(bookingDate);
        long total = bookingRepository.countByFacilityFacilityIdAndBookingDate(facilityId, parsedDate);
        long confirmed = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, parsedDate, BookingStatus.CONFIRMED);
        long cancelled = bookingRepository.countByFacilityFacilityIdAndBookingDateAndStatus(facilityId, parsedDate, BookingStatus.CANCELLED);

        return new BookingDtos.BookingSummaryResponse(
                facilityId,
                parsedDate.toString(),
                total,
                confirmed,
                cancelled
        );
    }



    private Booking getBookingOrThrow(Long bookingId) {
        return bookingRepository.findByIdWithFacility(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
    }

    private LocalDate resolveBookingDate(String bookingDateRaw) {
        if (bookingDateRaw == null || bookingDateRaw.isBlank()) {
            return LocalDate.now();
        }

        LocalDate bookingDate;
        try {
            bookingDate = LocalDate.parse(bookingDateRaw);
        } catch (Exception ex) {
            throw new BadRequestException("Invalid bookingDate. Use ISO format yyyy-MM-dd");
        }

        if (bookingDate.isBefore(LocalDate.now())) {
            throw new BadRequestException("Cannot create booking for a past date");
        }
        return bookingDate;
    }

    private void validateBookingResponses(
            List<FieldDefinition> fields,
            Map<Long, FieldDefinition> fieldMap,
            Map<Long, String> responseMap
    ) {
        for (Long fieldId : responseMap.keySet()) {
            if (!fieldMap.containsKey(fieldId)) {
                throw new BadRequestException("Field id does not belong to this facility: " + fieldId);
            }
        }

        for (FieldDefinition field : fields) {
            String value = responseMap.get(field.getFieldId());
            if (Boolean.TRUE.equals(field.getRequired()) && (value == null || value.isBlank())) {
                throw new BadRequestException("Required field is missing: " + field.getLabel());
            }

            if (value != null && !value.isBlank() &&
                    (field.getFieldType() == FieldType.DROPDOWN || field.getFieldType() == FieldType.RADIO_BUTTON)) {
                boolean exists = false;
                if (field.getFieldOptions() != null) {
                    String raw = field.getFieldOptions().trim();
                    if (raw.startsWith("[")) {
                        try {
                            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(raw);
                            if (node.isArray()) {
                                for (com.fasterxml.jackson.databind.JsonNode item : node) {
                                    if (item.asText().trim().equalsIgnoreCase(value)) { exists = true; break; }
                                }
                            }
                        } catch (Exception ignored) {}
                    }
                    if (!exists) {
                        exists = Arrays.stream(raw.split("\n"))
                                .anyMatch(option -> option.trim().equalsIgnoreCase(value));
                    }
                }
                if (!exists) {
                    throw new BadRequestException("Invalid option for field: " + field.getLabel());
                }
            }
        }
    }

    private void applyBookingResponses(
            Booking booking,
            Map<Long, String> responseMap,
            Map<Long, FieldDefinition> fieldMap
    ) {
        List<BookingDtos.BookingAnswer> answers = new ArrayList<>();
        for (Map.Entry<Long, String> entry : responseMap.entrySet()) {
            FieldDefinition field = fieldMap.get(entry.getKey());
            answers.add(new BookingDtos.BookingAnswer(field.getFieldId(), field.getLabel(), entry.getValue()));
        }
        try {
            booking.setBookingResponse(objectMapper.writeValueAsString(answers));
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Failed to serialize booking responses");
        }
    }

    private LocalDate parseBookingDate(String bookingDate) {
        try {
            return LocalDate.parse(bookingDate.trim());
        } catch (Exception ex) {
            throw new BadRequestException("Invalid bookingDate. Use ISO format yyyy-MM-dd");
        }
    }

    private BookingStatus parseStatus(String status) {
        try {
            return BookingStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new BadRequestException("Invalid status. Allowed values: CONFIRMED, CANCELLED");
        }
    }

    private BookingDtos.AdminBookingSearchItem toAdminSearchItem(Booking booking) {
        List<BookingDtos.BookingAnswer> answers = parseBookingAnswers(booking.getBookingResponse());
        Employee employee = booking.getEmployee();
        String employeeName = employee != null ? employee.getFullName() : null;
        String department = employee != null ? employee.getDepartment() : null;

        return new BookingDtos.AdminBookingSearchItem(
                booking.getBookingId(),
                booking.getFacility().getFacilityId(),
                booking.getFacility().getFacilityName(),
                booking.getEmployeeId(),
            employeeName,
            department,
                booking.getStatus().name(),
                booking.getBookingDate().toString(),
                booking.getCreatedAt() == null ? null : booking.getCreatedAt().toString(),
                booking.getCancelledAt() == null ? null : booking.getCancelledAt().toString(),
                answers
        );
    }

    private BookingDtos.BookingPreferenceItem toPreferenceItem(
            Long fieldId,
            String label,
            Map<String, Long> valueVotes
    ) {
        Map.Entry<String, Long> majority = valueVotes.entrySet()
                .stream()
                .sorted((a, b) -> {
                    int byVotes = Long.compare(b.getValue(), a.getValue());
                    return byVotes != 0 ? byVotes : a.getKey().compareToIgnoreCase(b.getKey());
                })
                .findFirst()
                .orElse(Map.entry("", 0L));

        return new BookingDtos.BookingPreferenceItem(
                fieldId,
                label == null || label.isBlank() ? "Field " + fieldId : label,
                majority.getKey(),
                majority.getValue()
        );
    }

    private boolean isFacilityVisible(Facility facility) {
        return facility != null
                && Boolean.TRUE.equals(facility.getPublished());
    }

    private List<BookingDtos.BookingAnswer> parseBookingAnswers(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<BookingDtos.BookingAnswer>>() {});
        } catch (JsonProcessingException e) {
            return new ArrayList<>();
        }
    }
}
