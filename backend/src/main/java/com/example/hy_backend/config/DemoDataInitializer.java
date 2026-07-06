package com.example.hy_backend.config;

import com.example.hy_backend.model.Facility;
import com.example.hy_backend.model.FacilityRule;
import com.example.hy_backend.model.FieldDefinition;
import com.example.hy_backend.model.FieldOption;
import com.example.hy_backend.model.FieldType;
import com.example.hy_backend.repository.FacilityRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@Profile("local")
public class DemoDataInitializer implements CommandLineRunner {

    private final FacilityRepository facilityRepository;

    public DemoDataInitializer(FacilityRepository facilityRepository) {
        this.facilityRepository = facilityRepository;
    }

    @Override
    public void run(String... args) {
        if (facilityRepository.countByPublishedTrue() > 0) {
            return;
        }

        Facility facility = new Facility();
        facility.setFacilityName("Lunch Booking");
        facility.setDescription("Employee lunch booking form");
        facility.setCategory("Food");
        facility.setIcon("utensils");
        facility.setStatus(true);
        facility.setPublished(true);

        List<FieldDefinition> fields = new ArrayList<>();

        FieldDefinition mealType = new FieldDefinition();
        mealType.setFacility(facility);
        mealType.setLabel("Meal Type");
        mealType.setFieldType(FieldType.DROPDOWN);
        mealType.setPlaceholder("Select meal type");
        mealType.setRequired(true);
        mealType.setDisplayOrder(1);

        List<FieldOption> mealOptions = new ArrayList<>();
        mealOptions.add(option(mealType, "Veg", 1));
        mealOptions.add(option(mealType, "Non-Veg", 2));
        mealOptions.add(option(mealType, "Jain", 3));
        mealType.setOptions(mealOptions);
        fields.add(mealType);

        FieldDefinition notes = new FieldDefinition();
        notes.setFacility(facility);
        notes.setLabel("Notes");
        notes.setFieldType(FieldType.TEXTAREA);
        notes.setPlaceholder("Dietary preference notes");
        notes.setRequired(false);
        notes.setDisplayOrder(2);
        fields.add(notes);

        facility.setFields(fields);

        FacilityRule rule = new FacilityRule();
        rule.setFacility(facility);
        rule.setBookingDeadline(LocalTime.of(23, 0));
        rule.setReminderTime(LocalTime.of(10, 0));
        rule.setQrRequired(true);
        rule.setAllowCancellation(true);
        rule.setRegularCommuteEnabled(false);
        facility.setRule(rule);

        facilityRepository.save(facility);
    }

    private FieldOption option(FieldDefinition field, String value, int displayOrder) {
        FieldOption option = new FieldOption();
        option.setField(field);
        option.setOptionValue(value);
        option.setDisplayOrder(displayOrder);
        return option;
    }
}
