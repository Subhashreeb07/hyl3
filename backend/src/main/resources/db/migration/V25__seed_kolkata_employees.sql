-- Kolkata office dummy employees (complement to V24 Hyderabad set)
INSERT INTO employees (employee_id, full_name, email, role_code, work_mode, office_location, active)
VALUES
  ('KOL_ONSITE',  'Amit Bose',      'amit.bose@hyhub.local',      'EMPLOYEE', 'ON_SITE', 'KOLKATA', TRUE),
  ('KOL_REMOTE',  'Debarati Sen',   'debarati.sen@hyhub.local',   'EMPLOYEE', 'REMOTE',  'KOLKATA', TRUE),
  ('KOL_HYBRID',  'Sourav Das',     'sourav.das@hyhub.local',     'EMPLOYEE', 'HYBRID',  'KOLKATA', TRUE),
  ('KOL_HR',      'Ritika Ghosh',   'ritika.ghosh@hyhub.local',   'HR',       'HYBRID',  'KOLKATA', TRUE),
  ('KOL_MANAGER', 'Subir Mondal',   'subir.mondal@hyhub.local',   'MANAGER',  'ON_SITE', 'KOLKATA', TRUE),
  ('KOL_FINANCE', 'Puja Chatterjee','puja.chatterjee@hyhub.local','FINANCE',  'HYBRID',  'KOLKATA', TRUE),
  ('KOL_DEVOPS',  'Rahul Mukherjee','rahul.mukherjee@hyhub.local','DEVOPS',   'REMOTE',  'KOLKATA', TRUE)
ON CONFLICT (employee_id) DO NOTHING;
