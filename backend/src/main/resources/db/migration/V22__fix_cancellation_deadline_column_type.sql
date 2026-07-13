ALTER TABLE facility_rules
    ALTER COLUMN cancellation_deadline TYPE TIME USING cancellation_deadline::time;
