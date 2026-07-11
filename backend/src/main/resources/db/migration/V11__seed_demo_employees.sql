INSERT INTO employees (employee_id, full_name, email, role_code, active)
VALUES ('ADMIN001', 'Admin User', 'admin001@hyhub.local', 'ADMIN', TRUE)
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (employee_id, full_name, email, role_code, active)
VALUES ('EMP001', 'Employee User', 'emp001@hyhub.local', 'EMPLOYEE', TRUE)
ON CONFLICT (employee_id) DO NOTHING;