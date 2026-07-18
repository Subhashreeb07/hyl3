package com.example.hy_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "saved_preferences")
@IdClass(SavedPreference.PK.class)
public class SavedPreference {

    @Id
    @Column(name = "employee_id", nullable = false, length = 64)
    private String employeeId;

    @Id
    @Column(name = "field_label", nullable = false, length = 255)
    private String fieldLabel;

    @Column(name = "field_value", nullable = false, length = 1000)
    private String fieldValue = "";

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    // ---- Composite PK class ----
    public static class PK implements Serializable {
        private String employeeId;
        private String fieldLabel;

        public PK() {}
        public PK(String employeeId, String fieldLabel) {
            this.employeeId = employeeId;
            this.fieldLabel = fieldLabel;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK)) return false;
            PK pk = (PK) o;
            return Objects.equals(employeeId, pk.employeeId) && Objects.equals(fieldLabel, pk.fieldLabel);
        }

        @Override
        public int hashCode() {
            return Objects.hash(employeeId, fieldLabel);
        }
    }

    // ---- Getters / Setters ----
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFieldLabel() { return fieldLabel; }
    public void setFieldLabel(String fieldLabel) { this.fieldLabel = fieldLabel; }

    public String getFieldValue() { return fieldValue; }
    public void setFieldValue(String fieldValue) { this.fieldValue = fieldValue; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
