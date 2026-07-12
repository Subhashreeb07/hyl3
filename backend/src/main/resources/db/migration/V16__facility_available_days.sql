-- Add available_days to facility_rules
-- Stores comma-separated days: MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY
-- NULL means available every day (no restriction)
ALTER TABLE facility_rules ADD COLUMN IF NOT EXISTS available_days VARCHAR(100);
