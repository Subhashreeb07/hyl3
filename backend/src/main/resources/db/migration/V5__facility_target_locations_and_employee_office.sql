ALTER TABLE employees
    ADD COLUMN office_location VARCHAR(64) NOT NULL DEFAULT 'HYDERABAD';

ALTER TABLE facilities
    ADD COLUMN target_locations VARCHAR(255);
