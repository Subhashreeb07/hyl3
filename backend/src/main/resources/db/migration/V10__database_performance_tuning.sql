CREATE INDEX idx_audit_logs_actor_occurred_at
    ON audit_logs (actor_id, occurred_at DESC);

CREATE INDEX idx_audit_logs_entity_occurred_at
    ON audit_logs (entity_name, entity_id, occurred_at DESC);

CREATE INDEX idx_audit_logs_action_occurred_at
    ON audit_logs (action_code, occurred_at);

CREATE INDEX idx_bookings_employee_created_at
    ON bookings (employee_id, created_at DESC);

CREATE INDEX idx_bookings_booking_date_status
    ON bookings (booking_date, status);
