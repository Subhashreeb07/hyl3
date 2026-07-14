package com.example.hy_backend.service;

import com.example.hy_backend.dto.RuleDtos;

public interface RuleService {
    RuleDtos.RuleResponse saveRules(Long facilityId, com.fasterxml.jackson.databind.JsonNode request);

    RuleDtos.RuleResponse getRules(Long facilityId);

    com.fasterxml.jackson.databind.JsonNode getFullRules(Long facilityId);

    RuleDtos.RuleResponse updateRules(Long facilityId, com.fasterxml.jackson.databind.JsonNode request);
}
