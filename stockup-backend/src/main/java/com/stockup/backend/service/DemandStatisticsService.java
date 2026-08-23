package com.stockup.backend.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Reads the historical hourly demand CSV (saleshourly.csv) at startup and
 * computes, per product code, the statistics required for dynamic safety-stock:
 *
 *   averageDemand  — mean hourly demand over all historical observations
 *   demandStdDev   — sample standard deviation of hourly demand
 *
 * The CSV is opened READ-ONLY and never modified.
 * The computed statistics are cached in memory for the application lifetime.
 *
 * Supported product codes (per the trained ML model):
 *   M01AB, M01AE, N02BA, N02BE, N05B, N05C, R03, R06
 *
 * Data source: stockup-backend/ml/medicine/data/saleshourly.csv
 */
@Service
public class DemandStatisticsService {

    private static final Logger logger = LoggerFactory.getLogger(DemandStatisticsService.class);

    /** Columns that contain per-medicine demand values in the CSV. */
    private static final List<String> SUPPORTED_CODES =
            List.of("M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06");

    @Value("${reorder.demand-csv-path:ml/medicine/data/saleshourly.csv}")
    private String csvPath;

    /** Cached per-code stats: code → DemandStats */
    private final Map<String, DemandStats> statsCache = new HashMap<>();

    // ── Startup ────────────────────────────────────────────────────────────────

    @PostConstruct
    public void loadDemandStats() {
        logger.info("Loading demand statistics from CSV: {}", csvPath);

        // Collect all observations per code
        Map<String, List<Double>> observations = new LinkedHashMap<>();
        for (String code : SUPPORTED_CODES) {
            observations.put(code, new ArrayList<>());
        }

        int rowsRead = 0;
        try (BufferedReader reader = openCsv()) {
            String header = reader.readLine();
            if (header == null) {
                logger.error("Demand CSV is empty: {}", csvPath);
                return;
            }

            // Determine column indices from header
            String[] headers = header.split(",");
            Map<String, Integer> colIndex = new HashMap<>();
            for (int i = 0; i < headers.length; i++) {
                String h = headers[i].trim();
                if (SUPPORTED_CODES.contains(h)) {
                    colIndex.put(h, i);
                }
            }

            if (colIndex.isEmpty()) {
                logger.error("No supported product-code columns found in CSV header: {}", header);
                return;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                String[] cols = line.split(",", -1);
                for (Map.Entry<String, Integer> entry : colIndex.entrySet()) {
                    int idx = entry.getValue();
                    if (idx < cols.length) {
                        try {
                            double val = Double.parseDouble(cols[idx].trim());
                            observations.get(entry.getKey()).add(val);
                        } catch (NumberFormatException ignored) {
                            // Skip unparseable cells
                        }
                    }
                }
                rowsRead++;
            }
        } catch (Exception e) {
            logger.warn("Could not load demand statistics from CSV '{}': {}. " +
                        "Safety-stock calculations will fall back to 0 variability.", csvPath, e.getMessage());
            return;
        }

        // Compute and cache per-code statistics
        for (String code : SUPPORTED_CODES) {
            List<Double> vals = observations.get(code);
            if (vals.size() < 2) {
                logger.warn("Insufficient data for code {} ({} rows). Using zero variability.", code, vals.size());
                statsCache.put(code, new DemandStats(code, 0.0, 0.0, vals.size()));
                continue;
            }

            double mean = vals.stream().mapToDouble(d -> d == null ? 0.0 : d).average().orElse(0.0);
            double variance = vals.stream()
                    .mapToDouble(v -> v == null ? 0.0 : (v - mean) * (v - mean))
                    .sum() / (vals.size() - 1); // sample variance (Bessel's correction)
            double stdDev = Math.sqrt(variance);

            statsCache.put(code, new DemandStats(code, mean, stdDev, vals.size()));
            logger.info("Demand stats loaded — {}: n={}, avg={}, sigma={}",
                    code, vals.size(),
                    String.format("%.4f", mean),
                    String.format("%.4f", stdDev));
        }

        logger.info("Demand statistics loaded from {} rows. Codes cached: {}", rowsRead, statsCache.keySet());
    }

    // ── Public API ──────────────────────────────────────────────────────────────

    /**
     * Return cached demand statistics for a product code.
     * Code matching is case-insensitive.
     *
     * @param productCode e.g. "N02BE", "n02be"
     * @return DemandStats, or empty Optional if code not supported
     */
    public Optional<DemandStats> getStats(String productCode) {
        if (productCode == null) return Optional.empty();
        return Optional.ofNullable(statsCache.get(productCode.trim().toUpperCase(Locale.ROOT)));
    }

    /**
     * Return all cached statistics (for debugging / monitoring).
     */
    public Map<String, DemandStats> getAllStats() {
        return Collections.unmodifiableMap(statsCache);
    }

    // ── Internal helpers ────────────────────────────────────────────────────────

    private BufferedReader openCsv() throws Exception {
        // Try filesystem path (relative to working directory) first
        Path fsPath = Paths.get(csvPath);
        if (Files.exists(fsPath)) {
            return new BufferedReader(new FileReader(fsPath.toFile()));
        }
        // Fallback: try classpath resource
        var stream = getClass().getClassLoader().getResourceAsStream(csvPath);
        if (stream != null) {
            return new BufferedReader(new InputStreamReader(stream));
        }
        throw new IllegalStateException("Demand CSV not found at path: " + csvPath);
    }

    // ── Value Object ────────────────────────────────────────────────────────────

    /**
     * Immutable statistics snapshot for one product code.
     */
    public record DemandStats(
            String productCode,
            double averageDemand,  // mean hourly demand
            double demandStdDev,   // sample std dev of hourly demand
            int observationCount
    ) {}
}
