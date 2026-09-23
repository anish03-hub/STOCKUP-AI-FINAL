package com.stockup.backend.config;

import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Automatically seeds the 2,511 FDA medicine catalog if the items table is empty.
 * Runs on boot to provide an instant, turnkey experience in containerized deployments.
 */
@Component
public class ItemDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ItemDataInitializer.class);

    private final ItemRepository itemRepository;

    @Value("classpath:medicines_2020_2025.csv")
    private Resource medicinesResource;

    public ItemDataInitializer(ItemRepository itemRepository) {
        this.itemRepository = itemRepository;
    }

    @Override
    public void run(String... args) {
        if (itemRepository.count() > 0) {
            return;
        }

        logger.info("Items table is empty. Initializing catalog from medicines_2020_2025.csv...");

        List<Item> items = new ArrayList<>();
        try (BufferedReader reader = openReader()) {
            if (reader == null) {
                logger.warn("medicines_2020_2025.csv not found. Skipping auto-seeding.");
                return;
            }

            String headerLine = reader.readLine(); // skip header
            if (headerLine == null) {
                return;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.trim().isEmpty()) continue;
                List<String> columns = parseCsvLine(line);
                if (columns.size() < 10) continue;

                Item item = new Item();
                item.setCode(columns.get(0).trim());
                item.setName(columns.get(1).trim());
                item.setCategory(columns.get(2).trim());
                item.setManufacturer(columns.get(3).trim());
                item.setDescription(columns.get(4).trim());

                try {
                    item.setPrice(Double.parseDouble(columns.get(5).trim()));
                } catch (Exception e) {
                    item.setPrice(25.0);
                }

                try {
                    item.setSellingPrice(Double.parseDouble(columns.get(6).trim()));
                } catch (Exception e) {
                    item.setSellingPrice(item.getPrice() * 1.30);
                }

                try {
                    item.setQuantity(Integer.parseInt(columns.get(7).trim()));
                } catch (Exception e) {
                    item.setQuantity(100);
                }

                item.setExpiryDate(columns.get(8).trim());
                item.setStatus(columns.get(9).trim());
                item.setBusinessId(com.stockup.backend.service.CompanyOnboardingService.DEFAULT_BUSINESS_ID);

                items.add(item);
            }

            if (!items.isEmpty()) {
                itemRepository.saveAll(items);
                logger.info("Successfully seeded {} medicines into database.", items.size());
            }
        } catch (Exception e) {
            logger.error("Failed to seed items from CSV: {}", e.getMessage(), e);
        }
    }

    private BufferedReader openReader() {
        try {
            // First check classpath resource
            if (medicinesResource != null && medicinesResource.exists()) {
                return new BufferedReader(new InputStreamReader(medicinesResource.getInputStream(), StandardCharsets.UTF_8));
            }
            // Next check relative filesystem path
            File file = new File("medicines_2020_2025.csv");
            if (file.exists()) {
                return new BufferedReader(new FileReader(file, StandardCharsets.UTF_8));
            }
            File backendFile = new File("stockup-backend/medicines_2020_2025.csv");
            if (backendFile.exists()) {
                return new BufferedReader(new FileReader(backendFile, StandardCharsets.UTF_8));
            }
        } catch (Exception e) {
            logger.warn("Could not open CSV file: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Parses a CSV line respecting quoted commas.
     */
    private List<String> parseCsvLine(String line) {
        List<String> result = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                inQuotes = !inQuotes;
            } else if (c == ',' && !inQuotes) {
                result.add(cleanField(sb.toString()));
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        result.add(cleanField(sb.toString()));
        return result;
    }

    private String cleanField(String field) {
        String trimmed = field.trim();
        if (trimmed.startsWith("\"") && trimmed.endsWith("\"") && trimmed.length() >= 2) {
            return trimmed.substring(1, trimmed.length() - 1).replace("\"\"", "\"").trim();
        }
        return trimmed;
    }
}
