CREATE TABLE notification_preferences (
    preference_id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL,
    notification_type VARCHAR(60) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_notification_pref_emp_type ON notification_preferences(employee_id, notification_type);
