package com.example.hy_backend.repository;

import com.example.hy_backend.model.FieldDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface FieldDefinitionRepository extends JpaRepository<FieldDefinition, Long> {
    List<FieldDefinition> findByFacilityFacilityIdOrderByDisplayOrderAsc(Long facilityId);

}
