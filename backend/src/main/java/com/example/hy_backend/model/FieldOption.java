package com.example.hy_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "field_options")
public class FieldOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long optionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "field_id", nullable = false)
    private FieldDefinition field;

    @Column(nullable = false)
    private String optionValue;

    @Column(nullable = false)
    private Integer displayOrder = 1;

    public Long getOptionId() {
        return optionId;
    }

    public void setOptionId(Long optionId) {
        this.optionId = optionId;
    }

    public FieldDefinition getField() {
        return field;
    }

    public void setField(FieldDefinition field) {
        this.field = field;
    }

    public String getOptionValue() {
        return optionValue;
    }

    public void setOptionValue(String optionValue) {
        this.optionValue = optionValue;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
