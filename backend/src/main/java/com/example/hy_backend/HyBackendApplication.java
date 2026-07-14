package com.example.hy_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import java.nio.file.Files;
import java.nio.file.Paths;

@SpringBootApplication
@EnableScheduling
public class HyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HyBackendApplication.class, args);
	}

	@Bean
	@Transactional
	public CommandLineRunner runSchemaCleanup(JdbcTemplate jdbcTemplate) {
		return args -> {
			try {
				String sql = new String(Files.readAllBytes(Paths.get("src/main/resources/db/migration/V22__schema_cleanup.sql")));
				for (String statement : sql.split(";")) {
					if (!statement.trim().isEmpty()) {
						try {
							jdbcTemplate.execute(statement.trim());
							System.out.println("Executed: " + statement.trim().substring(0, Math.min(50, statement.trim().length())) + "...");
						} catch (Exception ex) {
							System.err.println("Error executing statement: " + ex.getMessage());
						}
					}
				}
				jdbcTemplate.execute("COMMIT");
				System.out.println("V22 schema cleanup finished and committed!");
			} catch (Exception e) {
				System.err.println("Failed to read V22: " + e.getMessage());
			}
		};
	}
}
