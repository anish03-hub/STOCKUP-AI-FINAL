package com.stockup.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class StockupBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(StockupBackendApplication.class, args);
    }

}
