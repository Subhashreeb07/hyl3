DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'facility_fields'
          AND column_name = 'field_options'
          AND udt_name = 'json'
    ) THEN
        ALTER TABLE facility_fields
            ALTER COLUMN field_options TYPE jsonb
            USING field_options::jsonb;
    END IF;
END $$;
