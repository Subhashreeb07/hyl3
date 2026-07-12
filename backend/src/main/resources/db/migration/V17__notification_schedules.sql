-- Create notification schedules table for recurring and scheduled notifications
CREATE TABLE notification_schedules (
    schedule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(64) NOT NULL,
    template_id BIGINT NOT NULL,
    scheduled_time DATETIME,
    frequency VARCHAR(30) NOT NULL DEFAULT 'ONCE',
    days_of_week VARCHAR(255),
    day_of_month INT,
    time_of_day TIME,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES notification_templates(template_id) ON DELETE CASCADE,
    INDEX idx_employee_active (employee_id, active),
    INDEX idx_frequency (frequency),
    INDEX idx_scheduled_time (scheduled_time),
    INDEX idx_start_date (start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add index for notification schedule processing
CREATE INDEX idx_notification_schedules_active ON notification_schedules(active, scheduled_time);
