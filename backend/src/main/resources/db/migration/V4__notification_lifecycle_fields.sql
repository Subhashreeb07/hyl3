ALTER TABLE notifications ADD COLUMN scheduled_at TIMESTAMP;
UPDATE notifications SET scheduled_at = created_at WHERE scheduled_at IS NULL;
ALTER TABLE notifications ALTER COLUMN scheduled_at SET NOT NULL;

ALTER TABLE notifications ADD COLUMN processed_at TIMESTAMP;
ALTER TABLE notifications ADD COLUMN retry_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE notifications ADD COLUMN max_retries INTEGER NOT NULL DEFAULT 3;
ALTER TABLE notifications ADD COLUMN last_error VARCHAR(1000);
ALTER TABLE notifications ADD COLUMN escalated BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN escalated_at TIMESTAMP;

CREATE INDEX idx_notifications_status_schedule ON notifications(status_code, scheduled_at);
