package com.example.hy_backend.service;

import com.example.hy_backend.dto.FieldDtos;

import java.util.List;

public interface FieldService {
    FieldDtos.FieldIdResponse addField(Long facilityId, FieldDtos.AddFieldRequest request);

    void addOptions(Long fieldId, FieldDtos.AddOptionsRequest request);

    List<FieldDtos.FieldSummaryResponse> getFields(Long facilityId);

    FieldDtos.FieldDetailResponse updateField(Long fieldId, FieldDtos.UpdateFieldRequest request);

    void deleteField(Long fieldId);
}
