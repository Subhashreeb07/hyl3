package com.example.hy_backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all non-API, non-static routes to index.html so Angular's
 * client-side router can handle them (SPA fallback).
 */
@Controller
public class SpaFallbackController {

    @RequestMapping(value = {
            "/login",
            "/admin",
            "/admin/**",
            "/employee",
            "/employee/**"
    })
    public String forward(HttpServletRequest request) {
        return "forward:/index.html";
    }
}
