CREATE TABLE IF NOT EXISTS notification_templates (
    id           BIGSERIAL    PRIMARY KEY,
    template_key VARCHAR(64)  NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    subject      VARCHAR(500) NOT NULL,
    body         TEXT         NOT NULL,
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Seed: Publish notification
INSERT INTO notification_templates (template_key, display_name, subject, body)
VALUES (
  'PUBLISH',
  'Facility Published',
  'HyHub: {{facilityName}} is now open for booking',
  'Dear {{employeeName}},

We are pleased to let you know that the facility "{{facilityName}}" has been published and is now open for booking.

Please log in to the HyHub portal and complete your registration at your earliest convenience.

Portal: http://localhost:8080

Regards,
HyHub Admin Team'
)
ON CONFLICT (template_key) DO NOTHING;

-- Seed: Reminder notification
INSERT INTO notification_templates (template_key, display_name, subject, body)
VALUES (
  'REMINDER',
  'Booking Reminder',
  'Reminder: Please register for {{facilityName}}',
  'Dear {{employeeName}},

This is a friendly reminder that you have not yet registered for "{{facilityName}}".

The booking window may be closing soon. Please log in to HyHub and complete your registration.

Portal: http://localhost:8080

Regards,
HyHub Admin Team'
)
ON CONFLICT (template_key) DO NOTHING;
