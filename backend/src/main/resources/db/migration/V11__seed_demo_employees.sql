INSERT INTO employees (employee_id, full_name, email, role_code)
VALUES ('ADMIN001', 'Admin User', 'admin001@hyhub.local', 'ADMIN')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO employees (employee_id, full_name, email, role_code)
VALUES ('EMP001', 'Employee User', 'emp001@hyhub.local', 'EMPLOYEE')
ON CONFLICT (employee_id) DO NOTHING;
