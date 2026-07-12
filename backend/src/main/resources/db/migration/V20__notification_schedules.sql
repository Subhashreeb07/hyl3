-- Create notification schedules table for recurring and scheduled notifications
CREATE TABLE notification_schedules (
    schedule_id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(64) NOT NULL,
    template_id BIGINT NOT NULL,
    scheduled_time TIMESTAMP,
    frequency VARCHAR(30) NOT NULL DEFAULT 'ONCE',
    days_of_week VARCHAR(255),
    day_of_month INT,
    time_of_day TIME,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_sched_employee FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    CONSTRAINT fk_notif_sched_template FOREIGN KEY (template_id) REFERENCES notification_templates(template_id) ON DELETE CASCADE
);

CREATE INDEX idx_employee_active ON notification_schedules(employee_id, active);
CREATE INDEX idx_frequency ON notification_schedules(frequency);
CREATE INDEX idx_scheduled_time ON notification_schedules(scheduled_time);
CREATE INDEX idx_start_date ON notification_schedules(start_date);
CREATE INDEX idx_notification_schedules_active ON notification_schedules(active, scheduled_time);
