-- Allow deleting a facility to cascade to its bookings
ALTER TABLE bookings
    DROP CONSTRAINT IF EXISTS fk_bookings_facility;
ALTER TABLE bookings
    ADD CONSTRAINT fk_bookings_facility FOREIGN KEY (facility_id)
        REFERENCES facilities (facility_id) ON DELETE CASCADE;

-- When a booking is deleted, set booking_id to NULL in notifications
-- (booking_id is nullable so SET NULL is safe)
DO $$

BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications
            DROP CONSTRAINT IF EXISTS fk_notifications_booking;
        ALTER TABLE notifications
            ADD CONSTRAINT fk_notifications_booking FOREIGN KEY (booking_id)
                REFERENCES bookings (booking_id) ON DELETE SET NULL;
    END IF;
END $$;
