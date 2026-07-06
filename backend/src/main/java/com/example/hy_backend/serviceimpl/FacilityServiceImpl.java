package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.dto.EmployeeDtos;
import com.example.hy_backend.dto.FacilityDtos;
import com.example.hy_backend.exception.BadRequestException;
import com.example.hy_backend.exception.ResourceNotFoundException;
import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldType;
import com.example.hy_backend.repository.FacilityRepository;
import com.example.hy_backend.repository.FieldDefinitionRepository;
import com.example.hy_backend.repository.FacilityRuleRepository;
import com.example.hy_backend.service.FacilityService;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class FacilityServiceImpl implements FacilityService {

    private final FacilityRepository facilityRepository;
    private final FieldDefinitionRepository fieldDefinitionRepository;
    private final FacilityRuleRepository facilityRuleRepository;

    public FacilityServiceImpl(
            FacilityRepository facilityRepository,
            FieldDefinitionRepository fieldDefinitionRepository,
                        FacilityRuleRepository facilityRuleRepository
    ) {
        this.facilityRepository = facilityRepository;
        this.fieldDefinitionRepository = fieldDefinitionRepository;
        this.facilityRuleRepository = facilityRuleRepository;
    }

    @Override
    public FacilityDtos.FacilityCreateResponse createFacility(FacilityDtos.FacilityCreateRequest request) {
        Facility facility = new Facility();
        facility.setFacilityName(request.facilityName().trim());
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        facility.setIcon(request.icon());
        facility.setStatus(request.status());
        facility.setPublished(false);

        Facility saved = facilityRepository.save(facility);
        return new FacilityDtos.FacilityCreateResponse(saved.getFacilityId(), "Facility created successfully");
    }

    @Override
    public List<FacilityDtos.FacilitySummaryResponse> getAllFacilities() {
        return facilityRepository.findAll().stream()
                .map(f -> new FacilityDtos.FacilitySummaryResponse(
                        f.getFacilityId(),
                        f.getFacilityName(),
                        f.getStatus()
                ))
                .toList();
    }

    @Override
    public FacilityDtos.FacilityDetailResponse getFacility(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        return toDetailResponse(facility);
    }

    @Override
    public FacilityDtos.FacilityDetailResponse updateFacility(Long facilityId, FacilityDtos.FacilityUpdateRequest request) {
        Facility facility = getFacilityOrThrow(facilityId);
        facility.setFacilityName(request.facilityName().trim());
        facility.setDescription(request.description());
        facility.setCategory(request.category());
        facility.setIcon(request.icon());
        facility.setStatus(request.status());
        Facility saved = facilityRepository.save(facility);
        return toDetailResponse(saved);
    }

    @Override
    @Transactional
    public void deleteFacility(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        facilityRepository.delete(facility);
    }

    @Override
    @Transactional
    public FacilityDtos.PublishResponse publishFacility(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        validatePublishReadiness(facilityId);
        facility.setPublished(true);
        facilityRepository.save(facility);
        return new FacilityDtos.PublishResponse(facility.getFacilityId(), "Facility published successfully");
    }

    @Override
    @Transactional
    public EmployeeDtos.FacilitySpecificationResponse getFacilitySpecification(Long facilityId) {
        Facility facility = getFacilityOrThrow(facilityId);
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facilityId);
        FacilityRule rule = facilityRuleRepository.findByFacilityFacilityId(facilityId).orElse(null);

        List<EmployeeDtos.SpecificationField> specificationFields = fields.stream()
                .map(field -> new EmployeeDtos.SpecificationField(
                        field.getFieldId(),
                        field.getLabel(),
                        field.getFieldType().name(),
                        field.getRequired(),
                        field.getPlaceholder(),
                        field.getValidationJson(),
                        field.getDefaultValue(),
                        field.getOptions().isEmpty()
                                ? Collections.emptyList()
                                : field.getOptions().stream().map(o -> o.getOptionValue()).toList()
                ))
                .toList();

        EmployeeDtos.SpecificationRule specificationRule = rule == null
                ? new EmployeeDtos.SpecificationRule(null, null, null, false, true, null, false)
                : new EmployeeDtos.SpecificationRule(
                        rule.getBookingDeadline() == null ? null : rule.getBookingDeadline().toString(),
                        rule.getBookingStartTime() == null ? null : rule.getBookingStartTime().toString(),
                        rule.getReminderTime() == null ? null : rule.getReminderTime().toString(),
                        rule.getQrRequired(),
                        rule.getAllowCancellation(),
                        rule.getMaximumCapacity(),
                        rule.getRegularCommuteEnabled()
                );

        return new EmployeeDtos.FacilitySpecificationResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                specificationFields,
                specificationRule
        );
    }

    private Facility getFacilityOrThrow(Long facilityId) {
        return facilityRepository.findById(facilityId)
                .orElseThrow(() -> new ResourceNotFoundException("Facility not found with id: " + facilityId));
    }

    private FacilityDtos.FacilityDetailResponse toDetailResponse(Facility facility) {
        return new FacilityDtos.FacilityDetailResponse(
                facility.getFacilityId(),
                facility.getFacilityName(),
                facility.getDescription(),
                facility.getCategory(),
                facility.getIcon(),
                facility.getStatus(),
                facility.getPublished()
        );
    }

    private void validatePublishReadiness(Long facilityId) {
        List<FieldDefinition> fields = fieldDefinitionRepository.findByFacilityFacilityIdOrderByDisplayOrderAsc(facilityId);
        if (fields.isEmpty()) {
            throw new BadRequestException("Cannot publish facility without dynamic fields");
        }

        for (FieldDefinition field : fields) {
            if (field.getLabel() == null || field.getLabel().isBlank()) {
                throw new BadRequestException("Cannot publish facility with empty field label");
            }

            if (requiresOptions(field.getFieldType()) && field.getOptions().isEmpty()) {
                throw new BadRequestException("Cannot publish facility. Options missing for field: " + field.getLabel());
            }
        }
    }

    private boolean requiresOptions(FieldType fieldType) {
        return fieldType == FieldType.DROPDOWN || fieldType == FieldType.RADIO_BUTTON || fieldType == FieldType.CHECKBOX;
    }
}
