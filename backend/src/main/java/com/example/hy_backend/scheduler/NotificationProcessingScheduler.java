package com.example.hy_backend.scheduler;

import com.example.hy_backend.service.NotificationScheduleService;
import com.example.hy_backend.service.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationProcessingScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationProcessingScheduler.class);

    private final NotificationService notificationService;
    private final NotificationScheduleService scheduleService;
    private final int batchSize;

    public NotificationProcessingScheduler(
            NotificationService notificationService,
            NotificationScheduleService scheduleService,
            @Value("${app.notifications.processor.batch-size:100}") int batchSize
    ) {
        this.notificationService = notificationService;
        this.scheduleService = scheduleService;
        this.batchSize = batchSize;
    }

    @Scheduled(cron = "${app.notifications.processor.cron:0 */1 * * * *}")
    public void processPendingNotifications() {
        var result = notificationService.processPendingNotifications(batchSize);
        if (result.attempted() > 0) {
            log.info(
                    "Notification processor attempted={}, sent={}, retried={}, escalated={}, failed={}",
                    result.attempted(),
                    result.sent(),
                    result.retried(),
                    result.escalated(),
                    result.failed()
            );
        }

        int processed = scheduleService.processScheduledNotifications();
        if (processed > 0) {
            log.info("Processed {} scheduled notifications", processed);
        }
    }

    @Scheduled(cron = "${app.notifications.daily.cron:0 0 * * * *}")
    public void processDailySchedules() {
        int processed = scheduleService.processDailySchedules();
        if (processed > 0) {
            log.info("Processed {} daily scheduled notifications", processed);
        }
    }

    @Scheduled(cron = "${app.notifications.weekly.cron:0 0 0 * * 0}")
    public void processWeeklySchedules() {
        int processed = scheduleService.processWeeklySchedules();
        if (processed > 0) {
            log.info("Processed {} weekly scheduled notifications", processed);
        }
    }

    @Scheduled(cron = "${app.notifications.monthly.cron:0 0 0 1 * *}")
    public void processMonthlySchedules() {
        int processed = scheduleService.processMonthlySchedules();
        if (processed > 0) {
            log.info("Processed {} monthly scheduled notifications", processed);
        }
    }
}
