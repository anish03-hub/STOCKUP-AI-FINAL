package com.stockup.backend.service;

import com.stockup.backend.dto.*;
import com.stockup.backend.model.Item;
import com.stockup.backend.repository.ItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

/**
 * Deterministic StockUp AI Data Assistant Service.
 *
 * Architecture:
 *   Natural Language Message
 *       ↓
 *   Intent Detection (keyword classification — zero external API calls)
 *       ↓
 *   Delegation to existing StockUp services
 *       ↓
 *   PostgreSQL / ML model / internal calculations
 *       ↓
 *   Structured, factual answer
 *
 * This service DOES NOT call any external LLM API.
 * All data comes from:
 *   - PostgreSQL (via ItemRepository)
 *   - ExpiryAlertService
 *   - InventoryHealthService
 *   - StockoutPredictionService
 *   - ReorderOptimizationService
 *   - MedicineDemandPredictionService → FastAPI :8001 → Random Forest v2
 */
@Service
public class AssistantService {

    private static final Logger logger = LoggerFactory.getLogger(AssistantService.class);

    // ── Intent identifiers ────────────────────────────────────────────────────
    private static final String INTENT_INVENTORY_LOOKUP   = "INVENTORY_LOOKUP";
    private static final String INTENT_LOW_STOCK          = "LOW_STOCK";
    private static final String INTENT_EXPIRY             = "EXPIRY";
    private static final String INTENT_DEMAND_PREDICTION  = "DEMAND_PREDICTION";
    private static final String INTENT_STOCKOUT_RISK      = "STOCKOUT_RISK";
    private static final String INTENT_REORDER            = "REORDER";
    private static final String INTENT_INVENTORY_VALUE    = "INVENTORY_VALUE";
    private static final String INTENT_INVENTORY_SUMMARY  = "INVENTORY_SUMMARY";
    private static final String INTENT_MEDICINE_SEARCH    = "MEDICINE_SEARCH";
    private static final String INTENT_UNKNOWN            = "UNKNOWN";

    // ── Supported ML product codes (validated against saleshourly.csv) ────────
    private static final Set<String> ML_PRODUCT_CODES = Set.of(
            "M01AB", "M01AE", "N02BA", "N02BE", "N05B", "N05C", "R03", "R06"
    );

    // ── Dependencies — all existing StockUp services (NO duplication) ─────────
    private final ItemRepository itemRepository;
    private final ExpiryAlertService expiryAlertService;
    private final InventoryHealthService inventoryHealthService;
    private final StockoutPredictionService stockoutPredictionService;
    private final ReorderOptimizationService reorderOptimizationService;
    private final MedicineDemandPredictionService medicineDemandPredictionService;
    private final RestTemplate restTemplate;

