-- Allow deleting a facility to cascade to its bookings
ALTER TABLE bookings
    DROP CONSTRAINT fk_bookings_facility;
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_facility FOREIGN KEY (facility_id)
        REFERENCES facilities (facility_id) ON DELETE CASCADE;

-- When a booking is deleted, set booking_id to NULL in notifications
-- (booking_id is nullable so SET NULL is safe)
ALTER TABLE notifications
    DROP CONSTRAINT fk_notifications_booking;
ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id)
        REFERENCES bookings (booking_id) ON DELETE SET NULL;
