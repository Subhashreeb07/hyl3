package com.example.hy_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI hyHubOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("HY Hub Specification-Driven Facility Platform API")
                .description("Enterprise API for specification-driven facility management, dynamic forms, rule validation, booking orchestration, notifications, and audit trails.")
                .version("v1")
                .contact(new Contact()
                    .name("HY Hub Platform Engineering")
                    .email("platform-engineering@hyhub.com"))
                .license(new License()
                    .name("Proprietary")
                    .url("https://hyhub.com/legal")))
            .servers(List.of(
                new Server().url("http://localhost:8080").description("Local"),
                new Server().url("https://api.hyhub.com").description("Production")
            ))
            .components(new Components());
    }

    @Bean
    public GroupedOpenApi publicApi() {
        return GroupedOpenApi.builder()
            .group("platform-all")
                .pathsToMatch("/api/**")
                .build();
    }

        @Bean
        public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
            .group("admin-api")
            .pathsToMatch(
                "/api/facilities/**",
                "/api/fields/**",
                "/api/specifications/**",
                "/api/reports/**",
                "/api/audit/**"
            )
            .build();
        }

        @Bean
        public GroupedOpenApi employeeApi() {
        return GroupedOpenApi.builder()
            .group("employee-api")
            .pathsToMatch(
                "/api/auth/**",
                "/api/employee/**",
                "/api/dashboard",
                "/api/bookings/**",
                "/api/notifications/**"
            )
            .build();
        }
}