    @Autowired
    public AssistantService(
            ItemRepository itemRepository,
            ExpiryAlertService expiryAlertService,
            InventoryHealthService inventoryHealthService,
            StockoutPredictionService stockoutPredictionService,
            ReorderOptimizationService reorderOptimizationService,
            MedicineDemandPredictionService medicineDemandPredictionService,
            RestTemplate restTemplate) {
        this.itemRepository = itemRepository;
        this.expiryAlertService = expiryAlertService;
        this.inventoryHealthService = inventoryHealthService;
        this.stockoutPredictionService = stockoutPredictionService;
        this.reorderOptimizationService = reorderOptimizationService;
        this.medicineDemandPredictionService = medicineDemandPredictionService;
        this.restTemplate = restTemplate;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Process a natural-language question from the user.
     * All data comes from internal StockUp data sources — NO external LLM call.
     */
    public AssistantQueryResponse processQuery(String message) {
        if (message == null || message.trim().isEmpty()) {
            return new AssistantQueryResponse(INTENT_UNKNOWN,
                    "Please ask a question about your StockUp inventory.");
        }

        String normalizedMessage = message.toLowerCase(Locale.ROOT).trim();
        String intent = detectIntent(normalizedMessage);

        logger.info("Assistant intent detected: {} for message: '{}'", intent, message);

        return switch (intent) {
            case INTENT_INVENTORY_LOOKUP  -> handleInventoryLookup(normalizedMessage, message);
            case INTENT_LOW_STOCK        -> handleLowStock();
            case INTENT_EXPIRY           -> handleExpiry();
            case INTENT_DEMAND_PREDICTION -> handleDemandPrediction(normalizedMessage, message);
            case INTENT_STOCKOUT_RISK    -> handleStockoutRisk();
            case INTENT_REORDER          -> handleReorder(normalizedMessage, message);
            case INTENT_INVENTORY_VALUE  -> handleInventoryValue();
            case INTENT_INVENTORY_SUMMARY -> handleInventorySummary();
            case INTENT_MEDICINE_SEARCH  -> handleMedicineSearch(normalizedMessage, message);
            default                      -> handleUnknown(message);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT DETECTION — pure keyword classification, zero external calls
    // ─────────────────────────────────────────────────────────────────────────

    private String detectIntent(String msg) {
        // Order matters: more specific intents checked first

        // DEMAND_PREDICTION — must be before general inventory checks
        if (containsAny(msg, "predict", "prediction", "forecast", "demand", "next hour", "next-hour", "next_hour",
                "will demand", "expected demand", "future demand")) {
            // Reject multi-period forecasts — not supported by current model
            if (containsAny(msg, "year", "month", "week", "annual", "monthly", "weekly")) {
                return INTENT_DEMAND_PREDICTION; // handled with proper limitation message
            }
            return INTENT_DEMAND_PREDICTION;
        }

        // STOCKOUT_RISK
        if (containsAny(msg, "stockout", "stock-out", "stock out", "run out", "risk", "at risk", "deplete",
                "stock risk", "will run", "about to run")) {
            return INTENT_STOCKOUT_RISK;
        }

        // REORDER
        if (containsAny(msg, "reorder", "re-order", "order", "purchase", "buy", "procurement",
                "how much to order", "cost to reorder", "reorder quantity")) {
            return INTENT_REORDER;
        }

        // EXPIRY
        if (containsAny(msg, "expir", "expire", "expiry", "spoil", "near expir", "expiring soon",
                "about to expire", "near expiry")) {
            return INTENT_EXPIRY;
        }

        // LOW_STOCK
        if (containsAny(msg, "low stock", "low in stock", "critical stock", "need attention",
                "stock alert", "running low", "almost out", "attention")) {
            return INTENT_LOW_STOCK;
        }

        // INVENTORY_VALUE
        if (containsAny(msg, "total value", "inventory value", "total inventory", "worth",
                "financial value", "total cost", "how much inventory", "value of")) {
            return INTENT_INVENTORY_VALUE;
        }

        // INVENTORY_SUMMARY
        if (containsAny(msg, "summary", "overview", "dashboard", "how is my inventory",
                "status report", "overall", "stockup summary", "today's summary", "today's stockup")) {
            return INTENT_INVENTORY_SUMMARY;
        }

        // INVENTORY_LOOKUP — specific quantity/stock question about a named medicine
        if (containsAny(msg, "stock of", "how many", "how much", "quantity of", "units of",
                "how much do we have", "how much stock", "current stock", "do we have",
                "stock level", "inventory of")) {
            return INTENT_INVENTORY_LOOKUP;
        }

        // MEDICINE_SEARCH — general "tell me about", "show details", "what is X"
        if (containsAny(msg, "tell me about", "show details", "what category", "about",
                "what is", "information on", "details of", "describe", "info on")) {
            return INTENT_MEDICINE_SEARCH;
        }

        // If a known medicine name or code is in the message without other context, default to MEDICINE_SEARCH
        if (resolveItemFromMessage(msg) != null) {
            return INTENT_MEDICINE_SEARCH;
        }

        return INTENT_UNKNOWN;
    }

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDICINE RESOLVER — maps medicine name OR product code → Item from DB
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Resolve a medicine reference from a natural-language message.
     * Checks by product code first, then by name substring match.
     * Source of truth: PostgreSQL items table (not hardcoded).
     */
    private Item resolveItemFromMessage(String normalizedMsg) {
        List<Item> allItems = itemRepository.findAll();

        // Check if any ML product code appears verbatim in the message
        for (Item item : allItems) {
            if (item.getCode() != null && normalizedMsg.contains(item.getCode().toLowerCase())) {
                return item;
            }
        }

        // Check by medicine name (case-insensitive substring)
        for (Item item : allItems) {
            if (item.getName() != null && normalizedMsg.contains(item.getName().toLowerCase())) {
                return item;
            }
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTENT HANDLERS — each delegates to existing services, no duplicate logic
    // ─────────────────────────────────────────────────────────────────────────

    /** INTENT: INVENTORY_LOOKUP — look up current quantity for a specific medicine */
    private AssistantQueryResponse handleInventoryLookup(String normalized, String original) {
        Item item = resolveItemFromMessage(normalized);
        if (item == null) {
            return new AssistantQueryResponse(INTENT_INVENTORY_LOOKUP,
                    "I couldn't identify a specific medicine in your question. " +
                    "Please name the medicine or product code (e.g. 'stock of Paracetamol' or 'stock of N02BE').");
        }

        String answer = String.format(
                "%s (%s)\n\nCurrent Stock: %d units\nStatus: %s\nUnit Price: $%.2f\nExpiry: %s\n\n" +
                "Source: StockUp inventory database.",
                item.getName(),
                item.getCode() != null ? item.getCode() : "—",
                item.getQuantity() != null ? item.getQuantity() : 0,
                item.getStatus() != null ? item.getStatus() : "Unknown",
                item.getPrice() != null ? item.getPrice() : 0.0,
                item.getExpiryDate() != null ? item.getExpiryDate() : "Not specified"
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("medicineName", item.getName());
        data.put("productCode", item.getCode());
        data.put("quantity", item.getQuantity());
        data.put("status", item.getStatus());
        data.put("unitPrice", item.getPrice());
        data.put("expiryDate", item.getExpiryDate());

        return new AssistantQueryResponse(INTENT_INVENTORY_LOOKUP, answer, data);
    }

    /** INTENT: LOW_STOCK — list medicines with quantity <= 20 from PostgreSQL */
    private AssistantQueryResponse handleLowStock() {
        List<Item> allItems = itemRepository.findAll();
        List<Item> lowStock = allItems.stream()
                .filter(item -> item.getQuantity() != null && item.getQuantity() <= 20)
                .sorted(Comparator.comparingInt(item -> item.getQuantity() != null ? item.getQuantity() : 0))
                .collect(Collectors.toList());

        if (lowStock.isEmpty()) {
            return new AssistantQueryResponse(INTENT_LOW_STOCK,
                    "✅ All medicines currently have sufficient stock (above 20 units).\n\nSource: StockUp inventory database.");
        }

        StringBuilder sb = new StringBuilder("⚠️ Low Stock Medicines (≤ 20 units)\n\n");
        for (Item item : lowStock) {
            sb.append(String.format("• %s (%s) — %d units\n",
                    item.getName(),
                    item.getCode() != null ? item.getCode() : "—",
                    item.getQuantity()));
        }
        sb.append("\nThese values are retrieved from the current StockUp inventory database.");

        List<Map<String, Object>> itemList = lowStock.stream().map(item -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("medicineName", item.getName());
            m.put("productCode", item.getCode());
            m.put("quantity", item.getQuantity());
            m.put("status", item.getStatus());
            return m;
        }).collect(Collectors.toList());

        return new AssistantQueryResponse(INTENT_LOW_STOCK, sb.toString().trim(), itemList);
    }

    /** INTENT: EXPIRY — delegates to ExpiryAlertService */
    private AssistantQueryResponse handleExpiry() {
        ExpiryAlertSummary summary = expiryAlertService.getExpiryAlerts();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("📋 Expiry Alert Summary\n\n" +
                "• Critical (< 30 days): %d item(s)\n" +
                "• Warning (31–90 days): %d item(s)\n" +
                "• Safe (> 90 days): %d item(s)\n" +
                "• At-Risk Financial Value: $%.2f\n\n",
                summary.getTotalCriticalItems(),
                summary.getTotalWarningItems(),
                summary.getTotalSafeItems(),
                summary.getTotalAtRiskValue()));

        if (summary.getAtRiskItems() != null && !summary.getAtRiskItems().isEmpty()) {
            sb.append("At-Risk Items:\n");
            for (ExpiryItemDetails item : summary.getAtRiskItems()) {
                sb.append(String.format("• %s — %d days left [%s]\n",
                        item.getMedicineName(),
                        item.getDaysUntilExpiry(),
                        item.getRiskLevel()));
            }
        } else {
            sb.append("No medicines are currently at expiry risk.");
        }

        sb.append("\nSource: StockUp ExpiryAlertService (PostgreSQL).");
        return new AssistantQueryResponse(INTENT_EXPIRY, sb.toString().trim(), summary);
    }

    /** INTENT: DEMAND_PREDICTION — delegates to MedicineDemandPredictionService → FastAPI → ML model */
    private AssistantQueryResponse handleDemandPrediction(String normalized, String original) {
        // Check if the user asked for multi-period forecast (not supported)
        if (containsAny(normalized, "next year", "next month", "next week", "annual", "monthly",
                "weekly", "yearly", "year", "month", "week", "yearly demand", "annual demand")) {
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    "ℹ️ The current StockUp demand model predicts next-hour demand only. " +
                    "It does not currently provide weekly, monthly, or annual forecasts.\n\n" +
                    "Prediction source: StockUp Random Forest v2 demand model.");
        }

        Item item = resolveItemFromMessage(normalized);
        if (item == null || item.getCode() == null) {
            // Check if any ML product code appears directly without being in DB
            String code = extractProductCodeFromMessage(normalized);
            if (code != null) {
                return callDemandPrediction(code, code, null);
            }
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    "Please specify a supported medicine for demand prediction.\n\n" +
                    "Supported medicines: Diclofenac (M01AB), Ibuprofen (M01AE), Aspirin (N02BA), " +
                    "Paracetamol (N02BE), Diazepam (N05B), Zolpidem (N05C), Salbutamol (R03), Cetirizine (R06).");
        }

        String code = item.getCode().toUpperCase(Locale.ROOT);
        if (!ML_PRODUCT_CODES.contains(code)) {
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    String.format("ℹ️ %s (%s) does not have a demand prediction model. " +
                    "Supported product codes: %s.", item.getName(), code, String.join(", ", ML_PRODUCT_CODES)));
        }

        return callDemandPrediction(code, item.getName(), item);
    }

    private AssistantQueryResponse callDemandPrediction(String productCode, String displayName, Item item) {
        try {
            MedicineDemandPredictionRequest req = new MedicineDemandPredictionRequest(productCode);
            MedicineDemandPredictionResponse prediction = medicineDemandPredictionService.predictMedicineDemand(req);

            StringBuilder sb = new StringBuilder();
            sb.append(String.format("%s (%s)\n\n", displayName, productCode));
            if (item != null) {
                sb.append(String.format("Current Stock: %d units\n",
                        item.getQuantity() != null ? item.getQuantity() : 0));
            }
            sb.append(String.format("Latest observed demand: %.4f units\n", prediction.getLatestObservedDemand()));
            sb.append(String.format("Predicted next-hour demand: %.4f units\n\n", prediction.getPredictedNextHourDemand()));
            sb.append("Prediction source: StockUp Random Forest v2 demand model.");

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("medicineName", displayName);
            data.put("productCode", productCode);
            if (item != null) data.put("currentStock", item.getQuantity());
            data.put("latestObservedDemand", prediction.getLatestObservedDemand());
            data.put("predictedNextHourDemand", prediction.getPredictedNextHourDemand());
            data.put("latestTimestamp", prediction.getLatestTimestamp());

            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION, sb.toString().trim(), data);
        } catch (Exception e) {
            logger.warn("Demand prediction failed for {}: {}", productCode, e.getMessage());
            return new AssistantQueryResponse(INTENT_DEMAND_PREDICTION,
                    "⚠️ The demand prediction service is temporarily unavailable. " +
                    "Please ensure the ML service (FastAPI :8001) is running.");
        }
    }

