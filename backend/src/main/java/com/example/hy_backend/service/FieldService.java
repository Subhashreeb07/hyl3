package com.example.hy_backend.service;

import com.example.hy_backend.dto.FieldDtos;

import java.util.List;

public interface FieldService {
    FieldDtos.FieldIdResponse addField(Long facilityId, FieldDtos.AddFieldRequest request);


    List<FieldDtos.FieldSummaryResponse> getFields(Long facilityId);

    FieldDtos.FieldDetailResponse updateField(Long fieldId, FieldDtos.UpdateFieldRequest request);

    void updateFieldOptions(Long fieldId, FieldDtos.UpdateFieldOptionsRequest request);

    void deleteField(Long fieldId);
}
