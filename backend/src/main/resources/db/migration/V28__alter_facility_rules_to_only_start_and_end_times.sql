ALTER TABLE facility_rules
    DROP COLUMN IF EXISTS cancellation_deadline,
    DROP COLUMN IF EXISTS employee_types,
    DROP COLUMN IF EXISTS roles,
    DROP COLUMN IF EXISTS facility_available_from_date,
    DROP COLUMN IF EXISTS facility_available_to_date,
    DROP COLUMN IF EXISTS booking_window_days,
    DROP COLUMN IF EXISTS available_days;