    private String extractProductCodeFromMessage(String msg) {
        for (String code : ML_PRODUCT_CODES) {
            if (msg.contains(code.toLowerCase())) return code;
        }
        return null;
    }

    /** INTENT: STOCKOUT_RISK — uses StockoutPredictionService + real DB quantities + demand predictions */
    private AssistantQueryResponse handleStockoutRisk() {
        List<Item> allItems = itemRepository.findAll();
        List<Map<String, Object>> risks = new ArrayList<>();
        StringBuilder sb = new StringBuilder("🚨 Stock-out Risk Analysis\n\n");
        boolean anyFound = false;

        for (Item item : allItems) {
            if (item.getCode() == null || !ML_PRODUCT_CODES.contains(item.getCode().toUpperCase())) {
                continue; // Only items with an ML product code can be predicted
            }

            int currentQty = item.getQuantity() != null ? item.getQuantity() : 0;
            double predictedDemand = 1.0; // fallback

            try {
                MedicineDemandPredictionRequest req = new MedicineDemandPredictionRequest(
                        item.getCode().toUpperCase(Locale.ROOT));
                MedicineDemandPredictionResponse pred = medicineDemandPredictionService.predictMedicineDemand(req);
                predictedDemand = pred.getPredictedNextHourDemand();
            } catch (Exception e) {
                logger.debug("Demand prediction unavailable for {}, using qty only", item.getCode());
                predictedDemand = Math.max(1, currentQty * 0.1); // rough fallback
            }

            StockoutRequest stockoutReq = new StockoutRequest(
                    item.getName(),
                    currentQty,
                    Math.max(1, (int) Math.round(predictedDemand))
            );
            StockoutResponse result = stockoutPredictionService.calculateStockoutRisk(stockoutReq);

            if (!"LOW".equals(result.getRiskLevel())) {
                anyFound = true;
                sb.append(String.format("• %s (%s) — %s RISK (stock: %d units, predicted demand: %.1f)\n",
                        item.getName(), item.getCode(),
                        result.getRiskLevel(), currentQty, predictedDemand));

                Map<String, Object> r = new LinkedHashMap<>();
                r.put("medicineName", item.getName());
                r.put("productCode", item.getCode());
                r.put("currentStock", currentQty);
                r.put("predictedDemand", predictedDemand);
                r.put("riskLevel", result.getRiskLevel());
                r.put("recommendation", result.getRecommendation());
                risks.add(r);
            }
        }

        if (!anyFound) {
            sb.append("✅ No medicines are currently at HIGH or MEDIUM stock-out risk.");
        }
        sb.append("\nSource: StockUp StockoutPredictionService + inventory database.");
        return new AssistantQueryResponse(INTENT_STOCKOUT_RISK, sb.toString().trim(),
                risks.isEmpty() ? null : risks);
    }

