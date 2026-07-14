ALTER TABLE bookings ALTER COLUMN booking_response TYPE jsonb USING booking_response::jsonb;
