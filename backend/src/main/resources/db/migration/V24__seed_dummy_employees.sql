-- Dummy employees for verifying facility type/role filtering
-- All use default password "password123" (null hash = backend fallback)
INSERT INTO employees (employee_id, full_name, email, role_code, work_mode, office_location, active)
VALUES
  ('EMP_ONSITE',  'Ravi Kumar',    'ravi.kumar@hyhub.local',    'EMPLOYEE', 'ON_SITE', 'HYDERABAD', TRUE),
  ('EMP_REMOTE',  'Priya Sharma',  'priya.sharma@hyhub.local',  'EMPLOYEE', 'REMOTE',  'HYDERABAD', TRUE),
  ('EMP_HYBRID',  'Arjun Nair',    'arjun.nair@hyhub.local',    'EMPLOYEE', 'HYBRID',  'HYDERABAD', TRUE),
  ('EMP_HR',      'Sunita Reddy',  'sunita.reddy@hyhub.local',  'HR',       'HYBRID',  'HYDERABAD', TRUE),
  ('EMP_MANAGER', 'Vikram Singh',  'vikram.singh@hyhub.local',  'MANAGER',  'HYBRID',  'HYDERABAD', TRUE),
  ('EMP_FINANCE', 'Anita Patel',   'anita.patel@hyhub.local',   'FINANCE',  'HYBRID',  'HYDERABAD', TRUE),
  ('EMP_OPS',     'Karan Mehta',   'karan.mehta@hyhub.local',   'OPS',      'ON_SITE', 'HYDERABAD', TRUE),
  ('EMP_DEVOPS',  'Neha Gupta',    'neha.gupta@hyhub.local',    'DEVOPS',   'REMOTE',  'HYDERABAD', TRUE),
  -- Kolkata employees
  ('KOL_ONSITE',  'Amit Bose',     'amit.bose@hyhub.local',     'EMPLOYEE', 'ON_SITE', 'KOLKATA',   TRUE),
  ('KOL_REMOTE',  'Debarati Sen',  'debarati.sen@hyhub.local',  'EMPLOYEE', 'REMOTE',  'KOLKATA',   TRUE),
  ('KOL_HYBRID',  'Sourav Das',    'sourav.das@hyhub.local',    'EMPLOYEE', 'HYBRID',  'KOLKATA',   TRUE),
  ('KOL_HR',      'Ritika Ghosh',  'ritika.ghosh@hyhub.local',  'HR',       'HYBRID',  'KOLKATA',   TRUE),
  ('KOL_MANAGER', 'Subir Mondal',  'subir.mondal@hyhub.local',  'MANAGER',  'ON_SITE', 'KOLKATA',   TRUE),
  ('KOL_FINANCE', 'Puja Chatterjee','puja.chatterjee@hyhub.local','FINANCE', 'HYBRID',  'KOLKATA',   TRUE),
  ('KOL_DEVOPS',  'Rahul Mukherjee','rahul.mukherjee@hyhub.local','DEVOPS',  'REMOTE',  'KOLKATA',   TRUE)
ON CONFLICT (employee_id) DO NOTHING;
