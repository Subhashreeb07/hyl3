CREATE OR REPLACE VIEW vw_employee_registrations_admin AS
SELECT
    e.employee_id,
    e.full_name,
    e.email,
    e.department,
    e.office_location,
    e.work_mode,
    e.role_code,
    e.active,
    e.created_at,
    e.updated_at
FROM employees e
ORDER BY e.created_at DESC;
