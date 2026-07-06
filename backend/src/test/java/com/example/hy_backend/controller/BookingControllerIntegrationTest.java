package com.example.hy_backend.controller;

import com.example.hy_backend.dto.BookingDtos;
import com.example.hy_backend.service.AuthService;
import com.example.hy_backend.service.BookingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = BookingController.class)
class BookingControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BookingService bookingService;

    @MockBean
    private AuthService authService;

    @Test
    void verifyQrEndpoint_shouldReturnVerificationResult() throws Exception {
        BookingDtos.VerifyQrRequest request = new BookingDtos.VerifyQrRequest("HYQR.v1.1.nonce.signature");
        BookingDtos.VerifyQrResponse response = new BookingDtos.VerifyQrResponse(
                true,
                "QR code is valid",
                1L,
                2L,
                "Lunch",
                "EMP001",
                "2026-07-08",
                "CONFIRMED"
        );

        when(bookingService.verifyQrCode("HYQR.v1.1.nonce.signature")).thenReturn(response);

        mockMvc.perform(post("/api/bookings/verify-qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.bookingId").value(1))
                .andExpect(jsonPath("$.facilityName").value("Lunch"));

        verify(bookingService).verifyQrCode("HYQR.v1.1.nonce.signature");
    }

    @Test
    void verifyQrEndpoint_shouldRejectBlankQrCode() throws Exception {
        mockMvc.perform(post("/api/bookings/verify-qr")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"qrCode\":\"\"}"))
                .andExpect(status().isBadRequest());
    }
}
