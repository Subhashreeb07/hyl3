-- Add facility availability date range columns
-- facilityAvailableFromDate: Facility is available starting from this date (NULL = no restriction)
-- facilityAvailableToDate: Facility is available until this date (NULL = no restriction)
ALTER TABLE facility_rules ADD COLUMN IF NOT EXISTS facility_available_from_date DATE;
ALTER TABLE facility_rules ADD COLUMN IF NOT EXISTS facility_available_to_date DATE;
