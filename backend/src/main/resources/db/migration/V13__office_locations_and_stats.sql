-- Office Locations master table
CREATE TABLE office_locations (
    id              BIGSERIAL PRIMARY KEY,
    location_name   VARCHAR(100) NOT NULL UNIQUE,
    employee_count  INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Seed the two default locations (employee_count starts at 0 per requirement)
INSERT INTO office_locations (location_name, employee_count) VALUES
    ('Hyderabad', 0),
    ('Kolkata',   0);

-- Per-facility, per-location, per-date booking stats
-- total_requested: incremented by 1 each time an employee POSTs a booking
-- acknowledged:    incremented by 1 when employee explicitly acknowledges
CREATE TABLE facility_location_stats (
    id              BIGSERIAL PRIMARY KEY,
    facility_id     BIGINT  NOT NULL REFERENCES facilities(facility_id) ON DELETE CASCADE,
    location_id     BIGINT  NOT NULL REFERENCES office_locations(id)    ON DELETE CASCADE,
    booking_date    DATE    NOT NULL,
    total_requested INTEGER NOT NULL DEFAULT 0,
    acknowledged    INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_fac_loc_date UNIQUE (facility_id, location_id, booking_date)
);
