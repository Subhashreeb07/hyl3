ALTER TABLE facility_rules
    ALTER COLUMN rules_json TYPE jsonb
    USING CASE
        WHEN rules_json IS NULL OR btrim(rules_json) = '' THEN NULL
        ELSE rules_json::jsonb
    END;

DO $$
DECLARE
    has_booking_deadline boolean;
    has_booking_start_time boolean;
    has_available_from_date boolean;
    has_available_to_date boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'facility_rules'
          AND column_name = 'booking_deadline'
    ) INTO has_booking_deadline;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'facility_rules'
          AND column_name = 'booking_start_time'
    ) INTO has_booking_start_time;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'facility_rules'
          AND column_name = 'facility_available_from_date'
    ) INTO has_available_from_date;

    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'facility_rules'
          AND column_name = 'facility_available_to_date'
    ) INTO has_available_to_date;

    EXECUTE format(
        $sql$
        UPDATE facility_rules
        SET rules_json = jsonb_build_object(
            'bookingDeadline', to_jsonb(COALESCE(%s, rules_json->>'bookingDeadline')),
            'bookingStartTime', to_jsonb(COALESCE(%s, rules_json->>'bookingStartTime')),
            'availableDays', to_jsonb(NULLIF(COALESCE(rules_json->>'availableDays', ''), '')),
            'facilityAvailableFromDate', to_jsonb(COALESCE(%s, rules_json->>'facilityAvailableFromDate')),
            'facilityAvailableToDate', to_jsonb(COALESCE(%s, rules_json->>'facilityAvailableToDate')),
            'employeeTypes', to_jsonb(COALESCE(rules_json->>'employeeTypes', '')),
            'roles', to_jsonb(COALESCE(rules_json->>'roles', ''))
        )
        $sql$,
        CASE WHEN has_booking_deadline THEN 'booking_deadline::text' ELSE 'NULL::text' END,
        CASE WHEN has_booking_start_time THEN 'booking_start_time::text' ELSE 'NULL::text' END,
        CASE WHEN has_available_from_date THEN 'facility_available_from_date::text' ELSE 'NULL::text' END,
        CASE WHEN has_available_to_date THEN 'facility_available_to_date::text' ELSE 'NULL::text' END
    );
END $$;