package com.example.hy_backend.repository;

import com.example.hy_backend.model.FacilityRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface FacilityRuleRepository extends JpaRepository<FacilityRule, Long> {
    Optional<FacilityRule> findByFacilityFacilityId(Long facilityId);
}
