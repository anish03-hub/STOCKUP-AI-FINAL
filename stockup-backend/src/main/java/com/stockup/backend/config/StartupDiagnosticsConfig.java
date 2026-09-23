package com.stockup.backend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Temporary diagnostic configuration to trace and log Spring bean initialization durations
 * during application startup to pinpoint performance bottlenecks on Render.
 */
@Slf4j
@Configuration
public class StartupDiagnosticsConfig implements BeanPostProcessor {

    private final Map<String, Long> startTimes = new ConcurrentHashMap<>();

    @Override
    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        startTimes.put(beanName, System.currentTimeMillis());
        return bean;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        Long startTime = startTimes.remove(beanName);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            if (duration >= 50) { // Log any bean initialization taking >= 50ms
                log.info("[STARTUP TRACE] Bean: {} ({}) | Duration: {} ms",
                        beanName, bean.getClass().getName(), duration);
            }
        }
        return bean;
    }

    @EventListener
    public void onContextRefreshed(ContextRefreshedEvent event) {
        log.info("========== SPRING CONTEXT REFRESH COMPLETE ==========");
    }
}
