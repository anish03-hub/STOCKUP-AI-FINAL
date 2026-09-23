package com.stockup.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.core.metrics.StartupStep;
import org.springframework.core.metrics.buffering.BufferingApplicationStartup;
import org.springframework.core.metrics.buffering.StartupTimeline;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Comparator;

@EnableScheduling
@SpringBootApplication
public class StockupBackendApplication {

    private static final Logger log = LoggerFactory.getLogger(StockupBackendApplication.class);

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(StockupBackendApplication.class);
        BufferingApplicationStartup startup = new BufferingApplicationStartup(4096);
        app.setApplicationStartup(startup);
        app.run(args);

        // ── TEMPORARY DIAGNOSTIC STARTUP TRACE ────────────────────────────────
        try {
            StartupTimeline timeline = startup.getBufferedTimeline();
            log.info("========== SPRING BOOT STARTUP DIAGNOSTICS (TEMPORARY) ==========");
            log.info("Total Startup Steps Recorded: {}", timeline.getEvents().size());
            timeline.getEvents().stream()
                    .filter(event -> event.getDuration().toMillis() >= 10)
                    .sorted(Comparator.comparing((StartupTimeline.TimelineEvent e) -> e.getDuration()).reversed())
                    .forEach(event -> {
                        StartupStep step = event.getStartupStep();
                        StringBuilder tags = new StringBuilder();
                        step.getTags().forEach(tag -> tags.append(" ").append(tag.getKey()).append("=").append(tag.getValue()));
                        log.info("[STARTUP TRACE] Step: {} | Duration: {} ms | Details:{}",
                                step.getName(),
                                event.getDuration().toMillis(),
                                tags);
                    });
            log.info("===============================================================");
        } catch (Exception e) {
            log.warn("Failed to print startup timeline diagnostics: {}", e.getMessage());
        }
    }

}

