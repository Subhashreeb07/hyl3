package com.example.hy_backend.service;

import java.util.List;
import java.util.Map;

public interface PreferenceService {

    /** Returns label→value map for the given employee. */
    Map<String, String> getPreferences(String employeeId);

    /** Upserts a batch of label→value pairs for the employee. */
    void savePreferences(String employeeId, List<PreferenceEntry> entries);

    /** Deletes a single label entry for the employee. */
    void deletePreference(String employeeId, String fieldLabel);

    record PreferenceEntry(String label, String value) {}
}
