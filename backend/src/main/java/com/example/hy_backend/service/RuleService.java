package com.example.hy_backend.service;

import com.example.hy_backend.dto.RuleDtos;

public interface RuleService {
    RuleDtos.RuleResponse saveRules(Long facilityId, RuleDtos.RuleRequest request);

    RuleDtos.RuleResponse getRules(Long facilityId);

    RuleDtos.RuleResponse updateRules(Long facilityId, RuleDtos.RuleRequest request);
}
