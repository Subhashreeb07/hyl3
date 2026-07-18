ALTER TABLE facilities
    ADD COLUMN IF NOT EXISTS facility_type VARCHAR(20) NOT NULL DEFAULT 'FACILITY';

UPDATE facilities
SET facility_type = 'EVENT'
WHERE category ILIKE '%[EVENT]%';
