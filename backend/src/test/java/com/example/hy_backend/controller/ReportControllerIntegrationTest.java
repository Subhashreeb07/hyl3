package com.example.hy_backend.controller;

import com.example.hy_backend.dto.ReportDtos;
import com.example.hy_backend.service.AuthService;
import com.example.hy_backend.service.ReportService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ReportController.class)
class ReportControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReportService reportService;

        @MockBean
        private AuthService authService;

    @Test
    void getTrend_shouldReturnPointsForDateRange() throws Exception {
        ReportDtos.BookingTrendResponse response = new ReportDtos.BookingTrendResponse(
                "2026-07-01",
                "2026-07-03",
                null,
                List.of(
                        new ReportDtos.TrendPoint("2026-07-01", 10, 2, 12),
                        new ReportDtos.TrendPoint("2026-07-02", 12, 1, 13),
                        new ReportDtos.TrendPoint("2026-07-03", 9, 3, 12)
                )
        );

        when(reportService.getBookingTrend(null, "2026-07-01", "2026-07-03")).thenReturn(response);
        when(authService.resolveRole(anyString())).thenReturn("ADMIN");

        mockMvc.perform(get("/api/reports/trend")
                        .header("Authorization", "Bearer token")
                        .param("fromDate", "2026-07-01")
                        .param("toDate", "2026-07-03"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromDate").value("2026-07-01"))
                .andExpect(jsonPath("$.points.length()").value(3))
                .andExpect(jsonPath("$.points[1].confirmedBookings").value(12));

        verify(reportService).getBookingTrend(null, "2026-07-01", "2026-07-03");
    }

    @Test
    void getSummary_shouldReturnOperationalMetrics() throws Exception {
        ReportDtos.OperationalSummaryResponse response = new ReportDtos.OperationalSummaryResponse(
                "2026-07-06",
                150,
                130,
                20,
                13.33,
                7,
                6
        );

        when(reportService.getOperationalSummary("2026-07-06")).thenReturn(response);
                when(authService.resolveRole(anyString())).thenReturn("ADMIN");

                mockMvc.perform(get("/api/reports/summary")
                                                .header("Authorization", "Bearer token")
                                                .param("bookingDate", "2026-07-06"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalBookings").value(150))
                .andExpect(jsonPath("$.cancellationRate").value(13.33));

        verify(reportService).getOperationalSummary("2026-07-06");
    }

        @Test
        void getSummary_shouldRejectNonAdminRole() throws Exception {
                when(authService.resolveRole(anyString())).thenReturn("EMPLOYEE");

                mockMvc.perform(get("/api/reports/summary")
                                                .header("Authorization", "Bearer token")
                                                .param("bookingDate", "2026-07-06"))
                                .andExpect(status().isForbidden());
        }
}
