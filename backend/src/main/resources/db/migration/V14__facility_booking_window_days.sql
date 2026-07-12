-- Add booking_window_days to facility_rules
-- Represents how many days in advance employees can book this facility
-- NULL means unlimited booking window
-- Example: booking_window_days = 10 means employees can book up to 10 days from today
ALTER TABLE facility_rules ADD COLUMN IF NOT EXISTS booking_window_days INTEGER;
