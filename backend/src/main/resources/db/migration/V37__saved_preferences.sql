CREATE TABLE IF NOT EXISTS saved_preferences (
    employee_id  VARCHAR(64)   NOT NULL REFERENCES employees(employee_id) ON DELETE CASCADE,
    field_label  VARCHAR(255)  NOT NULL,
    field_value  VARCHAR(1000) NOT NULL DEFAULT '',
    updated_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (employee_id, field_label)
);
