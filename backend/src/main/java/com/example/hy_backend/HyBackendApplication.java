package com.example.hy_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HyBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(HyBackendApplication.class, args);
	}

}