    /** INTENT: REORDER — delegates to ReorderOptimizationService */
    private AssistantQueryResponse handleReorder(String normalized, String original) {
        Item item = resolveItemFromMessage(normalized);

        // Specific medicine reorder
        if (item != null) {
            return handleSingleReorder(item);
        }

        // General reorder recommendation — all low-stock items
        List<Item> allItems = itemRepository.findAll();
        List<Item> needReorder = allItems.stream()
                .filter(i -> i.getQuantity() != null && i.getQuantity() <= 20)
                .collect(Collectors.toList());

        if (needReorder.isEmpty()) {
            return new AssistantQueryResponse(INTENT_REORDER,
                    "✅ No medicines currently require immediate reordering (all above 20 units).\n\n" +
                    "Source: StockUp ReorderOptimizationService.");
        }

        StringBuilder sb = new StringBuilder("📦 Reorder Recommendations\n\n");
        List<Map<String, Object>> reorders = new ArrayList<>();

        for (Item low : needReorder) {
            try {
                double demandEstimate = 50.0; // reasonable default
                if (low.getCode() != null && ML_PRODUCT_CODES.contains(low.getCode().toUpperCase())) {
                    try {
                        MedicineDemandPredictionRequest req = new MedicineDemandPredictionRequest(
                                low.getCode().toUpperCase(Locale.ROOT));
                        MedicineDemandPredictionResponse pred = medicineDemandPredictionService.predictMedicineDemand(req);
                        // Scale hourly to daily (24h)
                        demandEstimate = pred.getPredictedNextHourDemand() * 24;
                    } catch (Exception ignored) {}
                }

                ReorderRequest reorderReq = new ReorderRequest();
                reorderReq.setMedicineName(low.getName());
                reorderReq.setPredictedDemand((int) Math.max(1, Math.round(demandEstimate)));

                com.stockup.backend.dto.DynamicReorderResponse resp = reorderOptimizationService.optimizeReorder(reorderReq);

                sb.append(String.format("• %s (%s)\n  Current: %d | Safety Stock: %.1f | Reorder Qty: %d | Est. Cost: $%.2f\n",
                        low.getName(),
                        low.getCode() != null ? low.getCode() : "—",
                        low.getQuantity(),
                        resp.getSafetyStock(),
                        resp.getReorderQuantity(),
                        resp.getEstimatedCost()));

                Map<String, Object> r = new LinkedHashMap<>();
                r.put("medicineName", low.getName());
                r.put("productCode", low.getCode());
                r.put("currentStock", low.getQuantity());
                r.put("safetyStock", resp.getSafetyStock());
                r.put("reorderPoint", resp.getReorderPoint());
                r.put("reorderQuantity", resp.getReorderQuantity());
                r.put("unitPrice", resp.getUnitPrice());
                r.put("totalEstimatedCost", resp.getEstimatedCost());
                reorders.add(r);
            } catch (Exception e) {
                sb.append(String.format("• %s — reorder calculation unavailable\n", low.getName()));
                logger.warn("Reorder calculation failed for {}: {}", low.getName(), e.getMessage());
            }
        }

        sb.append("\nSource: StockUp ReorderOptimizationService + inventory database.");
        return new AssistantQueryResponse(INTENT_REORDER, sb.toString().trim(), reorders);
    }

