package com.example.hy_backend.serviceimpl;

import com.example.hy_backend.model.SavedPreference;
import com.example.hy_backend.repository.SavedPreferenceRepository;
import com.example.hy_backend.service.PreferenceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class PreferenceServiceImpl implements PreferenceService {

    private final SavedPreferenceRepository repo;

    public PreferenceServiceImpl(SavedPreferenceRepository repo) {
        this.repo = repo;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getPreferences(String employeeId) {
        Map<String, String> result = new LinkedHashMap<>();
        for (SavedPreference sp : repo.findByEmployeeIdOrderByUpdatedAtDesc(employeeId)) {
            result.put(sp.getFieldLabel(), sp.getFieldValue());
        }
        return result;
    }

    @Override
    @Transactional
    public void savePreferences(String employeeId, List<PreferenceEntry> entries) {
        for (PreferenceEntry entry : entries) {
            if (entry.label() == null || entry.label().isBlank()) continue;
            SavedPreference.PK pk = new SavedPreference.PK(employeeId, entry.label().trim());
            SavedPreference sp = repo.findById(pk).orElse(new SavedPreference());
            sp.setEmployeeId(employeeId);
            sp.setFieldLabel(entry.label().trim());
            sp.setFieldValue(entry.value() == null ? "" : entry.value().trim());
            repo.save(sp);
        }
    }

    @Override
    @Transactional
    public void deletePreference(String employeeId, String fieldLabel) {
        repo.deleteByEmployeeIdAndFieldLabel(employeeId, fieldLabel);
    }
}
