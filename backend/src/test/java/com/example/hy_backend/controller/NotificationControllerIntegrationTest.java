package com.example.hy_backend.controller;

import com.example.hy_backend.dto.NotificationDtos;
import com.example.hy_backend.service.AuthService;
import com.example.hy_backend.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = NotificationController.class)
class NotificationControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

        @MockBean
        private AuthService authService;

    @Test
    void processEndpoint_shouldReturnBatchResult() throws Exception {
        NotificationDtos.ProcessNotificationsResponse response = new NotificationDtos.ProcessNotificationsResponse(10, 7, 2, 1, 0);
        when(notificationService.processPendingNotifications(100)).thenReturn(response);
        when(authService.resolveRole(anyString())).thenReturn("ADMIN");

        mockMvc.perform(post("/api/notifications/process")
                        .header("Authorization", "Bearer token")
                        .param("batchSize", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attempted").value(10))
                .andExpect(jsonPath("$.escalated").value(1));

        verify(notificationService).processPendingNotifications(100);
    }

    @Test
    void opsSummaryEndpoint_shouldReturnMetrics() throws Exception {
        NotificationDtos.NotificationOpsSummaryResponse response = new NotificationDtos.NotificationOpsSummaryResponse(
                "2026-07-06",
                45,
                7,
                5,
                30,
                2,
                1
        );
        when(notificationService.getOperationalSummary("2026-07-06")).thenReturn(response);
        when(authService.resolveRole(anyString())).thenReturn("ADMIN");

        mockMvc.perform(get("/api/notifications/ops/summary")
                        .header("Authorization", "Bearer token")
                        .param("reportDate", "2026-07-06"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportDate").value("2026-07-06"))
                .andExpect(jsonPath("$.sent").value(30));

        verify(notificationService).getOperationalSummary("2026-07-06");
    }

    @Test
    void scheduledEndpoint_shouldAcceptValidPayload() throws Exception {
        NotificationDtos.CreateScheduledNotificationRequest request = new NotificationDtos.CreateScheduledNotificationRequest(
                "EMP001",
                12L,
                "BOOKING_REMINDER",
                "EMAIL",
                "Reminder",
                "2026-07-07T09:00:00",
                3
        );

        NotificationDtos.NotificationResponse response = new NotificationDtos.NotificationResponse(
                99L,
                "EMP001",
                12L,
                "BOOKING_REMINDER",
                "EMAIL",
                "Reminder",
                "2026-07-07T09:00:00",
                null,
                null,
                "SCHEDULED",
                0,
                3,
                null,
                false,
                null,
                "2026-07-06T10:00:00"
        );

        when(notificationService.scheduleNotification(request)).thenReturn(response);

        mockMvc.perform(post("/api/notifications/scheduled")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value("SCHEDULED"))
                .andExpect(jsonPath("$.notificationId").value(99));

        verify(notificationService).scheduleNotification(request);
    }
}