    private AssistantQueryResponse handleSingleReorder(Item item) {
        double demandEstimate = 50.0;
        if (item.getCode() != null && ML_PRODUCT_CODES.contains(item.getCode().toUpperCase())) {
            try {
                MedicineDemandPredictionRequest req = new MedicineDemandPredictionRequest(
                        item.getCode().toUpperCase(Locale.ROOT));
                MedicineDemandPredictionResponse pred = medicineDemandPredictionService.predictMedicineDemand(req);
                demandEstimate = pred.getPredictedNextHourDemand() * 24;
            } catch (Exception ignored) {}
        }

        try {
            ReorderRequest reorderReq = new ReorderRequest();
            reorderReq.setMedicineName(item.getName());
            reorderReq.setPredictedDemand((int) Math.max(1, Math.round(demandEstimate)));

            com.stockup.backend.dto.DynamicReorderResponse resp = reorderOptimizationService.optimizeReorder(reorderReq);

            String answer = String.format(
                    "%s (%s) — Reorder Calculation\n\n" +
                    "Current Stock: %d units\n" +
                    "Predicted Daily Demand: %.0f units\n" +
                    "Dynamic Safety Stock: %.2f units (Z=%.3f × σ=%.4f × √LT=%.0fh)\n" +
                    "Reorder Point: %.2f units\n" +
                    "Target Stock: %.0f units\n" +
                    "Recommended Reorder Quantity: %d units\n" +
                    "Unit Price: $%.2f\n" +
                    "Total Estimated Cost: $%.2f\n\n" +
                    "Source: StockUp ReorderOptimizationService (Dynamic Safety Stock).",
                    item.getName(),
                    item.getCode() != null ? item.getCode() : "—",
                    item.getQuantity() != null ? item.getQuantity() : 0,
                    demandEstimate,
                    resp.getSafetyStock(),
                    resp.getzScore(),
                    resp.getDemandStdDev(),
                    resp.getLeadTimeHours(),
                    resp.getReorderPoint(),
                    resp.getTargetStock(),
                    resp.getReorderQuantity(),
                    resp.getUnitPrice(),
                    resp.getEstimatedCost()
            );

            Map<String, Object> data = new LinkedHashMap<>();
            data.put("medicineName", item.getName());
            data.put("productCode", item.getCode());
            data.put("currentStock", item.getQuantity());
            data.put("reorderQuantity", resp.getReorderQuantity());
            data.put("unitPrice", resp.getUnitPrice());
            data.put("totalEstimatedCost", resp.getTotalEstimatedCost());

            return new AssistantQueryResponse(INTENT_REORDER, answer, data);
        } catch (Exception e) {
            logger.warn("Reorder calculation failed for {}: {}", item.getName(), e.getMessage());
            return new AssistantQueryResponse(INTENT_REORDER,
                    "⚠️ Reorder calculation is temporarily unavailable for " + item.getName() + ".");
        }
    }

