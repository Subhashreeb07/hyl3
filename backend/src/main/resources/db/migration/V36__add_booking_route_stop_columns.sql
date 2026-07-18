-- Store parsed route and stop separately for TREE_SELECT (cab) bookings.
-- The booking_response JSONB continues to hold the raw "route>stop" value for all field types.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_route VARCHAR(500);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS selected_stop  VARCHAR(500);