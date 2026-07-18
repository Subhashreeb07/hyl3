package com.example.hy_backend.repository;

import com.example.hy_backend.model.SavedPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedPreferenceRepository extends JpaRepository<SavedPreference, SavedPreference.PK> {

    List<SavedPreference> findByEmployeeIdOrderByUpdatedAtDesc(String employeeId);

    @Modifying
    @Query("DELETE FROM SavedPreference sp WHERE sp.employeeId = :employeeId AND sp.fieldLabel = :fieldLabel")
    void deleteByEmployeeIdAndFieldLabel(@Param("employeeId") String employeeId,
                                         @Param("fieldLabel") String fieldLabel);

    @Modifying
    @Query("DELETE FROM SavedPreference sp WHERE sp.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") String employeeId);
}
