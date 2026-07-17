-- V33__publish_test_facility.sql
UPDATE facilities 
SET published = true, 
    target_locations = 'HYDERABAD'
WHERE facility_id = 1;
