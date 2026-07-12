package com.example.hy_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SseEmitterService {
    private static final Logger log = LoggerFactory.getLogger(SseEmitterService.class);
    
    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String employeeId) {
        // Timeout: 30 minutes
        SseEmitter emitter = new SseEmitter(1800000L);
        
        emitters.computeIfAbsent(employeeId, k -> new ArrayList<>()).add(emitter);
        
        emitter.onCompletion(() -> removeEmitter(employeeId, emitter));
        emitter.onTimeout(() -> removeEmitter(employeeId, emitter));
        emitter.onError((e) -> removeEmitter(employeeId, emitter));

        try {
            emitter.send(SseEmitter.event()
                    .name("connect")
                    .data("SSE Connection Established"));
        } catch (IOException e) {
            removeEmitter(employeeId, emitter);
        }

        log.info("Client subscribed to SSE. Employee: {}, active connections: {}", 
                employeeId, emitters.get(employeeId).size());
        return emitter;
    }

    public void sendNotification(String employeeId, Object payload) {
        List<SseEmitter> employeeEmitters = emitters.get(employeeId);
        if (employeeEmitters == null || employeeEmitters.isEmpty()) {
            return;
        }

        log.info("Pushing notification to SSE. Employee: {}, connections count: {}", employeeId, employeeEmitters.size());
        List<SseEmitter> deadEmitters = new ArrayList<>();
        
        for (SseEmitter emitter : employeeEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(payload));
            } catch (Exception e) {
                deadEmitters.add(emitter);
            }
        }

        if (!deadEmitters.isEmpty()) {
            employeeEmitters.removeAll(deadEmitters);
            if (employeeEmitters.isEmpty()) {
                emitters.remove(employeeId);
            }
        }
    }

    private void removeEmitter(String employeeId, SseEmitter emitter) {
        List<SseEmitter> employeeEmitters = emitters.get(employeeId);
        if (employeeEmitters != null) {
            employeeEmitters.remove(emitter);
            if (employeeEmitters.isEmpty()) {
                emitters.remove(employeeId);
            }
            log.info("SSE emitter removed for employee: {}", employeeId);
        }
    }
}
