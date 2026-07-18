package com.example.hy_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "facilities")
public class Facility {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long facilityId;

    @Column(nullable = false, unique = true)
    private String facilityName;

    private String description;

    private String category;

    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(name = "facility_type", nullable = false, length = 20)
    private FacilityType facilityType = FacilityType.FACILITY;


    @Column(nullable = false)
    private Boolean published = false;

    @Column(name = "is_template", nullable = false)
    private Boolean isTemplate = false;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic = true;

    @Column(name = "target_locations", length = 255)
    private String targetLocations;

    @Column(name = "target_employee_ids", columnDefinition = "TEXT")
    private String targetEmployeeIds;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FieldDefinition> fields = new ArrayList<>();

    @OneToOne(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    private FacilityRule rule;

    @OneToMany(mappedBy = "facility", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Booking> bookings = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getFacilityId() {
        return facilityId;
    }

    public void setFacilityId(Long facilityId) {
        this.facilityId = facilityId;
    }

    public String getFacilityName() {
        return facilityName;
    }

    public void setFacilityName(String facilityName) {
        this.facilityName = facilityName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public FacilityType getFacilityType() {
        return facilityType;
    }

    public void setFacilityType(FacilityType facilityType) {
        this.facilityType = facilityType;
    }


    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public Boolean getIsTemplate() {
        return isTemplate;
    }

    public void setIsTemplate(Boolean isTemplate) {
        this.isTemplate = isTemplate;
    }

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
    }

    public String getTargetLocations() {
        return targetLocations;
    }

    public void setTargetLocations(String targetLocations) {
        this.targetLocations = targetLocations;
    }

    public String getTargetEmployeeIds() {
        return targetEmployeeIds;
    }

    public void setTargetEmployeeIds(String targetEmployeeIds) {
        this.targetEmployeeIds = targetEmployeeIds;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<FieldDefinition> getFields() {
        return fields;
    }

    public void setFields(List<FieldDefinition> fields) {
        this.fields = fields;
    }

    public FacilityRule getRule() {
        return rule;
    }

    public void setRule(FacilityRule rule) {
        this.rule = rule;
    }

    public List<Booking> getBookings() {
        return bookings;
    }

    public void setBookings(List<Booking> bookings) {
        this.bookings = bookings;
    }
}
