ALTER TABLE bookings
    ADD COLUMN client_request_id VARCHAR(120);

ALTER TABLE bookings
    ADD CONSTRAINT uq_bookings_employee_client_request
    UNIQUE (employee_id, client_request_id);

CREATE INDEX idx_bookings_facility_date_status ON bookings (facility_id, booking_date, status);
CREATE INDEX idx_bookings_employee_status_date ON bookings (employee_id, status, booking_date);
