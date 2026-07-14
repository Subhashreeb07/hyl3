ALTER TABLE facility_fields ALTER COLUMN field_options TYPE jsonb USING field_options::jsonb;