    /** INTENT: INVENTORY_VALUE — sum from PostgreSQL */
    private AssistantQueryResponse handleInventoryValue() {
        List<Item> allItems = itemRepository.findAll();
        double totalValue = allItems.stream()
                .mapToDouble(item -> {
                    double qty = item.getQuantity() != null ? item.getQuantity() : 0;
                    double price = item.getPrice() != null ? item.getPrice() : 0;
                    return qty * price;
                })
                .sum();

        String answer = String.format(
                "💰 Total Inventory Value\n\nTotal Value: $%.2f\nTotal Items (SKUs): %d\n\n" +
                "Source: StockUp inventory database (quantity × unit price per item).",
                totalValue, allItems.size()
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalInventoryValue", totalValue);
        data.put("totalItems", allItems.size());

        return new AssistantQueryResponse(INTENT_INVENTORY_VALUE, answer, data);
    }

    /** INTENT: INVENTORY_SUMMARY — delegates to InventoryHealthService */
    private AssistantQueryResponse handleInventorySummary() {
        DashboardSummaryDTO summary = inventoryHealthService.getDashboardSummary();

        StringBuilder sb = new StringBuilder("📊 StockUp Inventory Summary\n\n");
        sb.append(String.format("Total Items (SKUs): %d\n", summary.getTotalItems()));
        sb.append(String.format("Total Inventory Value: $%.2f\n", summary.getTotalInventoryValue()));
        sb.append(String.format("Critically Low Stock Items (≤ 20 units): %d\n", summary.getLowStockItemsCount()));
        sb.append(String.format("Critical Expiry Items (< 30 days): %d\n", summary.getCriticalExpiryItemsCount()));
        sb.append(String.format("Spoilage Risk Value: $%.2f\n\n", summary.getSpoilageRiskValue()));

        if (summary.getActionItems() != null && !summary.getActionItems().isEmpty()) {
            sb.append("AI Recommended Actions:\n");
            for (ActionItemDTO action : summary.getActionItems()) {
                sb.append(String.format("• [%s] %s\n", action.getType(), action.getMessage()));
            }
        }

        sb.append("\nSource: StockUp InventoryHealthService (PostgreSQL).");
        return new AssistantQueryResponse(INTENT_INVENTORY_SUMMARY, sb.toString().trim(), summary);
    }

    /** INTENT: MEDICINE_SEARCH — retrieve full item details from PostgreSQL */
    private AssistantQueryResponse handleMedicineSearch(String normalized, String original) {
        Item item = resolveItemFromMessage(normalized);
        if (item == null) {
            return handleUnknown(original);
        }

        String answer = String.format(
                "📋 %s (%s)\n\n" +
                "Category: %s\n" +
                "Manufacturer: %s\n" +
                "Description: %s\n" +
                "Unit Price: $%.2f\n" +
                "Selling Price: $%.2f\n" +
                "Current Stock: %d units\n" +
                "Expiry Date: %s\n" +
                "Status: %s\n\n" +
                "Source: StockUp inventory database.",
                item.getName(),
                item.getCode() != null ? item.getCode() : "—",
                item.getCategory() != null ? item.getCategory() : "Not specified",
                item.getManufacturer() != null ? item.getManufacturer() : "Not specified",
                item.getDescription() != null ? item.getDescription() : "Not specified",
                item.getPrice() != null ? item.getPrice() : 0.0,
                item.getSellingPrice() != null ? item.getSellingPrice() : 0.0,
                item.getQuantity() != null ? item.getQuantity() : 0,
                item.getExpiryDate() != null ? item.getExpiryDate() : "Not specified",
                item.getStatus() != null ? item.getStatus() : "Unknown"
        );

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("medicineName", item.getName());
        data.put("productCode", item.getCode());
        data.put("category", item.getCategory());
        data.put("manufacturer", item.getManufacturer());
        data.put("unitPrice", item.getPrice());
        data.put("sellingPrice", item.getSellingPrice());
        data.put("quantity", item.getQuantity());
        data.put("expiryDate", item.getExpiryDate());
        data.put("status", item.getStatus());

        return new AssistantQueryResponse(INTENT_MEDICINE_SEARCH, answer, data);
    }

    /** INTENT: UNKNOWN — delegate to Hugging Face via python backend on port 8000 */
    private AssistantQueryResponse handleUnknown(String original) {
        try {
            String url = "http://localhost:8000/api/chat";
            PythonChatRequest chatReq = new PythonChatRequest(original);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PythonChatRequest> entity = new HttpEntity<>(chatReq, headers);
            
            ResponseEntity<PythonChatResponse> response = restTemplate.postForEntity(
                    url,
                    entity,
                    PythonChatResponse.class
            );
            
            PythonChatResponse body = response.getBody();
            if (response.getStatusCode().is2xxSuccessful() && body != null) {
                String reply = body.getReply();
                return new AssistantQueryResponse(INTENT_UNKNOWN, reply);
            }
        } catch (Exception e) {
            logger.warn("Hugging Face query failed: {}", e.getMessage());
        }
        
        return new AssistantQueryResponse(INTENT_UNKNOWN,
                "I'm the StockUp Data Assistant. I encountered an error attempting to contact the general AI assistant (Hugging Face).\n\n" +
                "I can help with inventory data:\n" +
                "• Current stock levels (e.g. 'How much Paracetamol do we have?')\n" +
                "• Low stock alerts (e.g. 'Which medicines are low in stock?')\n" +
                "• Expiry alerts (e.g. 'Which medicines expire soon?')\n" +
                "• Demand prediction (e.g. 'Predict demand for N02BE')\n" +
                "• Stock-out risk (e.g. 'Which medicines are at risk of stock-out?')\n" +
                "• Reorder optimization (e.g. 'How much Aspirin should I reorder?')\n" +
                "• Inventory value (e.g. 'What is my total inventory value?')\n" +
                "• Inventory summary (e.g. 'Give me an inventory summary')\n" +
                "• Medicine details (e.g. 'Tell me about Diazepam')");
    }

    @SuppressWarnings("unused")
    private static class PythonChatRequest {
        private String message;
        private List<Map<String, String>> history = new ArrayList<>();
        
        public PythonChatRequest(String message) {
            this.message = message;
        }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public List<Map<String, String>> getHistory() { return history; }
        public void setHistory(List<Map<String, String>> history) { this.history = history; }
    }

    @SuppressWarnings("unused")
    private static class PythonChatResponse {
        private String reply;
        private String model;

        public String getReply() { return reply; }
        public void setReply(String reply) { this.reply = reply; }
        public String getModel() { return model; }
        public void setModel(String model) { this.model = model; }
    }
}
