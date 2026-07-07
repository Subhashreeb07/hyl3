ALTER TABLE employees
    ADD COLUMN work_mode VARCHAR(32) NOT NULL DEFAULT 'HYBRID';

ALTER TABLE employees
    ADD COLUMN preference_tag VARCHAR(64);
